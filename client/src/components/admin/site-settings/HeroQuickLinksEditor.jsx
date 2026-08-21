import { useState } from "react";

import MediaField from "../media/MediaField";
import { createEmptyHeroQuickLink } from "../../../utils/siteSettingsForm";

const MAX_HERO_QUICK_LINKS = 30;

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

function HeroQuickLinksEditor({
  items = [],
  fieldErrors = {},
  disabled = false,
  accessToken = "",
  onMediaUnauthorized,
  onChange,
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const quickLinks = Array.isArray(items) ? items : [];

  function emitChange(nextItems) {
    onChange(
      nextItems.map((item, index) => ({
        ...item,
        order: index + 1,
      })),
    );
  }

  function updateItem(index, propertyName, value) {
    emitChange(
      quickLinks.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [propertyName]: value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    if (quickLinks.length >= MAX_HERO_QUICK_LINKS) {
      return;
    }

    const newIndex = quickLinks.length;

    emitChange([
      ...quickLinks,
      createEmptyHeroQuickLink(newIndex + 1),
    ]);

    setExpandedIndex(newIndex);
  }

  function removeItem(index) {
    emitChange(
      quickLinks.filter((_, itemIndex) => itemIndex !== index),
    );

    setExpandedIndex((currentIndex) => {
      if (currentIndex === null || currentIndex < index) {
        return currentIndex;
      }

      if (currentIndex === index) {
        return null;
      }

      return currentIndex - 1;
    });
  }

  function moveItem(index, direction) {
    const destinationIndex = index + direction;

    if (
      destinationIndex < 0 ||
      destinationIndex >= quickLinks.length
    ) {
      return;
    }

    const nextItems = [...quickLinks];

    [nextItems[index], nextItems[destinationIndex]] = [
      nextItems[destinationIndex],
      nextItems[index],
    ];

    emitChange(nextItems);

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

  function toggleItem(index) {
    setExpandedIndex((currentIndex) =>
      currentIndex === index ? null : index,
    );
  }

  const groupError = getFieldError(fieldErrors, "hero.quickLinks");

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-900">Hero Quick Links</h3>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
            Add clickable capability or service chips shown below the Hero
            newsletter. Labels, links, icons, visibility and order are fully
            Admin-managed.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            {quickLinks.length}/{MAX_HERO_QUICK_LINKS}
          </span>

          <button
            type="button"
            disabled={disabled || quickLinks.length >= MAX_HERO_QUICK_LINKS}
            onClick={addItem}
            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-3 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Add Link
          </button>
        </div>
      </div>

      {groupError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {groupError}
        </p>
      )}

      {quickLinks.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No Hero quick links added
          </p>

          <p className="mt-1 text-xs text-slate-500">
            The public Hero quick-link row stays hidden until you add links.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {quickLinks.map((item, index) => {
            const labelField = `hero.quickLinks.${index}.label`;
            const urlField = `hero.quickLinks.${index}.url`;
            const iconField = `hero.quickLinks.${index}.iconUrl`;
            const labelError = getFieldError(fieldErrors, labelField);
            const urlError = getFieldError(fieldErrors, urlField);
            const iconError = getFieldError(fieldErrors, iconField);
            const isExpanded = expandedIndex === index;
            const editorId = `hero-quick-link-${index}-editor`;
            const hasIconPreview = isSafePreviewUrl(item.iconUrl);

            return (
              <article
                key={`hero-quick-link-${index}`}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div
                  className={`flex items-center gap-3 px-3 py-3 ${
                    isExpanded ? "border-b border-slate-200" : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={editorId}
                    disabled={disabled}
                    onClick={() => toggleItem(index)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none transition focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-not-allowed"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-black text-brand-700">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-900">
                        {item.label || "New Quick Link"}
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-500">
                        Display order: {index + 1}
                      </span>
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Move ${item.label || "quick link"} up`}
                      title="Move up"
                      disabled={disabled || index === 0}
                      onClick={() => moveItem(index, -1)}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      aria-label={`Move ${item.label || "quick link"} down`}
                      title="Move down"
                      disabled={disabled || index === quickLinks.length - 1}
                      onClick={() => moveItem(index, 1)}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeItem(index)}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div id={editorId} className="grid gap-4 p-4 lg:grid-cols-2">
                    <div>
                      <label
                        htmlFor={labelField}
                        className="text-sm font-semibold text-slate-700"
                      >
                        Link Title
                      </label>

                      <input
                        id={labelField}
                        name={labelField}
                        type="text"
                        value={item.label || ""}
                        disabled={disabled}
                        maxLength={80}
                        placeholder="Example: MERN Stack"
                        onChange={(event) =>
                          updateItem(index, "label", event.target.value)
                        }
                        className={`mt-2 min-h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                          labelError
                            ? "border-red-400 focus:border-red-500"
                            : "border-slate-300 focus:border-brand-500"
                        }`}
                      />

                      {labelError && (
                        <p
                          role="alert"
                          className="mt-2 text-sm font-medium text-red-600"
                        >
                          {labelError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={urlField}
                        className="text-sm font-semibold text-slate-700"
                      >
                        Link URL
                      </label>

                      <input
                        id={urlField}
                        name={urlField}
                        type="text"
                        value={item.url || ""}
                        disabled={disabled}
                        maxLength={1000}
                        placeholder="/services, #projects or example.com"
                        onChange={(event) =>
                          updateItem(index, "url", event.target.value)
                        }
                        className={`mt-2 min-h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
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
                          Supports internal paths, #sections, complete URLs and
                          bare domains such as example.com.
                        </p>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <MediaField
                        id={iconField}
                        name={iconField}
                        label="Optional Icon / Logo"
                        value={item.iconUrl || ""}
                        onChange={(event) =>
                          updateItem(index, "iconUrl", event.target.value)
                        }
                        accessToken={accessToken}
                        allowedTypes={["image", "svg"]}
                        pickerTitle={`Choose ${item.label || "Quick Link"} Icon`}
                        placeholder="https://..."
                        helpText="Optional. Choose an SVG/PNG/image from the Media Library or paste a complete image URL."
                        error={iconError}
                        disabled={disabled}
                        onUnauthorized={onMediaUnauthorized}
                      />

                      {hasIconPreview && (
                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white">
                            <img
                              src={item.iconUrl}
                              alt={`${item.label || "Quick link"} icon preview`}
                              className="max-h-7 max-w-7 object-contain"
                            />
                          </span>

                          <span className="min-w-0 truncate text-sm font-semibold text-slate-700">
                            {item.label || "Quick link icon"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:col-span-2">
                      <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={item.isVisible !== false}
                          disabled={disabled}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "isVisible",
                              event.target.checked,
                            )
                          }
                          className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        Public
                      </label>

                      <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={item.openInNewTab === true}
                          disabled={disabled}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "openInNewTab",
                              event.target.checked,
                            )
                          }
                          className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        Open in new tab
                      </label>
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

export default HeroQuickLinksEditor;
