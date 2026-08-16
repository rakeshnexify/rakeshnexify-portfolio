import AnalyticsTrendChart from "./AnalyticsTrendChart";

const METRICS = [
  ["orders", "Orders", "Service Orders created in this range."],
  [
    "appointments",
    "Appointments",
    "Consultation requests created in this range.",
  ],
  ["leads", "Leads", "CRM Leads created in this range."],
  ["contactMessages", "Enquiries", "Contact Messages created in this range."],
  [
    "subscriberActivity",
    "Subscriber activity",
    "Subscriptions or reactivations in this range.",
  ],
];

const STATUS_GROUPS = [
  ["orders", "Service Orders"],
  ["appointments", "Appointments"],
  ["leads", "Leads"],
  ["contactMessages", "Contact Messages"],
  ["subscribers", "Subscriber activity"],
];

function formatLabel(value) {
  return String(value || "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function formatRate(value) {
  return `${Math.max(0, Number(value) || 0).toFixed(1)}%`;
}

function SectionHeading({ eyebrow, title, description, id }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">
        {eyebrow}
      </p>

      <h2
        className="mt-1.5 text-lg font-black tracking-tight text-slate-950 sm:text-xl"
        id={id}
      >
        {title}
      </h2>

      {description ? (
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function StatusCard({ title, values = {} }) {
  const entries = Object.entries(values);

  const total = entries.reduce(
    (sum, [, count]) => sum + (Number(count) || 0),
    0,
  );

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>

        <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">
          {formatNumber(total)}
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500">Total in selected range</p>

      {entries.length > 0 ? (
        <div className="mt-4 space-y-3.5">
          {entries.map(([status, count]) => {
            const safeCount = Number(count) || 0;

            const percentage =
              total > 0 ? Math.min(100, (safeCount / total) * 100) : 0;

            return (
              <div key={status}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate font-semibold text-slate-600">
                    {formatLabel(status)}
                  </span>

                  <span className="shrink-0 font-black text-slate-900">
                    {formatNumber(safeCount)}
                  </span>
                </div>

                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    aria-hidden="true"
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-xs leading-5 text-slate-400">
          No status data available for this range.
        </p>
      )}
    </article>
  );
}

function ConversionCard({
  title,
  description,
  value,
  primaryKey = "converted",
  primaryLabel = "Converted",
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
        {formatRate(value?.rate)}
      </p>

      <p className="mt-1.5 text-xs leading-5 text-slate-500">{description}</p>

      <dl className="mt-4 grid grid-cols-2 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50">
        <div className="p-3">
          <dt className="text-[11px] font-semibold text-slate-500">
            Eligible
          </dt>

          <dd className="mt-1 text-sm font-black text-slate-950">
            {formatNumber(value?.eligible)}
          </dd>
        </div>

        <div className="p-3">
          <dt className="text-[11px] font-semibold text-slate-500">
            {primaryLabel}
          </dt>

          <dd className="mt-1 text-sm font-black text-slate-950">
            {formatNumber(value?.[primaryKey])}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function AdminAnalyticsOverview({ data }) {
  if (!data) {
    return null;
  }

  const {
    overview = {},
    currentSubscribers = {},
    statusBreakdowns = {},
    trends = [],
    conversions = {},
    leadSources = [],
    estimatedPipelineValue = [],
    topOrderedServices = [],
    range = {},
  } = data;

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="analytics-overview-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <SectionHeading
          description="Activity recorded inside the selected UTC range. Subscriber state is shown separately as a current snapshot."
          eyebrow="Business overview"
          id="analytics-overview-heading"
          title="Operational totals"
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {METRICS.map(([key, label, description]) => (
            <article
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
              key={key}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                {label}
              </p>

              <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {formatNumber(overview[key])}
              </p>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                {description}
              </p>
            </article>
          ))}
        </div>

        <article className="mt-3 rounded-xl border border-brand-100 bg-brand-50/70 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">
                Current subscribers
              </p>

              <div className="mt-1.5 flex items-baseline gap-2">
                <p className="text-2xl font-black tracking-tight text-slate-950">
                  {formatNumber(currentSubscribers.total)}
                </p>

                <span className="text-xs font-semibold text-slate-500">
                  total
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-600">
                Current global state, independent of the selected date range.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-2 sm:min-w-64">
              <div className="rounded-lg border border-white/80 bg-white px-3 py-2.5">
                <dt className="text-[11px] font-semibold text-slate-500">
                  Active
                </dt>

                <dd className="mt-0.5 text-base font-black text-emerald-700">
                  {formatNumber(currentSubscribers.active)}
                </dd>
              </div>

              <div className="rounded-lg border border-white/80 bg-white px-3 py-2.5">
                <dt className="text-[11px] font-semibold text-slate-500">
                  Unsubscribed
                </dt>

                <dd className="mt-0.5 text-base font-black text-slate-700">
                  {formatNumber(currentSubscribers.unsubscribed)}
                </dd>
              </div>
            </dl>
          </div>
        </article>
      </section>

      <AnalyticsTrendChart trends={trends} bucket={range.bucket} />

      <section
        aria-labelledby="analytics-status-heading"
        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6"
      >
        <SectionHeading
          eyebrow="Lifecycle"
          id="analytics-status-heading"
          title="Status breakdowns"
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {STATUS_GROUPS.map(([key, title]) => (
            <StatusCard
              key={key}
              title={title}
              values={statusBreakdowns[key] || {}}
            />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="analytics-conversion-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <SectionHeading
          description="Contact and Appointment conversions represent current surviving Lead relationships, not immutable lifetime history."
          eyebrow="Conversion coverage"
          id="analytics-conversion-heading"
          title="Lead conversion indicators"
        />

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ConversionCard
            description="Selected-range Contact Messages currently linked to a Lead."
            title="Contact → Lead"
            value={conversions.contactMessagesToLeads}
          />

          <ConversionCard
            description="Selected-range Appointments currently linked to a Lead."
            title="Appointment → Lead"
            value={conversions.appointmentsToLeads}
          />

          <ConversionCard
            description="Won divided by won plus lost Leads created in this range."
            primaryKey="won"
            primaryLabel="Won"
            title="Lead won rate"
            value={conversions.leadWonRate}
          />
        </div>
      </section>

      <section
        aria-labelledby="analytics-commercial-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <SectionHeading
          eyebrow="Commercial analytics"
          id="analytics-commercial-heading"
          title="Sales and pipeline signals"
        />

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">
              Top Services
            </p>

            <h3 className="mt-1.5 text-base font-black text-slate-950">
              Most ordered Services
            </h3>

            {topOrderedServices.length > 0 ? (
              <ol className="mt-4 space-y-2">
                {topOrderedServices.map((service, index) => (
                  <li
                    className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white p-3"
                    key={service.slug}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-100 text-[11px] font-black text-brand-700">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {service.title || service.slug}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {service.slug}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-black text-slate-950">
                      {formatNumber(service.count)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-500">
                No Service Orders are available for this range.
              </p>
            )}
          </article>

          <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">
              Lead sources
            </p>

            <h3 className="mt-1.5 text-base font-black text-slate-950">
              Lead origin
            </h3>

            {leadSources.length > 0 ? (
              <div className="mt-4 space-y-2">
                {leadSources.map((source) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white p-3"
                    key={source.source}
                  >
                    <span className="min-w-0 break-words text-sm font-semibold text-slate-700">
                      {formatLabel(source.source)}
                    </span>

                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-900">
                      {formatNumber(source.count)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-500">
                No Leads are available for this range.
              </p>
            )}
          </article>

          <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">
              Estimated pipeline
            </p>

            <h3 className="mt-1.5 text-base font-black text-slate-950">
              Open Lead value
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Estimates only. Values are grouped by currency and are not
              revenue.
            </p>

            {estimatedPipelineValue.length > 0 ? (
              <div className="mt-4 space-y-2">
                {estimatedPipelineValue.map((item) => (
                  <div
                    className="rounded-lg border border-slate-200/80 bg-white p-3"
                    key={item.currency}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 break-words text-sm font-black text-slate-950">
                        {item.currency}{" "}
                        {new Intl.NumberFormat(undefined, {
                          maximumFractionDigits: 2,
                        }).format(item.amount)}
                      </span>

                      <span className="shrink-0 text-[11px] font-bold text-slate-500">
                        {formatNumber(item.leadCount)} Lead
                        {Number(item.leadCount) === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-500">
                No estimated open-pipeline values are available for this range.
              </p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}

export default AdminAnalyticsOverview;