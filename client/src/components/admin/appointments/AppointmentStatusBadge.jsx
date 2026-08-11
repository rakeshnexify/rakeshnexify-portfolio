const STATUS_CONFIG = {
  requested: {
    label: "Requested",
    className:
      "border-amber-200 bg-amber-50 text-amber-800",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "border-blue-200 bg-blue-50 text-blue-800",
  },
  completed: {
    label: "Completed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "border-slate-300 bg-slate-100 text-slate-700",
  },
  declined: {
    label: "Declined",
    className:
      "border-red-200 bg-red-50 text-red-700",
  },
  "no-show": {
    label: "No-show",
    className:
      "border-purple-200 bg-purple-50 text-purple-800",
  },
};

function normalizeStatus(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function AppointmentStatusBadge({
  status = "",
  className = "",
}) {
  const normalizedStatus =
    normalizeStatus(status);

  const config =
    STATUS_CONFIG[normalizedStatus] || {
      label:
        normalizedStatus || "Unknown",
      className:
        "border-slate-200 bg-slate-50 text-slate-700",
    };

  return (
    <span
      className={[
        "inline-flex min-h-7 max-w-full items-center rounded-full border px-3 py-1 text-xs font-bold",
        config.className,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="break-words">
        {config.label}
      </span>
    </span>
  );
}

export default AppointmentStatusBadge;