import useMediaPicker from "../../../hooks/useMediaPicker";
import MediaPickerModal from "./MediaPickerModal";

function isSafeHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const parsedUrl = new URL(value.trim());

    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function MediaField({
  id,
  name,
  label,
  value = "",
  onChange,
  accessToken,
  allowedTypes = [],
  pickerTitle = "Choose Media",
  placeholder = "https://...",
  helpText = "",
  error = "",
  disabled = false,
  required = false,
  onUnauthorized,
}) {
  const { isMediaPickerOpen, openMediaPicker, closeMediaPicker } =
    useMediaPicker();

  function emitValue(nextValue, media = null) {
    onChange?.(
      {
        target: {
          name,
          value: nextValue,
        },
      },
      media,
    );
  }

  function handleUrlChange(event) {
    emitValue(event.target.value);
  }

  function handleMediaSelect(media) {
    if (!media?.url) {
      return;
    }

    emitValue(media.url, media);
  }

  function handleClear() {
    emitValue("");
  }

  const canOpenCurrentUrl = isSafeHttpUrl(value);

  return (
    <>
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">
          {label}

          {required && <span className="ml-1 text-red-600">*</span>}
        </label>

        <input
          id={id}
          name={name}
          type="url"
          value={value}
          onChange={handleUrlChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openMediaPicker}
            disabled={disabled || !accessToken}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Choose from Media
          </button>

          {value && (
            <>
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:text-red-700 disabled:opacity-50"
              >
                Clear
              </button>

              {canOpenCurrentUrl && (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
                >
                  Current URL
                </a>
              )}
            </>
          )}
        </div>

        {helpText && (
          <p className="mt-2 text-xs leading-5 text-slate-500">{helpText}</p>
        )}

        {error && (
          <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
        )}
      </div>

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        accessToken={accessToken}
        title={pickerTitle}
        allowedTypes={allowedTypes}
        selectedUrl={value}
        onSelect={handleMediaSelect}
        onClose={closeMediaPicker}
        onUnauthorized={onUnauthorized}
      />
    </>
  );
}

export default MediaField;
