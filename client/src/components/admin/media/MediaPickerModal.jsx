import { useEffect, useRef } from "react";

import MediaPicker from "./MediaPicker";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => {
      if (
        element.hasAttribute("disabled") ||
        element.getAttribute("aria-hidden") === "true"
      ) {
        return false;
      }

      return element.getClientRects().length > 0;
    },
  );
}

function MediaPickerModal({
  isOpen,
  accessToken,
  title = "Choose Media",
  allowedTypes = [],
  selectedUrl = "",
  onSelect,
  onClose,
  onUnauthorized,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusFrameId = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();

        onClose?.();

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();

        closeButtonRef.current?.focus();

        return;
      }

      const firstElement = focusableElements[0];

      const lastElement = focusableElements[focusableElements.length - 1];

      const activeElement = document.activeElement;

      if (
        event.shiftKey &&
        (activeElement === firstElement ||
          !dialogRef.current?.contains(activeElement))
      ) {
        event.preventDefault();

        lastElement.focus();

        return;
      }

      if (
        !event.shiftKey &&
        (activeElement === lastElement ||
          !dialogRef.current?.contains(activeElement))
      ) {
        event.preventDefault();

        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrameId);

      document.body.style.overflow = previousOverflow;

      document.removeEventListener("keydown", handleKeyDown);

      const previousElement = previousFocusRef.current;

      if (
        previousElement &&
        document.contains(previousElement) &&
        typeof previousElement.focus === "function"
      ) {
        window.requestAnimationFrame(() => {
          previousElement.focus();
        });
      }

      previousFocusRef.current = null;
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleSelect(media) {
    onSelect?.(media);
    onClose?.();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        aria-describedby="media-picker-description"
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
              Media Library
            </p>

            <h2
              id="media-picker-title"
              className="mt-1 text-2xl font-black text-slate-950"
            >
              {title}
            </h2>

            <p
              id="media-picker-description"
              className="mt-2 text-sm text-slate-500"
            >
              Select an existing asset without uploading it again.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close Media Picker"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-xl font-semibold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-brand-100"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <MediaPicker
            accessToken={accessToken}
            allowedTypes={allowedTypes}
            selectedUrl={selectedUrl}
            onSelect={handleSelect}
            onUnauthorized={onUnauthorized}
          />
        </div>
      </div>
    </div>
  );
}

export default MediaPickerModal;
