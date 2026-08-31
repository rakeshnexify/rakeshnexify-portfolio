import { useMemo, useState } from "react";

const devices = ["desktop", "tablet", "mobile"];

const labels = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

function DesignPreviewGallery({ design }) {
  const screenshots = useMemo(() => {
    const items = Array.isArray(design?.screenshots) ? design.screenshots : [];

    return [...items].sort(
      (a, b) => Number(a?.order || 0) - Number(b?.order || 0),
    );
  }, [design]);

  const availableDevices = useMemo(
    () =>
      devices.filter((device) =>
        screenshots.some((screenshot) => screenshot?.device === device),
      ),
    [screenshots],
  );

  const firstDevice =
    availableDevices.includes("desktop")
      ? "desktop"
      : availableDevices[0] || "";

  const firstScreenshot = screenshots.find(
    (screenshot) => screenshot.device === firstDevice,
  );

  const defaultActiveUrl =
    firstScreenshot?.url || design?.thumbnailUrl || "";

  const selectionSourceKey = JSON.stringify([
    design?._id || "",
    design?.thumbnailUrl || "",
    screenshots.map((screenshot) => [
      screenshot?.device || "",
      screenshot?.url || "",
      screenshot?.order || 0,
    ]),
  ]);

  const [selection, setSelection] = useState(null);

  const hasCurrentSelection =
    selection?.sourceKey === selectionSourceKey &&
    availableDevices.includes(selection.device) &&
    screenshots.some(
      (screenshot) =>
        screenshot.device === selection.device &&
        screenshot.url === selection.url,
    );

  const activeDevice = hasCurrentSelection
    ? selection.device
    : firstDevice;

  const activeUrl = hasCurrentSelection
    ? selection.url
    : defaultActiveUrl;

  const deviceScreenshots = activeDevice
    ? screenshots.filter((item) => item.device === activeDevice)
    : screenshots;

  const activeScreenshot =
    screenshots.find((item) => item.url === activeUrl) ||
    deviceScreenshots[0];

  function chooseDevice(device) {
    const first = screenshots.find((item) => item.device === device);

    setSelection({
      sourceKey: selectionSourceKey,
      device,
      url: first?.url || design?.thumbnailUrl || "",
    });
  }

  function chooseScreenshot(url) {
    setSelection({
      sourceKey: selectionSourceKey,
      device: activeDevice,
      url,
    });
  }

  if (!design) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-slate-950 p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {availableDevices.map((device) => (
            <button
              key={device}
              type="button"
              onClick={() => chooseDevice(device)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                activeDevice === device
                  ? "bg-white text-slate-950"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {labels[device]}
            </button>
          ))}
        </div>

        {design.liveDemoUrl && (
          <a
            href={design.liveDemoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white"
          >
            Live Demo ↗
          </a>
        )}
      </div>

      <div
        className={`mx-auto mt-4 max-h-[72vh] overflow-y-auto rounded-xl bg-white ${
          activeDevice === "mobile"
            ? "max-w-sm"
            : activeDevice === "tablet"
              ? "max-w-3xl"
              : "w-full"
        }`}
      >
        {activeUrl ? (
          <img
            src={activeUrl}
            alt={activeScreenshot?.alt || design.name}
            className="block h-auto w-full"
          />
        ) : (
          <div className="grid min-h-72 place-items-center text-sm font-bold text-slate-400">
            No screenshot
          </div>
        )}
      </div>

      {deviceScreenshots.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {deviceScreenshots.map((screenshot, index) => (
            <button
              key={`${screenshot.url}-${index}`}
              type="button"
              onClick={() => chooseScreenshot(screenshot.url)}
              className={`grid size-8 place-items-center rounded-lg text-xs font-bold ${
                screenshot.url === activeUrl
                  ? "bg-brand-600 text-white"
                  : "bg-white/10 text-white"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DesignPreviewGallery;
