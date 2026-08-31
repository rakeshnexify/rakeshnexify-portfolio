import { createEmptyAboutWorkItem } from "../../../utils/siteSettingsForm";
// rnx-site-settings-work-v482

const MAX_WORK_ITEMS = 100;

function getFieldError(fieldErrors, fieldName) {
  return fieldErrors?.[fieldName] || "";
}

function AboutWorkItemsEditor({
  items = [],
  fieldErrors = {},
  disabled = false,
  onChange,
}) {
  const workItems = Array.isArray(items) ? items : [];

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
      workItems.map((item, itemIndex) =>
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
    if (workItems.length >= MAX_WORK_ITEMS) {
      return;
    }

    emitChange([
      ...workItems,
      createEmptyAboutWorkItem(workItems.length + 1),
    ]);
  }

  function removeItem(index) {
    emitChange(
      workItems.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function moveItem(index, direction) {
    const destinationIndex = index + direction;

    if (
      destinationIndex < 0 ||
      destinationIndex >= workItems.length
    ) {
      return;
    }

    const nextItems = [...workItems];

    [nextItems[index], nextItems[destinationIndex]] = [
      nextItems[destinationIndex],
      nextItems[index],
    ];

    emitChange(nextItems);
  }

  const groupError = getFieldError(fieldErrors, "about.workItems");

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950/60 sm:p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-900">
            Dynamic Work Links
          </h3>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
            Add companies, services, brands, products or any other work item.
            Every item can use an internal path or an external website link.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            {workItems.length}/{MAX_WORK_ITEMS}
          </span>

          <button
            type="button"
            disabled={disabled || workItems.length >= MAX_WORK_ITEMS}
            onClick={addItem}
            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-3 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Add Item
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

      {workItems.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No work links added
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Public About hides the rotating work card until an item is added.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {workItems.map((item, index) => {
            const typeField = `about.workItems.${index}.type`;
            const titleField = `about.workItems.${index}.title`;
            const urlField = `about.workItems.${index}.url`;
            const typeError = getFieldError(fieldErrors, typeField);
            const titleError = getFieldError(fieldErrors, titleField);
            const urlError = getFieldError(fieldErrors, urlField);

            return (
              <article
                key={`about-work-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-black text-brand-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="grid gap-3 lg:grid-cols-[0.7fr_1.3fr]">
                      <div>
                        <label
                          htmlFor={typeField}
                          className="mb-1.5 block text-xs font-bold text-slate-600"
                        >
                          Type / Label
                        </label>

                        <input
                          id={typeField}
                          name={typeField}
                          type="text"
                          value={item.type || ""}
                          disabled={disabled}
                          maxLength={50}
                          placeholder="Company"
                          onChange={(event) =>
                            updateItem(index, "type", event.target.value)
                          }
                          className={`min-h-10 w-full rounded-lg border bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                            typeError
                              ? "border-red-400 focus:border-red-500"
                              : "border-slate-300 focus:border-brand-500"
                          }`}
                        />

                        {typeError && (
                          <p
                            role="alert"
                            className="mt-1.5 text-xs font-semibold text-red-600"
                          >
                            {typeError}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor={titleField}
                          className="mb-1.5 block text-xs font-bold text-slate-600"
                        >
                          Title
                        </label>

                        <input
                          id={titleField}
                          name={titleField}
                          type="text"
                          value={item.title || ""}
                          disabled={disabled}
                          maxLength={120}
                          placeholder="Idomere Technologies"
                          onChange={(event) =>
                            updateItem(index, "title", event.target.value)
                          }
                          className={`min-h-10 w-full rounded-lg border bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                            titleError
                              ? "border-red-400 focus:border-red-500"
                              : "border-slate-300 focus:border-brand-500"
                          }`}
                        />

                        {titleError && (
                          <p
                            role="alert"
                            className="mt-1.5 text-xs font-semibold text-red-600"
                          >
                            {titleError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <label
                        htmlFor={urlField}
                        className="mb-1.5 block text-xs font-bold text-slate-600"
                      >
                        Link
                      </label>

                      <input
                        id={urlField}
                        name={urlField}
                        type="text"
                        value={item.url || ""}
                        disabled={disabled}
                        maxLength={1000}
                        placeholder="/services or https://example.com"
                        onChange={(event) =>
                          updateItem(index, "url", event.target.value)
                        }
                        className={`min-h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                          urlError
                            ? "border-red-400 focus:border-red-500"
                            : "border-slate-300 focus:border-brand-500"
                        }`}
                      />

                      {urlError ? (
                        <p
                          role="alert"
                          className="mt-1.5 text-xs font-semibold text-red-600"
                        >
                          {urlError}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-xs text-slate-500">
                          Use example.com, /relative-path, #section, or a complete URL.
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">
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

                      <label className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">
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
                        New tab
                      </label>

                      <button
                        type="button"
                        aria-label={`Move ${item.title || "work item"} up`}
                        title="Move up"
                        disabled={disabled || index === 0}
                        onClick={() => moveItem(index, -1)}
                        className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        aria-label={`Move ${item.title || "work item"} down`}
                        title="Move down"
                        disabled={disabled || index === workItems.length - 1}
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
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AboutWorkItemsEditor;
