const SERIES = [
  ["orders", "Orders", "stroke-brand-600", "bg-brand-600"],
  ["appointments", "Appointments", "stroke-violet-600", "bg-violet-600"],
  ["leads", "Leads", "stroke-emerald-600", "bg-emerald-600"],
  ["contactMessages", "Enquiries", "stroke-amber-600", "bg-amber-600"],
  ["subscriberActivity", "Subscriber activity", "stroke-sky-600", "bg-sky-600"],
];

const WIDTH = 900;
const HEIGHT = 280;
const LEFT = 44;
const RIGHT = 18;
const TOP = 18;
const BOTTOM = 42;

function formatBucketLabel(value, bucket) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    ...(bucket === "month" ? { year: "2-digit" } : { day: "numeric" }),
    timeZone: "UTC",
  }).format(date);
}

function createPoint(index, count, totalPoints, maxValue) {
  const chartWidth = WIDTH - LEFT - RIGHT;
  const chartHeight = HEIGHT - TOP - BOTTOM;
  const x =
    totalPoints <= 1
      ? LEFT + chartWidth / 2
      : LEFT + (index / (totalPoints - 1)) * chartWidth;
  const y = TOP + chartHeight - (maxValue > 0 ? (count / maxValue) * chartHeight : 0);

  return { x, y };
}

function AnalyticsTrendChart({ trends = [], bucket = "day" }) {
  const rows = Array.isArray(trends) ? trends : [];
  const maxValue = Math.max(
    0,
    ...rows.flatMap((row) => SERIES.map(([key]) => Number(row?.[key]) || 0)),
  );
  const labelStep = Math.max(1, Math.ceil(rows.length / 6));

  return (
    <section
      aria-labelledby="analytics-trend-heading"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
            Activity trend
          </p>
          <h3 id="analytics-trend-heading" className="mt-2 text-xl font-black text-slate-950">
            Operational activity over time
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            UTC {bucket} buckets for the selected analytics range.
          </p>
        </div>

        <div aria-label="Trend legend" className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-600">
          {SERIES.map(([key, label, , dotClassName]) => (
            <span key={key} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className={`size-2.5 rounded-full ${dotClassName}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">
          No trend buckets are available for this range yet.
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              role="img"
              aria-labelledby="analytics-trend-chart-title analytics-trend-chart-description"
              className="min-w-[720px]"
            >
              <title id="analytics-trend-chart-title">Admin analytics activity trend</title>
              <desc id="analytics-trend-chart-description">
                Line chart comparing Orders, Appointments, Leads, Enquiries and Subscriber activity.
              </desc>

              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = TOP + (1 - ratio) * (HEIGHT - TOP - BOTTOM);
                const value = Math.round(maxValue * ratio);

                return (
                  <g key={ratio}>
                    <line x1={LEFT} x2={WIDTH - RIGHT} y1={y} y2={y} className="stroke-slate-200" strokeWidth="1" />
                    <text x={LEFT - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-semibold">
                      {value}
                    </text>
                  </g>
                );
              })}

              {SERIES.map(([key, , strokeClassName]) => {
                const points = rows.map((row, index) => {
                  const point = createPoint(index, Number(row?.[key]) || 0, rows.length, maxValue);
                  return `${point.x},${point.y}`;
                });

                return (
                  <polyline
                    key={key}
                    points={points.join(" ")}
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={strokeClassName}
                  />
                );
              })}

              {rows.map((row, index) => {
                if (index % labelStep !== 0 && index !== rows.length - 1) {
                  return null;
                }

                const point = createPoint(index, 0, rows.length, maxValue);

                return (
                  <text
                    key={row.start}
                    x={point.x}
                    y={HEIGHT - 12}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px] font-semibold"
                  >
                    {formatBucketLabel(row.start, bucket)}
                  </text>
                );
              })}
            </svg>
          </div>

          <details className="mt-4 rounded-2xl bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-bold text-slate-700">
              View accessible trend data
            </summary>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2">Period</th>
                    {SERIES.map(([key, label]) => (
                      <th key={key} className="px-2 py-2">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.start} className="border-b border-slate-100">
                      <td className="px-2 py-2 font-semibold text-slate-700">
                        {formatBucketLabel(row.start, bucket)}
                      </td>
                      {SERIES.map(([key]) => (
                        <td key={key} className="px-2 py-2 text-slate-600">
                          {Number(row?.[key]) || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

export default AnalyticsTrendChart;
