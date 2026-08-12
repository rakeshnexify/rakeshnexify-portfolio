import AnalyticsTrendChart from "./AnalyticsTrendChart";

const METRICS = [
  ["orders", "Orders", "Service Orders created in this range."],
  ["appointments", "Appointments", "Consultation requests created in this range."],
  ["leads", "Leads", "CRM Leads created in this range."],
  ["contactMessages", "Enquiries", "Contact Messages created in this range."],
  ["subscriberActivity", "Subscriber activity", "Subscriptions or reactivations in this range."],
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

function StatusCard({ title, values = {} }) {
  const entries = Object.entries(values);
  const total = entries.reduce((sum, [, count]) => sum + (Number(count) || 0), 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <h4 className="font-black text-slate-950">{title}</h4>
      <p className="mt-1 text-xs font-semibold text-slate-500">
        {formatNumber(total)} total in selected range
      </p>

      <div className="mt-5 space-y-4">
        {entries.map(([status, count]) => {
          const safeCount = Number(count) || 0;
          const percentage = total > 0 ? Math.min(100, (safeCount / total) * 100) : 0;

          return (
            <div key={status}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-600">{formatLabel(status)}</span>
                <span className="font-black text-slate-950">{formatNumber(safeCount)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
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
    </article>
  );
}

function ConversionCard({ title, description, value, primaryKey = "converted", primaryLabel = "Converted" }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-black text-slate-950">{formatRate(value?.rate)}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
        <div>
          <dt className="font-semibold text-slate-500">Eligible</dt>
          <dd className="mt-1 font-black text-slate-950">{formatNumber(value?.eligible)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">{primaryLabel}</dt>
          <dd className="mt-1 font-black text-slate-950">{formatNumber(value?.[primaryKey])}</dd>
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
    <div className="space-y-6">
      <section aria-labelledby="analytics-overview-heading" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Business overview</p>
        <h2 id="analytics-overview-heading" className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          Operational totals
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Counts reflect activity inside the selected UTC range. Current Subscriber state is shown separately as a live global snapshot.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {METRICS.map(([key, label, description]) => (
            <article key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-black text-slate-950">{formatNumber(overview[key])}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
            </article>
          ))}
        </div>

        <article className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Current Subscribers</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{formatNumber(currentSubscribers.total)}</p>
              <p className="mt-1 text-sm text-slate-600">Global current state, independent of the selected date range.</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:min-w-64">
              <div className="rounded-xl bg-white p-3">
                <dt className="text-xs font-semibold text-slate-500">Active</dt>
                <dd className="mt-1 text-lg font-black text-emerald-700">{formatNumber(currentSubscribers.active)}</dd>
              </div>
              <div className="rounded-xl bg-white p-3">
                <dt className="text-xs font-semibold text-slate-500">Unsubscribed</dt>
                <dd className="mt-1 text-lg font-black text-slate-700">{formatNumber(currentSubscribers.unsubscribed)}</dd>
              </div>
            </dl>
          </div>
        </article>
      </section>

      <AnalyticsTrendChart trends={trends} bucket={range.bucket} />

      <section aria-labelledby="analytics-status-heading" className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Lifecycle</p>
        <h2 id="analytics-status-heading" className="mt-2 text-xl font-black text-slate-950">Status breakdowns</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {STATUS_GROUPS.map(([key, title]) => (
            <StatusCard key={key} title={title} values={statusBreakdowns[key] || {}} />
          ))}
        </div>
      </section>

      <section aria-labelledby="analytics-conversion-heading" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Conversion coverage</p>
        <h2 id="analytics-conversion-heading" className="mt-2 text-xl font-black text-slate-950">Lead conversion indicators</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Contact and Appointment conversions represent current surviving Lead relationships, not immutable lifetime history.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <ConversionCard
            title="Contact → Lead"
            description="Selected-range Contact Messages currently linked to a Lead."
            value={conversions.contactMessagesToLeads}
          />
          <ConversionCard
            title="Appointment → Lead"
            description="Selected-range Appointments currently linked to a Lead."
            value={conversions.appointmentsToLeads}
          />
          <ConversionCard
            title="Lead won rate"
            description="Won divided by won plus lost Leads created in this range."
            value={conversions.leadWonRate}
            primaryKey="won"
            primaryLabel="Won"
          />
        </div>
      </section>

      <section aria-labelledby="analytics-commercial-heading" className="grid gap-6 xl:grid-cols-3">
        <h2 id="analytics-commercial-heading" className="sr-only">Commercial analytics</h2>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Top Services</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">Most ordered Services</h3>
          {topOrderedServices.length > 0 ? (
            <ol className="mt-5 space-y-3">
              {topOrderedServices.map((service, index) => (
                <li key={service.slug} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-xs font-black text-brand-700">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900">{service.title || service.slug}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{service.slug}</p>
                  </div>
                  <span className="text-sm font-black text-slate-950">{formatNumber(service.count)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-500">No Service Orders are available for this range.</p>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Lead sources</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">Lead origin</h3>
          {leadSources.length > 0 ? (
            <div className="mt-5 space-y-3">
              {leadSources.map((source) => (
                <div key={source.source} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="min-w-0 break-words text-sm font-bold text-slate-700">{formatLabel(source.source)}</span>
                  <span className="shrink-0 text-sm font-black text-slate-950">{formatNumber(source.count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-500">No Leads are available for this range.</p>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Estimated pipeline</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">Open Lead value</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">Estimates only. Values are grouped by currency and are not revenue.</p>
          {estimatedPipelineValue.length > 0 ? (
            <div className="mt-5 space-y-3">
              {estimatedPipelineValue.map((item) => (
                <div key={item.currency} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-black text-slate-950">
                      {item.currency} {new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(item.amount)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {formatNumber(item.leadCount)} Lead{Number(item.leadCount) === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-500">No estimated open-pipeline values are available for this range.</p>
          )}
        </article>
      </section>
    </div>
  );
}

export default AdminAnalyticsOverview;
