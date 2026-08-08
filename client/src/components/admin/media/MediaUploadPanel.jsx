import { useEffect, useRef, useState } from "react";

import { uploadAdminMedia } from "../../../services/adminMediaApi";
import {
  DEFAULT_MEDIA_FORM_VALUES,
  MEDIA_UPLOAD_ACCEPT,
  buildMediaUploadMetadata,
  formatFileSize,
} from "../../../utils/mediaForm";

function createEmptyFormValues() {
  return {
    ...DEFAULT_MEDIA_FORM_VALUES,
  };
}

function MediaUploadPanel({
  accessToken,
  canUpload = true,
  onUploaded,
  onUnauthorized,
}) {
  const fileInputRef = useRef(null);
  const uploadControllerRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [values, setValues] = useState(createEmptyFormValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      uploadControllerRef.current?.abort();
      uploadControllerRef.current = null;
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

  function selectFile(file) {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      file: "",
    }));
    setError("");
    setUploadProgress(0);

    setValues((currentValues) => ({
      ...currentValues,
      title:
        currentValues.title ||
        file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
    }));
  }

  function handleFileInputChange(event) {
    const file = event.target.files?.[0];

    selectFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!canUpload || isUploading) {
      return;
    }

    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    if (!canUpload || isUploading) {
      return;
    }

    selectFile(event.dataTransfer.files?.[0]);
  }

  function resetForm() {
    setSelectedFile(null);
    setValues(createEmptyFormValues());
    setFieldErrors({});
    setError("");
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function cancelUpload() {
    uploadControllerRef.current?.abort();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canUpload || isUploading) {
      return;
    }

    if (!selectedFile) {
      setFieldErrors({
        file: "Select a Media file to upload.",
      });

      return;
    }

    let metadata;

    try {
      metadata = buildMediaUploadMetadata(values);
    } catch (validationError) {
      setFieldErrors(validationError?.fieldErrors || {});
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Please correct the Media details.",
      );

      return;
    }

    const controller = new AbortController();

    uploadControllerRef.current = controller;

    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    setFieldErrors({});

    try {
      const response = await uploadAdminMedia(
        accessToken,
        selectedFile,
        metadata,
        {
          signal: controller.signal,
          onProgress: setUploadProgress,
        },
      );

      if (controller.signal.aborted) {
        return;
      }

      resetForm();

      onUploaded?.(
        response.media,
        response.message || "Media uploaded successfully.",
      );
    } catch (requestError) {
      if (controller.signal.aborted || requestError?.name === "AbortError") {
        setError("Upload cancelled.");
        return;
      }

      if (requestError?.status === 401) {
        onUnauthorized?.();
        return;
      }

      setFieldErrors(requestError?.fieldErrors || {});

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Media upload failed.",
      );
    } finally {
      if (uploadControllerRef.current === controller) {
        uploadControllerRef.current = null;
        setIsUploading(false);
      }
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
          Upload Media
        </p>

        <h2 className="mt-2 text-2xl font-black text-slate-950">
          Add a new asset
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Supported: JPG, PNG, WebP, AVIF, SVG, PDF, MP3, WAV, OGG, M4A, MP4 and
          WebM.
        </p>
      </div>

      {!canUpload && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
          Your Admin role can view Media but cannot upload or edit assets.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
            isDragging
              ? "border-brand-500 bg-brand-50"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={MEDIA_UPLOAD_ACCEPT}
            disabled={!canUpload || isUploading}
            onChange={handleFileInputChange}
            className="sr-only"
          />

          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-100 text-2xl font-black text-brand-700">
            +
          </div>

          <p className="mt-4 font-bold text-slate-950">
            Drop a file here or choose from your device
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Images 10 MB · SVG 5 MB · PDF 20 MB · Audio 50 MB · Video 100 MB
          </p>

          <button
            type="button"
            disabled={!canUpload || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Choose File
          </button>

          {selectedFile && (
            <div className="mx-auto mt-5 max-w-xl rounded-xl border border-slate-200 bg-white px-4 py-3 text-left">
              <p className="break-all text-sm font-semibold text-slate-800">
                {selectedFile.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          )}

          {fieldErrors.file && (
            <p className="mt-3 text-sm font-semibold text-red-600">
              {fieldErrors.file}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="media-upload-title"
              className="text-sm font-semibold text-slate-700"
            >
              Title
            </label>

            <input
              id="media-upload-title"
              name="title"
              value={values.title}
              onChange={handleValueChange}
              disabled={!canUpload || isUploading}
              maxLength={180}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            {fieldErrors.title && (
              <p className="mt-2 text-sm font-semibold text-red-600">
                {fieldErrors.title}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="media-upload-folder"
              className="text-sm font-semibold text-slate-700"
            >
              Folder
            </label>

            <input
              id="media-upload-folder"
              name="folder"
              value={values.folder}
              onChange={handleValueChange}
              disabled={!canUpload || isUploading}
              placeholder="projects/covers"
              maxLength={200}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            {fieldErrors.folder && (
              <p className="mt-2 text-sm font-semibold text-red-600">
                {fieldErrors.folder}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="media-upload-alt"
              className="text-sm font-semibold text-slate-700"
            >
              Alternative Text
            </label>

            <input
              id="media-upload-alt"
              name="altText"
              value={values.altText}
              onChange={handleValueChange}
              disabled={!canUpload || isUploading || values.isDecorative}
              maxLength={300}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            {fieldErrors.altText && (
              <p className="mt-2 text-sm font-semibold text-red-600">
                {fieldErrors.altText}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="media-upload-tags"
              className="text-sm font-semibold text-slate-700"
            >
              Tags
            </label>

            <input
              id="media-upload-tags"
              name="tagsText"
              value={values.tagsText}
              onChange={handleValueChange}
              disabled={!canUpload || isUploading}
              placeholder="portfolio, project, cover"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            {fieldErrors.tags && (
              <p className="mt-2 text-sm font-semibold text-red-600">
                {fieldErrors.tags}
              </p>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <input
              name="isDecorative"
              type="checkbox"
              checked={values.isDecorative}
              onChange={handleValueChange}
              disabled={!canUpload || isUploading}
              className="mt-1 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Decorative image
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Use only when the image adds no meaningful information.
              </span>
            </span>
          </label>

          <div className="md:col-span-2">
            <label
              htmlFor="media-upload-caption"
              className="text-sm font-semibold text-slate-700"
            >
              Caption
            </label>

            <textarea
              id="media-upload-caption"
              name="caption"
              rows={3}
              value={values.caption}
              onChange={handleValueChange}
              disabled={!canUpload || isUploading}
              maxLength={500}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            {fieldErrors.caption && (
              <p className="mt-2 text-sm font-semibold text-red-600">
                {fieldErrors.caption}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="media-upload-description"
              className="text-sm font-semibold text-slate-700"
            >
              Description
            </label>

            <textarea
              id="media-upload-description"
              name="description"
              rows={4}
              value={values.description}
              onChange={handleValueChange}
              disabled={!canUpload || isUploading}
              maxLength={3000}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            {fieldErrors.description && (
              <p className="mt-2 text-sm font-semibold text-red-600">
                {fieldErrors.description}
              </p>
            )}
          </div>
        </div>

        {isUploading && (
          <div className="mt-6">
            <div className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-700">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand-600 transition-[width]"
                style={{
                  width: `${uploadProgress}%`,
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!canUpload || isUploading}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Upload Media"}
          </button>

          {isUploading ? (
            <button
              type="button"
              onClick={cancelUpload}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Cancel Upload
            </button>
          ) : (
            <button
              type="button"
              onClick={resetForm}
              disabled={!canUpload}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default MediaUploadPanel;
