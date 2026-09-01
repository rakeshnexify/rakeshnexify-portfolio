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
$RemoteDeployRoot = "/home8/uniquick/rakeshnexify-deploy"

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

Write-Host "==> Verifying local repository"
Set-Location $Repo

$branch = (& git branch --show-current).Trim()
if ($branch -ne "main") {
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
        if ($text -match "(?i)(?:https?://)?localhost:5000(?:/|\\b)") {
            $bad += $_.FullName
        }
    }

if ($bad.Count -gt 0) {
    throw "Localhost reference found in production bundle: $($bad -join ', ')"
}

Write-Host "==> Verifying production SSH"
Invoke-Ssh "test -d '$RemoteRepo/.git' && test -d '/home8/uniquick/rakeshnexify-app' && test -f '/home8/uniquick/rakeshnexify-app/server/passenger.cjs'"

$tempRoot = Join-Path $env:TEMP ("rnx-deploy-" + $head)
$stage = Join-Path $tempRoot "stage"
$archive = Join-Path $tempRoot ("rnx-" + $head + ".tgz")
$gitZip = Join-Path $tempRoot "tracked.zip"

if (Test-Path $tempRoot) {
    Remove-Item $tempRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $stage -Force | Out-Null

try {
    Write-Host "==> Packaging exact Git commit + production dist"
    Run "git" @(
        "archive",
        "--format=zip",
        "--output=$gitZip",
        $head,
        "server",
        "package.json",
        "package-lock.json"
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

    $remoteArchive = "$RemoteDeployRoot/incoming/rnx-$head.tgz"

    Write-Host "==> Updating cPanel Git clone to $head"
    $updateRepo = "set -e; cd '$RemoteRepo'; test -z `"`$(git status --porcelain)`"; git fetch origin main; git checkout main >/dev/null 2>&1; git merge --ff-only origin/main; test `"`$(git rev-parse HEAD)`" = '$head'; mkdir -p '$RemoteDeployRoot/incoming'"
    Invoke-Ssh $updateRepo

    Write-Host "==> Uploading release"
    & scp -i $SshKey -P $SshPort $archive ($SshHost + ":" + $remoteArchive)
    if ($LASTEXITCODE -ne 0) {
        throw "SCP upload failed."
    }

    Write-Host "==> Deploying production"
    $remoteCommand = "bash '$RemoteRepo/scripts/deploy-production-remote.sh' '$head' '$remoteArchive'"
    Invoke-Ssh $remoteCommand

    Write-Host ""
    Write-Host "PASS: Production deployed successfully."
    Write-Host "Commit: $head"
    Write-Host "URL: https://rakeshnexify.com"
}
finally {
    if (Test-Path $tempRoot) {
        Remove-Item $tempRoot -Recurse -Force
    }
}