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
        className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7"
      >
        <header className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="uppercase tracking-[0.14em] text-brand-700">
                  Dashboard
                </span>

                <span aria-hidden="true" className="text-slate-300">
                  /
                </span>

                <span className="text-slate-500">Analytics overview</span>
              </div>

              <h1
                id="admin-analytics-heading"
                className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
              >
                Admin Analytics
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Monitor operational activity across Service Orders,
                Appointments, Leads, Contact Messages and Subscriber activity.
              </p>

              {hasCurrentAnalyticsData ? (
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  {formatRangeSummary(analyticsData.range)}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center">
              <div
                aria-label="Analytics date range"
                className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:flex"
                role="group"
              >
                {ANALYTICS_RANGES.map((range) => {
                  const isActive = analyticsRange === range.value;

                  return (
                    <button
                      aria-pressed={isActive}
                      className={`inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-colors duration-150 motion-reduce:transition-none sm:min-w-[76px] ${
                        isActive
                          ? "bg-slate-950 text-white shadow-sm"
                          : "text-slate-600 hover:bg-white hover:text-slate-950"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                      disabled={isAnalyticsLoading && isActive}
                      key={range.value}
                      onClick={() => setAnalyticsRange(range.value)}
                      type="button"
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>

              <button
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-700 transition-colors duration-150 motion-reduce:transition-none hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isAnalyticsLoading}
                onClick={refreshAnalytics}
                type="button"
              >
                {isAnalyticsLoading ? "Refreshing..." : "Refresh data"}
              </button>
            </div>
          </div>
        </header>

        {analyticsError ? (
          <div
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700"
            role="alert"
          >
            <p className="font-black">Unable to load Admin analytics.</p>

            <p className="mt-1">{analyticsError.message}</p>

            <button
              className="mt-3 min-h-10 font-bold underline underline-offset-4"
              onClick={refreshAnalytics}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!analyticsError && !hasCurrentAnalyticsData ? (
          <div
            className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm"
            role="status"
          >
            {isAnalyticsLoading
              ? "Loading Admin analytics..."
              : "Preparing Admin analytics..."}
          </div>
        ) : null}

        {!analyticsError && hasCurrentAnalyticsData ? (
          <div className="mt-4">
            <AdminAnalyticsOverview data={analyticsData} />
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default AdminDashboardPage;