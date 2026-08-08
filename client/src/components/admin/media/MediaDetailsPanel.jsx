import { useEffect, useRef, useState } from "react";

import useAdminMediaItem from "../../../hooks/useAdminMediaItem";
import {
  deleteAdminMedia,
  updateAdminMedia,
} from "../../../services/adminMediaApi";
import {
  buildMediaUpdatePayload,
  createMediaFormValues,
  formatDimensions,
  formatDuration,
  formatFileSize,
  getMediaTypeLabel,
} from "../../../utils/mediaForm";
import MediaPreview from "./MediaPreview";

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function createReferenceLabel(reference) {
  return (
    reference?.title ||
    reference?.name ||
    reference?.label ||
    reference?.resourceId ||
    reference?.id ||
    "Referenced record"
  );
}

function MediaDetailsPanel({
  accessToken,
  mediaId,
  canEdit = true,
  canDelete = false,
  onChanged,
  onDeleted,
  onUnauthorized,
}) {
  const {
    media,
    usageCount,
    isReferenced,
    references,
    resourceTypes,
    isLoading,
    error,
    errorMessage,
    refreshMediaItem,
  } = useAdminMediaItem(accessToken, mediaId, {
    enabled: Boolean(mediaId),
  });

  const mutationControllerRef = useRef(null);

  const [values, setValues] = useState(() => createMediaFormValues());
  const [fieldErrors, setFieldErrors] = useState({});
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    if (!media) {
      return;
    }

    setValues(createMediaFormValues(media));
    setFieldErrors({});
    setActionError("");
    setSuccessMessage("");
    setCopyMessage("");
  }, [media]);

  useEffect(() => {
    if (error?.status === 401) {
      onUnauthorized?.();
    }
  }, [error, onUnauthorized]);

  useEffect(() => {
    return () => {
      mutationControllerRef.current?.abort();
      mutationControllerRef.current = null;
    };
  }, []);

  function handleValueChange(event) {
    const { name, type, checked, value } = event.target;

    setValues((currentValues) => ({
      ...currentValues,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!media?._id || !canEdit || isSaving || isDeleting) {
      return;
    }

    let payload;

    try {
      payload = buildMediaUpdatePayload(values);
    } catch (validationError) {
      setFieldErrors(validationError?.fieldErrors || {});
      setActionError(
        validationError instanceof Error
          ? validationError.message
          : "Please correct the Media details.",
      );

      return;
    }

    const controller = new AbortController();

    mutationControllerRef.current?.abort();
    mutationControllerRef.current = controller;

    setIsSaving(true);
    setFieldErrors({});
    setActionError("");
    setSuccessMessage("");

    try {
      const response = await updateAdminMedia(accessToken, media._id, payload, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setSuccessMessage(response.message || "Media updated successfully.");

      setValues(createMediaFormValues(response.media));

      await refreshMediaItem();

      onChanged?.(
        response.media,
        response.message || "Media updated successfully.",
      );
    } catch (requestError) {
      if (controller.signal.aborted || requestError?.name === "AbortError") {
        return;
      }

      if (requestError?.status === 401) {
        onUnauthorized?.();
        return;
      }

      setFieldErrors(requestError?.fieldErrors || {});

      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Media could not be updated.",
      );
    } finally {
      if (mutationControllerRef.current === controller) {
        mutationControllerRef.current = null;
        setIsSaving(false);
      }
    }
  }

  async function handleDelete() {
    if (!media?._id || !canDelete || isReferenced || isSaving || isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete "${media.title}"?\n\nThis will also delete the stored Cloudinary asset and cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    const controller = new AbortController();

    mutationControllerRef.current?.abort();
    mutationControllerRef.current = controller;

    setIsDeleting(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const response = await deleteAdminMedia(accessToken, media._id, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      onDeleted?.(
        response.deletedMedia,
        response.message || "Media permanently deleted.",
      );
    } catch (requestError) {
      if (controller.signal.aborted || requestError?.name === "AbortError") {
        return;
      }

      if (requestError?.status === 401) {
        onUnauthorized?.();
        return;
      }

      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Media could not be deleted.",
      );

      await refreshMediaItem();
    } finally {
      if (mutationControllerRef.current === controller) {
        mutationControllerRef.current = null;
        setIsDeleting(false);
      }
    }
  }

  async function handleCopyUrl() {
    if (!media?.url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(media.url);
      setCopyMessage("URL copied.");
    } catch {
      setCopyMessage("Could not copy URL automatically.");
    }
  }

  function handleOpenAsset() {
    if (!media?.url) {
      return;
    }

    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      setCopyMessage(
        "Browser blocked the preview window. Allow pop-ups and try again.",
      );

      return;
    }

    previewWindow.opener = null;

    const previewDocument = previewWindow.document;

    previewDocument.title =
      media.title || media.originalName || "Media Preview";

    previewDocument.body.innerHTML = "";

    Object.assign(previewDocument.body.style, {
      margin: "0",
      minHeight: "100vh",
      background: "#0f172a",
      color: "#ffffff",
      display: "grid",
      placeItems: "center",
      fontFamily: "Arial, sans-serif",
    });

    let previewElement = null;

    if (media.mediaType === "image" || media.mediaType === "svg") {
      previewElement = previewDocument.createElement("img");

      previewElement.src = media.url;

      previewElement.alt = media.isDecorative
        ? ""
        : media.altText || media.title || "Media preview";

      Object.assign(previewElement.style, {
        display: "block",
        maxWidth: "100vw",
        maxHeight: "100vh",
        objectFit: "contain",
      });
    } else if (media.mediaType === "video") {
      previewElement = previewDocument.createElement("video");

      previewElement.src = media.url;

      previewElement.controls = true;

      previewElement.autoplay = false;

      Object.assign(previewElement.style, {
        maxWidth: "100vw",
        maxHeight: "100vh",
      });
    } else if (media.mediaType === "audio") {
      previewElement = previewDocument.createElement("audio");

      previewElement.src = media.url;

      previewElement.controls = true;

      Object.assign(previewElement.style, {
        width: "min(700px, 90vw)",
      });
    } else if (media.mediaType === "document") {
      previewElement = previewDocument.createElement("iframe");

      previewElement.src = media.url;

      previewElement.title = media.title || "PDF preview";

      Object.assign(previewElement.style, {
        width: "100vw",
        height: "100vh",
        border: "0",
        background: "#ffffff",
      });
    }

    if (!previewElement) {
      previewWindow.location.href = media.url;

      return;
    }

    previewDocument.body.appendChild(previewElement);
  }

  async function handleDownloadAsset() {
    if (!media?.url) {
      return;
    }

    setCopyMessage("Preparing download...");

    try {
      const response = await fetch(media.url);

      if (!response.ok) {
        throw new Error("Download request failed.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");

      downloadLink.href = objectUrl;
      downloadLink.download =
        media.originalName || media.fileName || "media-file";

      document.body.appendChild(downloadLink);

      downloadLink.click();
      downloadLink.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);

      setCopyMessage("Download started.");
    } catch {
      const fallbackLink = document.createElement("a");

      fallbackLink.href = media.url;
      fallbackLink.download =
        media.originalName || media.fileName || "media-file";

      fallbackLink.rel = "noopener noreferrer";

      document.body.appendChild(fallbackLink);

      fallbackLink.click();
      fallbackLink.remove();

      setCopyMessage("Download started.");
    }
  }

  if (!mediaId) {
    return (
      <aside className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-500">
          M
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-950">
          Select a Media asset
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Choose an item from the library to preview, edit metadata and review
          its current usage.
        </p>
      </aside>
    );
  }

  if (isLoading) {
    return (
      <aside className="grid min-h-72 place-items-center rounded-3xl border border-slate-200 bg-white p-8">
        <div className="text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading Media details...
          </p>
        </div>
      </aside>
    );
  }

  if (errorMessage || !media) {
    return (
      <aside className="rounded-3xl border border-red-200 bg-white p-6">
        <p className="font-bold text-red-700">
          Media details could not be loaded.
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {errorMessage || "Media record was not found."}
        </p>
      </aside>
    );
  }

  const dimensions = formatDimensions(media.width, media.height);
  const duration = formatDuration(media.duration);

  return (
    <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <MediaPreview media={media} />

      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
              {getMediaTypeLabel(media.mediaType)}
            </span>

            <h2 className="mt-3 break-words text-xl font-bold text-slate-950">
              {media.title}
            </h2>

            <p className="mt-1 break-all text-xs text-slate-500">
              {media.originalName}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-slate-500">Size</dt>
            <dd className="text-right font-semibold text-slate-800">
              {formatFileSize(media.size)}
            </dd>
          </div>

          {dimensions && (
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-slate-500">Dimensions</dt>
              <dd className="text-right font-semibold text-slate-800">
                {dimensions}
              </dd>
            </div>
          )}

          {duration && (
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-slate-500">Duration</dt>
              <dd className="text-right font-semibold text-slate-800">
                {duration}
              </dd>
            </div>
          )}

          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-slate-500">MIME</dt>
            <dd className="break-all text-right font-semibold text-slate-800">
              {media.mimeType}
            </dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="font-semibold text-slate-500">Uploaded</dt>
            <dd className="text-right font-semibold text-slate-800">
              {formatDateTime(media.createdAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
          >
            Copy URL
          </button>

          <button
            type="button"
            onClick={handleOpenAsset}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
          >
            Open Asset
          </button>

          <button
            type="button"
            onClick={handleDownloadAsset}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
          >
            Download
          </button>
        </div>

        {copyMessage && (
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {copyMessage}
          </p>
        )}

        <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold text-slate-950">Usage</h3>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                isReferenced
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {usageCount} reference{usageCount === 1 ? "" : "s"}
            </span>
          </div>

          {resourceTypes.length > 0 && (
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Used by: {resourceTypes.join(", ")}
            </p>
          )}

          {references.length > 0 && (
            <ul className="mt-3 space-y-2">
              {references.map((reference, index) => (
                <li
                  key={`${reference?.resourceId || "reference"}-${index}`}
                  className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600"
                >
                  <span className="font-semibold text-slate-800">
                    {createReferenceLabel(reference)}
                  </span>

                  {(reference?.fieldPath ||
                    reference?.field ||
                    reference?.path) && (
                    <span className="ml-2 text-slate-400">
                      ·{" "}
                      {reference.fieldPath || reference.field || reference.path}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isReferenced && (
            <p className="mt-3 text-xs font-semibold leading-5 text-amber-700">
              This asset cannot be permanently deleted while it is referenced by
              website content.
            </p>
          )}
        </div>

        <form onSubmit={handleSave} className="mt-7">
          <h3 className="text-lg font-bold text-slate-950">Media Metadata</h3>

          <div className="mt-4 grid gap-4">
            <div>
              <label
                htmlFor="media-detail-title"
                className="text-sm font-semibold text-slate-700"
              >
                Title
              </label>

              <input
                id="media-detail-title"
                name="title"
                value={values.title}
                onChange={handleValueChange}
                disabled={!canEdit || isSaving || isDeleting}
                maxLength={180}
                className="mt-2 min-h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
              />

              {fieldErrors.title && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            {(media.mediaType === "image" || media.mediaType === "svg") && (
              <>
                <div>
                  <label
                    htmlFor="media-detail-alt"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Alternative Text
                  </label>

                  <input
                    id="media-detail-alt"
                    name="altText"
                    value={values.altText}
                    onChange={handleValueChange}
                    disabled={
                      !canEdit || isSaving || isDeleting || values.isDecorative
                    }
                    maxLength={300}
                    className="mt-2 min-h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
                  />
                </div>

                <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                  <input
                    name="isDecorative"
                    type="checkbox"
                    checked={values.isDecorative}
                    onChange={handleValueChange}
                    disabled={!canEdit || isSaving || isDeleting}
                    className="mt-1 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />

                  <span className="text-sm font-semibold text-slate-700">
                    Decorative image
                  </span>
                </label>
              </>
            )}

            <div>
              <label
                htmlFor="media-detail-folder"
                className="text-sm font-semibold text-slate-700"
              >
                Folder
              </label>

              <input
                id="media-detail-folder"
                name="folder"
                value={values.folder}
                onChange={handleValueChange}
                disabled={!canEdit || isSaving || isDeleting}
                maxLength={200}
                className="mt-2 min-h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
              />

              {fieldErrors.folder && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {fieldErrors.folder}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="media-detail-tags"
                className="text-sm font-semibold text-slate-700"
              >
                Tags
              </label>

              <input
                id="media-detail-tags"
                name="tagsText"
                value={values.tagsText}
                onChange={handleValueChange}
                disabled={!canEdit || isSaving || isDeleting}
                className="mt-2 min-h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
              />

              {fieldErrors.tags && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {fieldErrors.tags}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="media-detail-caption"
                className="text-sm font-semibold text-slate-700"
              >
                Caption
              </label>

              <textarea
                id="media-detail-caption"
                name="caption"
                rows={3}
                value={values.caption}
                onChange={handleValueChange}
                disabled={!canEdit || isSaving || isDeleting}
                maxLength={500}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="media-detail-description"
                className="text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="media-detail-description"
                name="description"
                rows={4}
                value={values.description}
                onChange={handleValueChange}
                disabled={!canEdit || isSaving || isDeleting}
                maxLength={3000}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
              />
            </div>
          </div>

          {successMessage && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {successMessage}
            </div>
          )}

          {actionError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {actionError}
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={!canEdit || isSaving || isDeleting}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Metadata"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || isReferenced || isSaving || isDeleting}
              title={
                isReferenced
                  ? "Remove all content references before deleting this asset"
                  : canDelete
                    ? "Permanently delete Media"
                    : "Your role cannot permanently delete Media"
              }
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}

export default MediaDetailsPanel;
