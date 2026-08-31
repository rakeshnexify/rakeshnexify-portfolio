import { useState } from "react";

import {
  certificationAchievementTypeLabels as typeLabels,
  getSafeHttpUrl,
} from "./CertificationAchievementCard.utils";

const typeStyles = {
  certification: "bg-blue-50 text-blue-700 ring-blue-100",
  license: "bg-violet-50 text-violet-700 ring-violet-100",
  award: "bg-amber-50 text-amber-800 ring-amber-100",
  achievement: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

function formatDateOnly(value) {
  const cleanValue = String(value || "").slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return "";
  }

  const date = new Date(`${cleanValue}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== cleanValue
  ) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function isPdfUrl(value) {
  const safeUrl = getSafeHttpUrl(value);

  if (!safeUrl) {
    return false;
  }

  try {
    return /\.pdf$/i.test(new URL(safeUrl).pathname);
  } catch {
    return false;
  }
}

function CertificationAchievementCard({
  achievement,
  compact = false,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const type = String(achievement?.type || "achievement")
    .trim()
    .toLowerCase();

  const title =
    String(achievement?.title || "").trim() ||
    "Professional Achievement";

  const issuerName = String(achievement?.issuerName || "").trim();

  const shortDescription = String(
    achievement?.shortDescription || "",
  ).trim();

  const description = String(
    achievement?.description || shortDescription,
  ).trim();

  const mediaUrl = getSafeHttpUrl(achievement?.mediaUrl);
  const verificationUrl = getSafeHttpUrl(achievement?.verificationUrl);

  const issueDate = formatDateOnly(achievement?.issueDate);
  const expirationDate = formatDateOnly(achievement?.expirationDate);

  const mediaIsPdf = isPdfUrl(mediaUrl);

  const typeLabel = typeLabels[type] || typeLabels.achievement;
  const typeStyle = typeStyles[type] || typeStyles.achievement;

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {mediaUrl && !mediaIsPdf && !imageFailed ? (
        <div className="aspect-[16/10] overflow-hidden bg-slate-100">
          <img
            src={mediaUrl}
            alt={
              String(achievement?.mediaAlt || "").trim() ||
              `${title} evidence`
            }
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white">
          <div className="absolute -right-12 -top-12 size-36 rounded-full bg-brand-600/25 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-lg font-black">
              {typeLabel.slice(0, 2).toUpperCase()}
            </div>

            {achievement?.isFeatured && (
              <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">
                Featured
              </span>
            )}
          </div>

          <p className="relative mt-6 text-sm font-semibold text-brand-300">
            {issuerName || "Independent recognition"}
          </p>

          <h3 className="relative mt-2 break-words text-xl font-black">
            {title}
          </h3>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${typeStyle}`}
          >
            {typeLabel}
          </span>

          {achievement?.isFeatured && mediaUrl && !mediaIsPdf && !imageFailed && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-100">
              Featured
            </span>
          )}

          {achievement?.doesNotExpire && (
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-100">
              No Expiration
            </span>
          )}
        </div>

        {mediaUrl && !mediaIsPdf && !imageFailed && (
          <>
            <p className="mt-5 text-sm font-semibold text-brand-600">
              {issuerName || "Independent recognition"}
            </p>

            <h3 className="mt-2 break-words text-xl font-black text-slate-950">
              {title}
            </h3>
          </>
        )}

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-500">
          {issueDate && <span>Issued {issueDate}</span>}

          {!achievement?.doesNotExpire && expirationDate && (
            <span>Expires {expirationDate}</span>
          )}
        </div>

        {(compact ? shortDescription : description) && (
          <p
            className={`mt-5 break-words whitespace-pre-line text-sm leading-7 text-slate-600 ${
              compact ? "line-clamp-4" : ""
            }`}
          >
            {compact ? shortDescription : description}
          </p>
        )}

        {achievement?.credentialId && (
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Credential ID
            </p>

            <p className="mt-2 break-all text-sm font-semibold text-slate-700">
              {achievement.credentialId}
            </p>
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          {verificationUrl && (
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Verify Credential
              <span className="sr-only"> opens in a new tab</span>
            </a>
          )}

          {mediaUrl && (
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
            >
              {mediaIsPdf ? "View Evidence PDF" : "Open Evidence"}
              <span className="sr-only"> opens in a new tab</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default CertificationAchievementCard;
