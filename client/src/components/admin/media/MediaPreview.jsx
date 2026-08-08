import {
  getMediaPreviewKind,
  getMediaTypeLabel,
} from "../../../utils/mediaForm";

function MediaFallback({ media, compact = false }) {
  const mediaTypeLabel = getMediaTypeLabel(media?.mediaType);

  return (
    <div
      className={`grid size-full place-items-center bg-slate-900 text-center text-white ${
        compact ? "p-4" : "p-8"
      }`}
    >
      <div>
        <div
          className={`mx-auto grid place-items-center rounded-2xl bg-white/10 font-black text-white ${
            compact ? "size-12 text-lg" : "size-16 text-2xl"
          }`}
        >
          {mediaTypeLabel.slice(0, 2).toUpperCase()}
        </div>

        <p
          className={`font-semibold text-white ${
            compact ? "mt-3 text-xs" : "mt-4 text-sm"
          }`}
        >
          {mediaTypeLabel}
        </p>

        {!compact && media?.originalName && (
          <p className="mt-2 max-w-xs break-all text-xs leading-5 text-slate-400">
            {media.originalName}
          </p>
        )}
      </div>
    </div>
  );
}

function ImagePreview({ media, compact }) {
  const altText = media?.isDecorative
    ? ""
    : media?.altText || media?.title || media?.originalName || "Media preview";

  return (
    <div className="relative size-full overflow-hidden bg-slate-100">
      <MediaFallback media={media} compact={compact} />

      <img
        src={media.url}
        alt={altText}
        className="absolute inset-0 size-full object-contain"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.hidden = true;
        }}
      />
    </div>
  );
}

function VideoPreview({ media, compact }) {
  if (compact) {
    return (
      <div className="relative size-full overflow-hidden bg-slate-950">
        <video
          src={media.url}
          preload="metadata"
          muted
          playsInline
          className="size-full object-cover"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />

        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-950/20">
          <span className="grid size-11 place-items-center rounded-full bg-white/90 text-sm font-black text-slate-950 shadow">
            ▶
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid size-full place-items-center bg-slate-950 p-4">
      <video
        src={media.url}
        controls
        preload="metadata"
        playsInline
        className="max-h-full max-w-full rounded-xl"
      >
        Your browser does not support this video.
      </video>
    </div>
  );
}

function AudioPreview({ media, compact }) {
  if (compact) {
    return (
      <div className="grid size-full place-items-center bg-gradient-to-br from-violet-950 via-slate-950 to-brand-950 p-5 text-center text-white">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/10 text-xl font-black">
            ♪
          </div>

          <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-violet-200">
            Audio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid size-full place-items-center bg-gradient-to-br from-violet-950 via-slate-950 to-brand-950 p-6">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/10 text-3xl font-black text-white">
          ♪
        </div>

        <p className="mt-4 break-words font-semibold text-white">
          {media?.title || media?.originalName || "Audio file"}
        </p>

        <audio
          src={media.url}
          controls
          preload="metadata"
          className="mt-6 w-full"
        >
          Your browser does not support this audio.
        </audio>
      </div>
    </div>
  );
}

function DocumentPreview({ media, compact }) {
  if (compact) {
    return (
      <div className="grid size-full place-items-center bg-gradient-to-br from-red-50 to-slate-100 p-5 text-center">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-100 text-sm font-black text-red-700">
            PDF
          </div>

          <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
            Document
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid size-full place-items-center bg-slate-100 p-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-red-50 text-xl font-black text-red-700">
          PDF
        </div>

        <h3 className="mt-5 break-words text-lg font-bold text-slate-950">
          {media?.title || media?.originalName || "PDF document"}
        </h3>

        {media?.originalName && (
          <p className="mt-2 break-all text-sm text-slate-500">
            {media.originalName}
          </p>
        )}

        <a
          href={media?.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Open PDF
        </a>
      </div>
    </div>
  );
}

function MediaPreview({ media, compact = false, className = "" }) {
  const previewKind = getMediaPreviewKind(media);

  const baseClassName = compact
    ? "aspect-[4/3] w-full overflow-hidden"
    : "min-h-64 w-full overflow-hidden";

  if (!media?.url) {
    return (
      <div className={`${baseClassName} ${className}`}>
        <MediaFallback media={media} compact={compact} />
      </div>
    );
  }

  return (
    <div className={`${baseClassName} ${className}`}>
      {previewKind === "image" && (
        <ImagePreview media={media} compact={compact} />
      )}

      {previewKind === "video" && (
        <VideoPreview media={media} compact={compact} />
      )}

      {previewKind === "audio" && (
        <AudioPreview media={media} compact={compact} />
      )}

      {previewKind === "document" && (
        <DocumentPreview media={media} compact={compact} />
      )}

      {previewKind === "unknown" && (
        <MediaFallback media={media} compact={compact} />
      )}
    </div>
  );
}

export default MediaPreview;
