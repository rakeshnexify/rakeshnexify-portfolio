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
    <details className="admin-media-upload overflow-hidden rounded-xl">
      <summary className="admin-media-upload-summary flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <span className="block text-sm font-bold">
            Upload Media
          </span>

          <span className="mt-0.5 block truncate text-[11px]">
            Images, SVG, PDF, audio and video
          </span>
        </div>

        <span
          aria-hidden="true"
          className="admin-media-upload-plus flex size-8 shrink-0 items-center justify-center rounded-lg text-lg font-medium"
        >
          +
        </span>
      </summary>

      <div className="admin-media-upload-body border-t px-4 py-4">
        {!canUpload ? (
          <div className="admin-media-warning rounded-lg px-3 py-2 text-xs font-semibold">
            Your Admin role can view Media but cannot upload or edit assets.
          </div>
        ) : null}

        <form className="mt-3" onSubmit={handleSubmit}>
          <div
            className={`admin-media-dropzone rounded-xl border border-dashed px-4 py-5 text-center ${
              isDragging ? "is-dragging" : ""
            }`}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              accept={MEDIA_UPLOAD_ACCEPT}
              className="sr-only"
              disabled={!canUpload || isUploading}
              onChange={handleFileInputChange}
              ref={fileInputRef}
              type="file"
            />

            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:text-left">
              <span
                aria-hidden="true"
                className="admin-media-file-mark flex size-10 shrink-0 items-center justify-center rounded-xl text-base font-black"
              >
                +
              </span>

              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {selectedFile
                    ? selectedFile.name
                    : "Drop file here or choose from device"}
                </p>

                <p className="mt-0.5 text-[11px]">
                  {selectedFile
                    ? formatFileSize(selectedFile.size)
                    : "Image 10 MB · SVG 5 MB · PDF 20 MB · Audio 50 MB · Video 100 MB"}
                </p>
              </div>

              <button
                className="admin-media-secondary-button mt-2 inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg px-3 text-xs font-semibold sm:ml-auto sm:mt-0"
                disabled={!canUpload || isUploading}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Choose File
              </button>
            </div>

            {fieldErrors.file ? (
              <p className="mt-2 text-xs font-semibold text-rose-400">
                {fieldErrors.file}
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1.5 text-[11px] font-semibold">
              Title
              <input
                className="admin-media-input min-h-10 rounded-lg px-3 text-sm outline-none"
                disabled={!canUpload || isUploading}
                id="media-upload-title"
                maxLength={180}
                name="title"
                onChange={handleValueChange}
                value={values.title}
              />

              {fieldErrors.title ? (
                <span className="text-[10px] text-rose-400">
                  {fieldErrors.title}
                </span>
              ) : null}
            </label>

            <label className="grid gap-1.5 text-[11px] font-semibold">
              Folder
              <input
                className="admin-media-input min-h-10 rounded-lg px-3 text-sm outline-none"
                disabled={!canUpload || isUploading}
                id="media-upload-folder"
                maxLength={200}
                name="folder"
                onChange={handleValueChange}
                placeholder="projects/covers"
                value={values.folder}
              />

              {fieldErrors.folder ? (
                <span className="text-[10px] text-rose-400">
                  {fieldErrors.folder}
                </span>
              ) : null}
            </label>

            <label className="grid gap-1.5 text-[11px] font-semibold">
              Alternative Text
              <input
                className="admin-media-input min-h-10 rounded-lg px-3 text-sm outline-none"
                disabled={
                  !canUpload ||
                  isUploading ||
                  values.isDecorative
                }
                id="media-upload-alt"
                maxLength={300}
                name="altText"
                onChange={handleValueChange}
                value={values.altText}
              />

              {fieldErrors.altText ? (
                <span className="text-[10px] text-rose-400">
                  {fieldErrors.altText}
                </span>
              ) : null}
            </label>

            <label className="grid gap-1.5 text-[11px] font-semibold">
              Tags
              <input
                className="admin-media-input min-h-10 rounded-lg px-3 text-sm outline-none"
                disabled={!canUpload || isUploading}
                id="media-upload-tags"
                name="tagsText"
                onChange={handleValueChange}
                placeholder="portfolio, cover"
                value={values.tagsText}
              />

              {fieldErrors.tags ? (
                <span className="text-[10px] text-rose-400">
                  {fieldErrors.tags}
                </span>
              ) : null}
            </label>
          </div>

          <details className="admin-media-upload-advanced mt-3 rounded-lg">
            <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold">
              More metadata
            </summary>

            <div className="grid gap-3 border-t px-3 py-3 md:grid-cols-2">
              <label className="admin-media-check flex items-start gap-2 rounded-lg px-3 py-2.5 md:col-span-2">
                <input
                  checked={values.isDecorative}
                  className="mt-0.5 size-4"
                  disabled={!canUpload || isUploading}
                  name="isDecorative"
                  onChange={handleValueChange}
                  type="checkbox"
                />

                <span>
                  <span className="block text-xs font-semibold">
                    Decorative image
                  </span>

                  <span className="mt-0.5 block text-[10px]">
                    Use when the image adds no meaningful information.
                  </span>
                </span>
              </label>

              <label className="grid gap-1.5 text-[11px] font-semibold">
                Caption
                <textarea
                  className="admin-media-input min-h-20 rounded-lg px-3 py-2 text-sm outline-none"
                  disabled={!canUpload || isUploading}
                  id="media-upload-caption"
                  maxLength={500}
                  name="caption"
                  onChange={handleValueChange}
                  rows={2}
                  value={values.caption}
                />

                {fieldErrors.caption ? (
                  <span className="text-[10px] text-rose-400">
                    {fieldErrors.caption}
                  </span>
                ) : null}
              </label>

              <label className="grid gap-1.5 text-[11px] font-semibold">
                Description
                <textarea
                  className="admin-media-input min-h-20 rounded-lg px-3 py-2 text-sm outline-none"
                  disabled={!canUpload || isUploading}
                  id="media-upload-description"
                  maxLength={3000}
                  name="description"
                  onChange={handleValueChange}
                  rows={2}
                  value={values.description}
                />

                {fieldErrors.description ? (
                  <span className="text-[10px] text-rose-400">
                    {fieldErrors.description}
                  </span>
                ) : null}
              </label>
            </div>
          </details>

          {isUploading ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>

              <div className="admin-media-progress mt-1.5 h-1.5 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${uploadProgress}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <div
              className="admin-media-error mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="admin-media-primary-button inline-flex min-h-9 items-center justify-center rounded-lg px-4 text-xs font-bold"
              disabled={!canUpload || isUploading}
              type="submit"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>

            {isUploading ? (
              <button
                className="admin-media-danger-button inline-flex min-h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold"
                onClick={cancelUpload}
                type="button"
              >
                Cancel
              </button>
            ) : (
              <button
                className="admin-media-secondary-button inline-flex min-h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold"
                disabled={!canUpload}
                onClick={resetForm}
                type="button"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>
    </details>
  );
}

export default MediaUploadPanel;