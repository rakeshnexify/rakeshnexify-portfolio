const SERIES = [
  ["orders", "Orders", "stroke-brand-600", "bg-brand-600"],
  ["appointments", "Appointments", "stroke-violet-600", "bg-violet-600"],
  ["leads", "Leads", "stroke-emerald-600", "bg-emerald-600"],
  ["contactMessages", "Enquiries", "stroke-amber-600", "bg-amber-600"],
  [
    "subscriberActivity",
    "Subscriber activity",
    "stroke-sky-600",
    "bg-sky-600",
  ],
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

  const y =
    TOP +
    chartHeight -
    (maxValue > 0 ? (count / maxValue) * chartHeight : 0);

  return { x, y };
}

function AnalyticsTrendChart({ trends = [], bucket = "day" }) {
  const rows = Array.isArray(trends) ? trends : [];

  const maxValue = Math.max(
    0,
    ...rows.flatMap((row) =>
      SERIES.map(([key]) => Number(row?.[key]) || 0),
    ),
  );

  const labelStep = Math.max(1, Math.ceil(rows.length / 6));

  return (
    <section
      aria-labelledby="analytics-trend-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">
            Activity trend
          </p>

          <h2
            className="mt-1.5 text-lg font-black tracking-tight text-slate-950 sm:text-xl"
            id="analytics-trend-heading"
          >
            Operational activity over time
          </h2>

          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            UTC {bucket} buckets across the selected analytics range.
          </p>
        </div>

        <div
          aria-label="Trend legend"
          className="flex max-w-2xl flex-wrap gap-x-4 gap-y-2"
        >
          {SERIES.map(([key, label, , dotClassName]) => (
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600"
              key={key}
            >
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${dotClassName}`}
              />

              {label}
            </span>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-7 text-center">
          <p className="text-sm font-semibold text-slate-600">
            No trend data available
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            No activity buckets are available for the selected range yet.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/40 px-2 py-3 sm:px-3">
            <div className="overflow-x-auto overscroll-x-contain">
              <svg
                aria-labelledby="analytics-trend-chart-title analytics-trend-chart-description"
                className="min-w-[720px]"
                role="img"
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              >
                <title id="analytics-trend-chart-title">
                  Admin analytics activity trend
                </title>

                <desc id="analytics-trend-chart-description">
                  Line chart comparing Orders, Appointments, Leads, Enquiries
                  and Subscriber activity.
                </desc>

                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y =
                    TOP + (1 - ratio) * (HEIGHT - TOP - BOTTOM);

                  const value = Math.round(maxValue * ratio);

                  return (
                    <g key={ratio}>
                      <line
                        className="stroke-slate-200"
                        strokeWidth="1"
                        x1={LEFT}
                        x2={WIDTH - RIGHT}
                        y1={y}
                        y2={y}
                      />

                      <text
                        className="fill-slate-400 text-[10px] font-semibold"
                        textAnchor="end"
                        x={LEFT - 8}
                        y={y + 4}
                      >
                        {value}
                      </text>
                    </g>
                  );
                })}

                {SERIES.map(([key, , strokeClassName]) => {
                  const points = rows.map((row, index) => {
                    const point = createPoint(
                      index,
                      Number(row?.[key]) || 0,
                      rows.length,
                      maxValue,
                    );

                    return `${point.x},${point.y}`;
                  });

                  return (
                    <polyline
                      className={strokeClassName}
                      fill="none"
                      key={key}
                      points={points.join(" ")}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />
                  );
                })}

                {rows.map((row, index) => {
                  if (
                    index % labelStep !== 0 &&
                    index !== rows.length - 1
                  ) {
                    return null;
                  }

                  const point = createPoint(
                    index,
                    0,
                    rows.length,
                    maxValue,
                  );

                  return (
                    <text
                      className="fill-slate-500 text-[10px] font-semibold"
                      key={row.start}
                      textAnchor="middle"
                      x={point.x}
                      y={HEIGHT - 12}
                    >
                      {formatBucketLabel(row.start, bucket)}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70">
            <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset">
              View accessible trend data
            </summary>

            <div className="border-t border-slate-200 px-2 py-3 sm:px-4">
              <div className="overflow-x-auto overscroll-x-contain">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                      <th className="whitespace-nowrap px-2 py-2">
                        Period
                      </th>

                      {SERIES.map(([key, label]) => (
                        <th
                          className="whitespace-nowrap px-2 py-2"
                          key={key}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row) => (
                      <tr
                        className="border-b border-slate-100 last:border-b-0"
                        key={row.start}
                      >
                        <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-700">
                          {formatBucketLabel(row.start, bucket)}
                        </td>

                        {SERIES.map(([key]) => (
                          <td
                            className="whitespace-nowrap px-2 py-2 text-slate-600"
                            key={key}
                          >
                            {Number(row?.[key]) || 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

export default AnalyticsTrendChart;