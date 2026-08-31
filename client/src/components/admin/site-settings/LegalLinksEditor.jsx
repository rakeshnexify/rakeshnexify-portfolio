import { createEmptyLegalLink } from "../../../utils/siteSettingsForm";

const MAX_LEGAL_LINKS = 20;

function getFieldError(fieldErrors, fieldName) {
  return fieldErrors?.[fieldName] || "";
}

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const characterCode = text.charCodeAt(index);

    if (characterCode <= 31 || characterCode === 127) {
      return true;
    }
  }

  return false;
}

function getPreviewDetails(value) {
  const url = String(value || "").trim();

  if (!url) {
    return null;
  }

  if (/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(url)) {
    return {
      url,
      isExternal: false,
    };
  }

  if (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.includes("\\") &&
    !containsControlCharacters(url)
  ) {
    return {
      url,
      isExternal: false,
    };
  }

  try {
    const parsedUrl = new URL(url);

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      return null;
    }

    return {
      url,
      isExternal: true,
    };
  } catch {
    return null;
  }
}

function LegalLinksEditor({
  legalLinks = [],
  fieldErrors = {},
  disabled = false,
  onChange,
}) {
  const linkItems = Array.isArray(legalLinks) ? legalLinks : [];

  function emitChange(nextLinks) {
    onChange(
      nextLinks.map((link, index) => ({
        ...link,
        order: index + 1,
      })),
    );
  }

  function updateLink(index, fieldName, value) {
    const nextLinks = linkItems.map((link, linkIndex) => {
      if (linkIndex !== index) {
        return link;
      }

      return {
        ...link,
        [fieldName]: value,
      };
    });

    emitChange(nextLinks);
  }

  function addLink() {
    if (linkItems.length >= MAX_LEGAL_LINKS) {
      return;
    }

    emitChange([...linkItems, createEmptyLegalLink(linkItems.length + 1)]);
  }

  function removeLink(index) {
    emitChange(linkItems.filter((_, linkIndex) => linkIndex !== index));
  }

  function moveLink(index, direction) {
    const destinationIndex = index + direction;

    if (destinationIndex < 0 || destinationIndex >= linkItems.length) {
      return;
    }

    const nextLinks = [...linkItems];

    [nextLinks[index], nextLinks[destinationIndex]] = [
      nextLinks[destinationIndex],
      nextLinks[index],
    ];

    emitChange(nextLinks);
  }

  const groupError = getFieldError(fieldErrors, "footer.legalLinks");

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950/60">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Legal Links</h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage Privacy Policy, Terms and other links displayed at the bottom
            of the website Footer.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
            {linkItems.length}/{MAX_LEGAL_LINKS}
          </span>

          <button
            type="button"
            onClick={addLink}
            disabled={disabled || linkItems.length >= MAX_LEGAL_LINKS}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Add Legal Link
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

      {linkItems.length === 0 ? (
        <div className="mt-2.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-5 dark:border-slate-700 dark:bg-slate-950 text-center">
          <p className="font-semibold text-slate-700">No legal links added</p>

          <p className="mt-2 text-sm text-slate-500">
            Add a legal or informational link for the website Footer.
          </p>
        </div>
      ) : (
        <div className="mt-2.5 space-y-4">
          {linkItems.map((link, index) => {
            const labelField = `footer.legalLinks.${index}.label`;

            const urlField = `footer.legalLinks.${index}.url`;

            const visibilityField = `footer.legalLinks.${index}.isVisible`;

            const labelError = getFieldError(fieldErrors, labelField);

            const urlError = getFieldError(fieldErrors, urlField);

            const visibilityError = getFieldError(fieldErrors, visibilityField);

            const previewDetails = getPreviewDetails(link.url);

            return (
              <article
                key={`legal-link-${index}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">
                      {index + 1}
                    </span>

                    <div>
                      <h4 className="font-bold text-slate-900">
                        {link.label || "New Legal Link"}
                      </h4>

                      <p className="text-xs text-slate-500">
                        Display order: {index + 1}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      title="Move up"
                      aria-label={`Move ${link.label || "legal link"} up`}
                      onClick={() => moveLink(index, -1)}
                      disabled={disabled || index === 0}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      title="Move down"
                      aria-label={`Move ${link.label || "legal link"} down`}
                      onClick={() => moveLink(index, 1)}
                      disabled={disabled || index === linkItems.length - 1}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      disabled={disabled}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid gap-2.5 p-4 sm:p-5 lg:grid-cols-2">
                  <div>
                    <label
                      htmlFor={labelField}
                      className="text-sm font-semibold text-slate-700"
                    >
                      Link Label
                    </label>

                    <input
                      id={labelField}
                      name={labelField}
                      type="text"
                      value={link.label || ""}
                      onChange={(event) =>
                        updateLink(index, "label", event.target.value)
                      }
                      disabled={disabled}
                      maxLength={100}
                      placeholder="Privacy Policy"
                      className={`mt-2 min-h-9 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor={urlField}
                        className="text-sm font-semibold text-slate-700"
                      >
                        Link URL
                      </label>

                      {previewDetails && (
                        <a
                          href={previewDetails.url}
                          target={
                            previewDetails.isExternal ? "_blank" : undefined
                          }
                          rel={
                            previewDetails.isExternal
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="text-xs font-bold text-brand-600 transition hover:text-brand-700"
                        >
                          Open link ↗
                        </a>
                      )}
                    </div>

                    <input
                      id={urlField}
                      name={urlField}
                      type="text"
                      value={link.url || ""}
                      onChange={(event) =>
                        updateLink(index, "url", event.target.value)
                      }
                      disabled={disabled}
                      maxLength={500}
                      placeholder="/privacy or https://example.com/privacy"
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
                        Allowed formats:{" "}
                        <span className="font-semibold">#section</span>,{" "}
                        <span className="font-semibold">/relative-path</span> or
                        a complete HTTP/HTTPS URL.
                      </p>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <input
                        type="checkbox"
                        name={visibilityField}
                        checked={link.isVisible !== false}
                        onChange={(event) =>
                          updateLink(index, "isVisible", event.target.checked)
                        }
                        disabled={disabled}
                        className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />

                      <span>
                        <span className="block text-sm font-semibold text-slate-800">
                          Show this link publicly
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          Hidden links remain saved but are not displayed in the
                          public Footer.
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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LegalLinksEditor;
// rnx-site-settings-legal-v482
