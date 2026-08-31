import { useState } from "react";
// rnx-site-settings-platforms-v482

import MediaField from "../media/MediaField";
import { createEmptyPlatform } from "../../../utils/siteSettingsForm";

const MAX_PLATFORMS = 25;

function getFieldError(fieldErrors, fieldName) {
  return fieldErrors?.[fieldName] || "";
}

function isSafePreviewUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function PlatformSettingsEditor({
  title,
  description,
  fieldName,
  platforms = [],
  fieldErrors = {},
  disabled = false,
  accessToken = "",
  onMediaUnauthorized,
  onChange,
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const platformItems = Array.isArray(platforms) ? platforms : [];

  function emitChange(nextPlatforms) {
    const normalizedPlatforms = nextPlatforms.map((platform, index) => ({
      ...platform,
      order: index + 1,
    }));

    onChange(normalizedPlatforms);
  }

  function updatePlatform(index, propertyName, value) {
    const nextPlatforms = platformItems.map((platform, platformIndex) => {
      if (platformIndex !== index) {
        return platform;
      }

      return {
        ...platform,
        [propertyName]: value,
      };
    });

    emitChange(nextPlatforms);
  }

  function addPlatform() {
    if (platformItems.length >= MAX_PLATFORMS) {
      return;
    }

    const newIndex = platformItems.length;

    emitChange([
      ...platformItems,
      createEmptyPlatform(newIndex + 1),
    ]);

    setExpandedIndex(newIndex);
  }

  function removePlatform(index) {
    const nextPlatforms = platformItems.filter(
      (_, platformIndex) => platformIndex !== index,
    );

    emitChange(nextPlatforms);

    setExpandedIndex((currentIndex) => {
      if (currentIndex === null) {
        return null;
      }

      if (currentIndex === index) {
        return null;
      }

      if (currentIndex > index) {
        return currentIndex - 1;
      }

      return currentIndex;
    });
  }

  function movePlatform(index, direction) {
    const destinationIndex = index + direction;

    if (destinationIndex < 0 || destinationIndex >= platformItems.length) {
      return;
    }

    const nextPlatforms = [...platformItems];

    [nextPlatforms[index], nextPlatforms[destinationIndex]] = [
      nextPlatforms[destinationIndex],
      nextPlatforms[index],
    ];

    emitChange(nextPlatforms);

    setExpandedIndex((currentIndex) => {
      if (currentIndex === index) {
        return destinationIndex;
      }

      if (currentIndex === destinationIndex) {
        return index;
      }

      return currentIndex;
    });
  }

  function togglePlatform(index) {
    setExpandedIndex((currentIndex) =>
      currentIndex === index ? null : index,
    );
  }

  const groupError = getFieldError(fieldErrors, fieldName);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
      <div className="flex flex-col gap-2.5 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>

          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
            {platformItems.length}/{MAX_PLATFORMS}
          </span>

          <button
            type="button"
            disabled={disabled || platformItems.length >= MAX_PLATFORMS}
            onClick={addPlatform}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Add Platform
          </button>
        </div>
      </div>

      {groupError && (
        <p
          role="alert"
          className="mt-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {groupError}
        </p>
      )}

      {platformItems.length === 0 ? (
        <div className="mt-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-5 dark:border-slate-700 dark:bg-slate-950/60 text-center">
          <p className="font-semibold text-slate-700">No platforms added</p>

          <p className="mt-2 text-sm text-slate-500">
            Add a platform to display its profile link on the public portfolio.
          </p>
        </div>
      ) : (
        <div className="mt-2.5 space-y-3">
          {platformItems.map((platform, index) => {
            const nameField = `${fieldName}.${index}.name`;
            const usernameField = `${fieldName}.${index}.username`;
            const urlField = `${fieldName}.${index}.url`;
            const iconField = `${fieldName}.${index}.iconUrl`;
            const visibilityField = `${fieldName}.${index}.isVisible`;

            const nameError = getFieldError(fieldErrors, nameField);
            const usernameError = getFieldError(fieldErrors, usernameField);
            const urlError = getFieldError(fieldErrors, urlField);
            const iconError = getFieldError(fieldErrors, iconField);
            const visibilityError = getFieldError(
              fieldErrors,
              visibilityField,
            );

            const hasPreviewUrl = isSafePreviewUrl(platform.url);
            const hasIconPreview = isSafePreviewUrl(platform.iconUrl);
            const isExpanded = expandedIndex === index;
            const editorId = `${fieldName}-${index}-editor`;

            return (
              <article
                key={`${fieldName}-${index}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60"
              >
                <div
                  className={`flex items-center gap-3 bg-white px-4 py-3 ${
                    isExpanded ? "border-b border-slate-200" : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={editorId}
                    disabled={disabled}
                    onClick={() => togglePlatform(index)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-not-allowed"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">
                      {index + 1}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate font-bold text-slate-900">
                        {platform.name || "New Platform"}
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-500">
                        Display order: {index + 1}
                      </span>
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Move ${platform.name || "platform"} up`}
                      title="Move up"
                      disabled={disabled || index === 0}
                      onClick={() => movePlatform(index, -1)}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      aria-label={`Move ${platform.name || "platform"} down`}
                      title="Move down"
                      disabled={disabled || index === platformItems.length - 1}
                      onClick={() => movePlatform(index, 1)}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removePlatform(index)}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    id={editorId}
                    className="grid gap-2.5 p-4 sm:p-5 lg:grid-cols-2"
                  >
                    <div>
                      <label
                        htmlFor={nameField}
                        className="text-sm font-semibold text-slate-700"
                      >
                        Platform Name
                      </label>

                      <input
                        id={nameField}
                        name={nameField}
                        type="text"
                        value={platform.name || ""}
                        disabled={disabled}
                        placeholder="Example: YouTube"
                        onChange={(event) =>
                          updatePlatform(index, "name", event.target.value)
                        }
                        className={`mt-2 min-h-9 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                          nameError
                            ? "border-red-400 focus:border-red-500"
                            : "border-slate-300 focus:border-brand-500"
                        }`}
                      />

                      {nameError && (
                        <p
                          role="alert"
                          className="mt-2 text-sm font-medium text-red-600"
                        >
                          {nameError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={usernameField}
                        className="text-sm font-semibold text-slate-700"
                      >
                        Username or Profile Name
                      </label>

                      <input
                        id={usernameField}
                        name={usernameField}
                        type="text"
                        value={platform.username || ""}
                        disabled={disabled}
                        placeholder="Example: RakeshNexify"
                        onChange={(event) =>
                          updatePlatform(
                            index,
                            "username",
                            event.target.value,
                          )
                        }
                        className={`mt-2 min-h-9 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                          usernameError
                            ? "border-red-400 focus:border-red-500"
                            : "border-slate-300 focus:border-brand-500"
                        }`}
                      />

                      {usernameError && (
                        <p
                          role="alert"
                          className="mt-2 text-sm font-medium text-red-600"
                        >
                          {usernameError}
                        </p>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor={urlField}
                          className="text-sm font-semibold text-slate-700"
                        >
                          Profile URL
                        </label>

                        {hasPreviewUrl && (
                          <a
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-brand-600 transition hover:text-brand-700"
                          >
                            Open profile ↗
                          </a>
                        )}
                      </div>

                      <input
                        id={urlField}
                        name={urlField}
                        type="url"
                        value={platform.url || ""}
                        disabled={disabled}
                        placeholder="https://example.com/username"
                        onChange={(event) =>
                          updatePlatform(index, "url", event.target.value)
                        }
                        className={`mt-2 min-h-9 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                          urlError
                            ? "border-red-400 focus:border-red-500"
                            : "border-slate-300 focus:border-brand-500"
                        }`}
                      />

                      {urlError ? (
                        <p
                          role="alert"
                          className="mt-2 text-sm font-medium text-red-600"
                        >
                          {urlError}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Use a complete URL beginning with{" "}
                          <span className="font-semibold">https://</span>
                        </p>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <MediaField
                        id={iconField}
                        name={iconField}
                        label="Platform Icon / Logo"
                        value={platform.iconUrl || ""}
                        onChange={(event) =>
                          updatePlatform(
                            index,
                            "iconUrl",
                            event.target.value,
                          )
                        }
                        accessToken={accessToken}
                        allowedTypes={["image", "svg"]}
                        pickerTitle={`Choose ${platform.name || "Platform"} Icon`}
                        placeholder="https://..."
                        helpText="Choose an SVG, PNG, JPG, WebP or AVIF asset from the Media Library, or paste a complete image URL."
                        error={iconError}
                        disabled={disabled}
                        onUnauthorized={onMediaUnauthorized}
                      />

                      {hasIconPreview && (
                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-50">
                            <img
                              src={platform.iconUrl}
                              alt={`${platform.name || "Platform"} icon preview`}
                              className="max-h-8 max-w-8 object-contain"
                            />
                          </span>

                          <span className="min-w-0">
                            <span className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                              Icon preview
                            </span>

                            <span className="mt-1 block truncate text-sm font-semibold text-slate-700">
                              {platform.name || "New Platform"}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                        <input
                          type="checkbox"
                          name={visibilityField}
                          checked={platform.isVisible !== false}
                          disabled={disabled}
                          onChange={(event) =>
                            updatePlatform(
                              index,
                              "isVisible",
                              event.target.checked,
                            )
                          }
                          className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-800">
                            Show this platform publicly
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            Hidden platforms remain saved in the Admin Panel
                            but are not displayed on the public website.
                          </span>
                        </span>
                      </label>

                      {visibilityError && (
                        <p
                          role="alert"
                          className="mt-2 text-sm font-medium text-red-600"
                        >
                          {visibilityError}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default PlatformSettingsEditor;
