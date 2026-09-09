param(
    [switch]$SkipLint
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ExpectedOrigin = "https://github.com/rakeshnexify/rakeshnexify-portfolio"
$SshHost = "uniquick@uniquickmart.com"
$SshPort = 1980
$SshKey = Join-Path $env:USERPROFILE ".ssh\rakeshnexify_cpanel"
$RemoteRepo = "/home8/uniquick/rakeshnexify-repo"
$RemoteApp = "/home8/uniquick/rakeshnexify-app"
$RemoteDeployRoot = "/home8/uniquick/rakeshnexify-deploy"
$HealthUrl = "https://rakeshnexify.com/api/health"
$ExpectedHealthMessage = "RakeshNexify Portfolio API is running."

function Run([string]$File, [string[]]$CommandArgs) {
    & $File @CommandArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $File $($CommandArgs -join ' ')"
    }
}

function Invoke-Ssh([string]$Command) {
    & ssh -i $SshKey -p $SshPort $SshHost $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Remote command failed."
    }
}

function Invoke-SshCapture([string]$Command) {
    $result = & ssh -i $SshKey -p $SshPort $SshHost $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Remote command failed."
    }
    return (($result | Out-String).Trim())
}

function Test-ExternalHealth(
    [string]$Label,
    [int]$Attempts = 1,
    [int]$DelaySeconds = 0
) {
    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        try {
            $probeUrl = $HealthUrl + "?probe=" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            $response = Invoke-WebRequest `
                -Uri $probeUrl `
                -UseBasicParsing `
                -TimeoutSec 15 `
                -Headers @{ "Cache-Control" = "no-cache" }

            if ([int]$response.StatusCode -eq 200) {
                $payload = $response.Content | ConvertFrom-Json
                if ($payload.success -eq $true -and [string]$payload.message -eq $ExpectedHealthMessage) {
                    Write-Host "PASS: $Label external health ($attempt/$Attempts)"
                    return $true
                }
            }

            Write-Host "WARN: $Label external health returned an unexpected response ($attempt/$Attempts)."
        }
        catch {
            Write-Host "WARN: $Label external health failed ($attempt/$Attempts): $($_.Exception.Message)"
        }

        if ($attempt -lt $Attempts -and $DelaySeconds -gt 0) {
            Start-Sleep -Seconds $DelaySeconds
        }
    }

    return $false
}

Write-Host "==> Verifying local repository"
Set-Location $Repo

if ((& git branch --show-current).Trim() -ne "main") {
    throw "Deploy requires branch main."
}

$origin = (& git remote get-url origin).Trim().TrimEnd("/")
if ($origin.EndsWith(".git")) {
    $origin = $origin.Substring(0, $origin.Length - 4)
}
if ($origin -ne $ExpectedOrigin) {
    throw "Unexpected origin: $origin"
}

if (& git status --porcelain) {
    throw "Working tree must be clean before deployment."
}

Run "git" @("fetch", "origin", "main")

$head = (& git rev-parse HEAD).Trim()
$originHead = (& git rev-parse origin/main).Trim()
if ($head -ne $originHead) {
    throw "Local HEAD is not origin/main. Push first, then deploy."
}

$secretTracked = & git ls-files ".env" "client/.env" "server/.env"
if ($secretTracked) {
    throw "Tracked env file detected. Deployment stopped."
}

if (-not (Test-Path $SshKey)) {
    throw "SSH key not found: $SshKey"
}

if (-not $SkipLint) {
    Write-Host "==> ESLint"
    Run "npm" @("run", "lint", "--prefix", "client", "--", "--max-warnings=0")
}

Write-Host "==> Production build"
$oldApi = $env:VITE_API_URL
try {
    $env:VITE_API_URL = "/"
    Run "npm" @("run", "build")
}
finally {
    if ($null -eq $oldApi) {
        Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
    } else {
        $env:VITE_API_URL = $oldApi
    }
}

$dist = Join-Path $Repo "client\dist"
if (-not (Test-Path (Join-Path $dist "index.html"))) {
    throw "Production dist is missing."
}

Write-Host "==> Scanning production bundle"
$bad = @()
Get-ChildItem $dist -Recurse -File |
    Where-Object { $_.Extension -in @(".js", ".css", ".html", ".json", ".map", ".txt") } |
    ForEach-Object {
        $text = [System.IO.File]::ReadAllText($_.FullName)
        if ($text -match "(?i)(?:https?://)?localhost:5000(?:/|\b)") {
            $bad += $_.FullName
        }
    }

if ($bad.Count -gt 0) {
    throw "Production API localhost reference found: $($bad -join ', ')"
}

Write-Host "==> Verifying current production externally"
if (-not (Test-ExternalHealth -Label "Current production" -Attempts 3 -DelaySeconds 2)) {
    throw "Current public production is not healthy from this desktop. Deployment stopped before mutation."
}

Write-Host "==> Verifying production SSH"
Invoke-Ssh "set -e; test -d '$RemoteRepo/.git'; test -d '$RemoteApp'; test -f '$RemoteApp/server/passenger.cjs'"

$previousCommit = Invoke-SshCapture "set -e; test -f '$RemoteApp/.deployed-commit'; tr -cd '0-9a-fA-F' < '$RemoteApp/.deployed-commit'"
if ($previousCommit -notmatch '^[0-9a-fA-F]{40}$') {
    throw "Production deployed commit marker is invalid."
}

$tempRoot = Join-Path $env:TEMP ("rnx-deploy-" + $head)
$stage = Join-Path $tempRoot "stage"
$archive = Join-Path $tempRoot ("rnx-" + $head + ".tgz")
$gitZip = Join-Path $tempRoot "tracked.zip"

if (Test-Path $tempRoot) {
    Remove-Item $tempRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $stage -Force | Out-Null

$remoteArchive = "$RemoteDeployRoot/incoming/rnx-$head.tgz"
$remoteApplied = $false

try {
    Write-Host "==> Packaging exact Git server + production dist"
    Run "git" @(
        "archive",
        "--format=zip",
        "--output=$gitZip",
        $head,
        "server"
    )

    Expand-Archive -Path $gitZip -DestinationPath $stage -Force

    $clientDir = Join-Path $stage "client"
    New-Item -ItemType Directory -Path $clientDir -Force | Out-Null
    Copy-Item $dist (Join-Path $clientDir "dist") -Recurse -Force

    foreach ($path in @(
        (Join-Path $stage ".env"),
        (Join-Path $stage "client\.env"),
        (Join-Path $stage "server\.env"),
        (Join-Path $stage "server\node_modules")
    )) {
        if (Test-Path $path) {
            Remove-Item $path -Recurse -Force
        }
    }

    Run "tar" @("-czf", $archive, "-C", $stage, ".")

    Write-Host "==> Updating cPanel Git clone to $head"
    $updateRepo = "set -e; cd '$RemoteRepo'; test -z `"`$(git status --porcelain)`"; git fetch origin main; git checkout main >/dev/null 2>&1; git merge --ff-only origin/main; test `"`$(git rev-parse HEAD)`" = '$head'; mkdir -p '$RemoteDeployRoot/incoming'"
    Invoke-Ssh $updateRepo

    Write-Host "==> Uploading release"
    & scp -i $SshKey -P $SshPort $archive ($SshHost + ":" + $remoteArchive)
    if ($LASTEXITCODE -ne 0) {
        throw "SCP upload failed."
    }

    Write-Host "==> Applying production release"
    Invoke-Ssh "bash '$RemoteRepo/scripts/deploy-production-remote.sh' deploy '$head' '$remoteArchive'"
    $remoteApplied = $true

    Write-Host "==> Verifying NEW production externally"
    if (-not (Test-ExternalHealth -Label "New production" -Attempts 12 -DelaySeconds 3)) {
        Write-Host "FAIL: New production external health did not recover. Rolling back." -ForegroundColor Red

        Invoke-Ssh "bash '$RemoteRepo/scripts/deploy-production-remote.sh' rollback '$head'"
        $remoteApplied = $false

        $restoredCommit = Invoke-SshCapture "set -e; tr -cd '0-9a-fA-F' < '$RemoteApp/.deployed-commit'"
        if ($restoredCommit -ne $previousCommit) {
            throw "Rollback ran, but deployed commit marker was not restored to $previousCommit."
        }

        if (-not (Test-ExternalHealth -Label "Rolled-back production" -Attempts 8 -DelaySeconds 3)) {
            throw "CRITICAL: Release rollback completed, but restored production is not externally healthy."
        }

        throw "Deployment failed external health verification. Previous production $previousCommit was restored and verified healthy."
    }

    # Public health is now good. From this point forward, control-plane/finalize
    # failures must NOT roll back an externally healthy new release automatically.
    $remoteApplied = $false

    $deployedCommit = Invoke-SshCapture "set -e; tr -cd '0-9a-fA-F' < '$RemoteApp/.deployed-commit'"
    if ($deployedCommit -ne $head) {
        Write-Host "FAIL: External health passed but deployed commit marker is wrong. Rolling back." -ForegroundColor Red

        Invoke-Ssh "bash '$RemoteRepo/scripts/deploy-production-remote.sh' rollback '$head'"

        if (-not (Test-ExternalHealth -Label "Rolled-back production" -Attempts 8 -DelaySeconds 3)) {
            throw "CRITICAL: Commit verification failed; rollback completed but production is not externally healthy."
        }

        throw "Deployment commit marker verification failed. Previous production was restored."
    }

    Write-Host "==> Finalizing release after external health PASS"
    try {
        Invoke-Ssh "bash '$RemoteRepo/scripts/deploy-production-remote.sh' finalize '$head'"
    }
    catch {
        throw "New production is externally healthy at $head, but remote finalize/cleanup failed. No automatic rollback was attempted."
    }

    Write-Host ""
    Write-Host "PASS: Production deployed successfully."
    Write-Host "Commit: $head"
    Write-Host "URL: https://rakeshnexify.com"
}
catch {
    if ($remoteApplied) {
        Write-Host "WARN: Deployment stopped after remote apply. Attempting guarded rollback." -ForegroundColor Yellow
        try {
            Invoke-Ssh "bash '$RemoteRepo/scripts/deploy-production-remote.sh' rollback '$head'"
            $remoteApplied = $false

            $restoredCommit = Invoke-SshCapture "set -e; tr -cd '0-9a-fA-F' < '$RemoteApp/.deployed-commit'"
            if ($restoredCommit -eq $previousCommit -and
                (Test-ExternalHealth -Label "Emergency rolled-back production" -Attempts 8 -DelaySeconds 3)) {
                Write-Host "ROLLBACK PASS: Previous production restored and externally healthy." -ForegroundColor Green
            } else {
                Write-Host "ROLLBACK WARNING: Rollback action ran, but restoration could not be fully verified." -ForegroundColor Red
            }
        }
        catch {
            Write-Host "ROLLBACK CRITICAL: Automatic rollback action failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    throw
}
finally {
    if (Test-Path $tempRoot) {
        Remove-Item $tempRoot -Recurse -Force
    }
}