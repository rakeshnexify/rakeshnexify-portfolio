import { createEmptyTestimonialTrustedClient } from "../../../utils/siteSettingsForm";
import MediaField from "../media/MediaField";
// rnx-site-settings-trusted-v482

const MAX_TRUSTED_CLIENTS = 12;

function TestimonialsTrustedClientsEditor({
  clients = [],
  disabled = false,
  accessToken = "",
  onUnauthorized,
  onChange,
  getFieldError = () => "",
}) {
  const items = Array.isArray(clients) ? clients : [];

  function emitChange(nextItems) {
    onChange(
      nextItems.map((item, index) => ({
        ...item,
        order: index + 1,
      })),
    );
  }

  function updateClient(index, propertyName, value) {
    emitChange(
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [propertyName]: value,
            }
          : item,
      ),
    );
  }

  function addClient() {
    if (items.length >= MAX_TRUSTED_CLIENTS) {
      return;
    }

    emitChange([
      ...items,
      createEmptyTestimonialTrustedClient(items.length + 1),
    ]);
  }

  function removeClient(index) {
    emitChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveClient(index, direction) {
    const destinationIndex = index + direction;

    if (destinationIndex < 0 || destinationIndex >= items.length) {
      return;
    }

    const nextItems = [...items];

    [nextItems[index], nextItems[destinationIndex]] = [
      nextItems[destinationIndex],
      nextItems[index],
    ];

    emitChange(nextItems);
  }

  const groupError = getFieldError("testimonialsSection.trustedClients");

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950/60 sm:p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-900">
            Showcase Clients / Brands
          </h3>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
            Add independent showcase logos for the Testimonials trust strip.
            These items are not linked to Clients & Partners and are only used
            for portfolio presentation.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            {items.length}/{MAX_TRUSTED_CLIENTS}
          </span>

          <button
            type="button"
            disabled={disabled || items.length >= MAX_TRUSTED_CLIENTS}
            onClick={addClient}
            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-3 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Add Client
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

      {items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-7 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No showcase clients added
          </p>

          <p className="mt-1 text-xs text-slate-500">
            The trust-logo strip stays hidden until you add at least one visible
            showcase client.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((client, index) => {
            const prefix = `testimonialsSection.trustedClients.${index}`;
            const nameField = `${prefix}.name`;
            const logoField = `${prefix}.logoUrl`;
            const logoAltField = `${prefix}.logoAlt`;

            return (
              <article
                key={`testimonial-showcase-client-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-black text-brand-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="grid min-w-0 flex-1 gap-2 lg:grid-cols-2">
                    <div>
                      <label
                        htmlFor={nameField}
                        className="text-sm font-semibold text-slate-800"
                      >
                        Client / brand name
                      </label>

                      <input
                        id={nameField}
                        name={nameField}
                        type="text"
                        value={client.name || ""}
                        disabled={disabled}
                        maxLength={120}
                        placeholder="Nexora Labs"
                        onChange={(event) =>
                          updateClient(index, "name", event.target.value)
                        }
                        className="mt-2 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />

                      {getFieldError(nameField) && (
                        <p
                          role="alert"
                          className="mt-1.5 text-xs font-semibold text-red-600"
                        >
                          {getFieldError(nameField)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={logoAltField}
                        className="text-sm font-semibold text-slate-800"
                      >
                        Logo alt text
                      </label>

                      <input
                        id={logoAltField}
                        name={logoAltField}
                        type="text"
                        value={client.logoAlt || ""}
                        disabled={disabled}
                        maxLength={180}
                        placeholder="Nexora Labs logo"
                        onChange={(event) =>
                          updateClient(index, "logoAlt", event.target.value)
                        }
                        className="mt-2 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />

                      {getFieldError(logoAltField) && (
                        <p
                          role="alert"
                          className="mt-1.5 text-xs font-semibold text-red-600"
                        >
                          {getFieldError(logoAltField)}
                        </p>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <MediaField
                        id={logoField}
                        name={logoField}
                        label="Logo image"
                        value={client.logoUrl || ""}
                        onChange={(event) =>
                          updateClient(index, "logoUrl", event.target.value)
                        }
                        accessToken={accessToken}
                        allowedTypes={["image", "svg"]}
                        pickerTitle="Choose Showcase Client Logo"
                        placeholder="https://..."
                        helpText="Paste an external image URL or choose an image/SVG from the Media Library. Leave blank to show initials."
                        error={getFieldError(logoField)}
                        disabled={disabled}
                        onUnauthorized={onUnauthorized}
                      />

                      {client.logoUrl && (
                        <div className="mt-3 flex min-h-20 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <img
                            src={client.logoUrl}
                            alt={client.logoAlt || `${client.name || "Client"} logo preview`}
                            className="max-h-14 max-w-[11rem] object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 lg:w-36 lg:justify-end">
                    <label className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={client.isVisible !== false}
                        disabled={disabled}
                        onChange={(event) =>
                          updateClient(
                            index,
                            "isVisible",
                            event.target.checked,
                          )
                        }
                        className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      Visible
                    </label>

                    <button
                      type="button"
                      aria-label={`Move ${client.name || "client"} up`}
                      title="Move up"
                      disabled={disabled || index === 0}
                      onClick={() => moveClient(index, -1)}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      aria-label={`Move ${client.name || "client"} down`}
                      title="Move down"
                      disabled={disabled || index === items.length - 1}
                      onClick={() => moveClient(index, 1)}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeClient(index)}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
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

export default TestimonialsTrustedClientsEditor;
