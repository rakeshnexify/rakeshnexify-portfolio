import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import AdminAnalyticsOverview from "../../components/admin/analytics/AdminAnalyticsOverview";
import useAdminAnalytics from "../../hooks/useAdminAnalytics";
import useAdminAuth from "../../hooks/useAdminAuth";

const ANALYTICS_RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

function formatRangeSummary(range) {
  if (!range?.to) {
    return "";
  }

  const to = new Date(range.to);

  if (Number.isNaN(to.getTime())) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  if (!range.from) {
    return `All recorded activity through ${formatter.format(to)} UTC`;
  }

  const from = new Date(range.from);

  if (Number.isNaN(from.getTime())) {
    return "";
  }

  return `${formatter.format(from)} – ${formatter.format(to)} UTC`;
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, logout } = useAdminAuth();
  const [analyticsRange, setAnalyticsRange] = useState("30d");

  const handleUnauthorized = useCallback(() => {
    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: location.pathname,
        },
      },
    });
  }, [location.pathname, logout, navigate]);

  const {
    data: analyticsData,
    hasCurrentRangeData: hasCurrentAnalyticsData,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    refresh: refreshAnalytics,
  } = useAdminAnalytics({
    accessToken,
    range: analyticsRange,
    onUnauthorized: handleUnauthorized,
    enabled: Boolean(accessToken),
  });

  return (
    <main className="min-h-screen bg-slate-100">
      <section
        aria-labelledby="admin-analytics-heading"
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      >
        <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
              Admin Analytics
            </p>

            <h1
              id="admin-analytics-heading"
              className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
            >
              Admin Analytics Dashboard
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Monitor private operational performance across Service Orders,
              Appointments, Leads, Contact Messages and newsletter Subscriber
              activity.
            </p>

            {hasCurrentAnalyticsData ? (
              <p className="mt-3 text-xs font-semibold text-slate-400">
                {formatRangeSummary(analyticsData.range)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              role="group"
              aria-label="Analytics date range"
              className="grid grid-cols-2 gap-2 sm:flex"
            >
              {ANALYTICS_RANGES.map((range) => {
                const isActive = analyticsRange === range.value;

                return (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => setAnalyticsRange(range.value)}
                    aria-pressed={isActive}
                    disabled={isAnalyticsLoading && isActive}
                    className={`inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition ${
                      isActive
                        ? "bg-slate-950 text-white"
                        : "border border-slate-300 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={refreshAnalytics}
              disabled={isAnalyticsLoading}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyticsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {analyticsError ? (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700"
          >
            <p className="font-black">Unable to load Admin analytics.</p>
            <p className="mt-1">{analyticsError.message}</p>

            <button
              type="button"
              onClick={refreshAnalytics}
              className="mt-3 min-h-10 font-bold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!analyticsError && !hasCurrentAnalyticsData ? (
          <div
            role="status"
            className="mt-5 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500"
          >
            {isAnalyticsLoading
              ? "Loading Admin analytics..."
              : "Preparing Admin analytics..."}
          </div>
        ) : null}

        {!analyticsError && hasCurrentAnalyticsData ? (
          <div className="mt-5">
            <AdminAnalyticsOverview data={analyticsData} />
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default AdminDashboardPage;
