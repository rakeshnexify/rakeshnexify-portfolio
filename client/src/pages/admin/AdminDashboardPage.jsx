import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { AdminIcon } from "../../components/admin/layout/adminIcons";
import useAdminAnalytics from "../../hooks/useAdminAnalytics";
import useAdminAuth from "../../hooks/useAdminAuth";
import { fetchAdminContactMessages } from "../../services/adminContactMessagesApi";
import { fetchAdminLeads } from "../../services/adminLeadsApi";
import { fetchAdminProjects } from "../../services/adminProjectsApi";
import { fetchAdminServiceOrders } from "../../services/adminServiceOrdersApi";
import { fetchAdminServices } from "../../services/adminServicesApi";

const ANALYTICS_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

const QUICK_ACTIONS = [
  {
    label: "Add New Project",
    route: "/admin/projects/new",
    icon: "projects",
    tone: "violet",
  },
  {
    label: "Add New Service",
    route: "/admin/services/new",
    icon: "services",
    tone: "blue",
  },
  {
    label: "New Blog Post",
    route: "/admin/posts/new",
    icon: "posts",
    tone: "green",
  },
  {
    label: "Add Team Member",
    route: "/admin/team/new",
    icon: "team",
    tone: "orange",
  },
  {
    label: "Upload Media",
    route: "/admin/media",
    icon: "media",
    tone: "pink",
  },
  {
    label: "View Messages",
    route: "/admin/contact-messages",
    icon: "messages",
    tone: "violet",
  },
];

const CHART_WIDTH = 680;
const CHART_HEIGHT = 238;
const CHART_LEFT = 38;
const CHART_RIGHT = 16;
const CHART_TOP = 20;
const CHART_BOTTOM = 36;

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat().format(Number(value) || 0);
}

function formatRole(role) {
  return String(role || "admin")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatBucketLabel(value, bucket) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    ...(bucket === "month" ? { year: "2-digit" } : { day: "numeric" }),
    timeZone: "UTC",
  }).format(date);
}

function formatRangeLabel(range, selectedRange) {
  const rangeOption =
    ANALYTICS_RANGES.find((item) => item.value === selectedRange) ||
    ANALYTICS_RANGES[1];

  if (!range?.to) {
    return rangeOption.label;
  }

  const to = new Date(range.to);

  if (Number.isNaN(to.getTime())) {
    return rangeOption.label;
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  if (!range.from) {
    return `Through ${formatter.format(to)}`;
  }

  const from = new Date(range.from);

  if (Number.isNaN(from.getTime())) {
    return rangeOption.label;
  }

  return `${formatter.format(from)} – ${formatter.format(to)}`;
}

function formatRelativeTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const difference = Date.now() - date.getTime();

  if (difference < 60_000) {
    return "Just now";
  }

  const minutes = Math.floor(difference / 60_000);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function createInitials(name, fallback = "RN") {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return initials || fallback;
}

function formatOrderPrice(order) {
  const snapshot = order?.packageSnapshot;

  if (!snapshot) {
    return "—";
  }

  if (snapshot.pricingMode === "custom") {
    return snapshot.priceLabel || "Custom";
  }

  const price = Number(snapshot.price);

  if (!Number.isFinite(price)) {
    return snapshot.priceLabel || "—";
  }

  return `${String(snapshot.currency || "NPR").toUpperCase()} ${price.toLocaleString(
    "en-US",
  )}`;
}

function formatStatus(value) {
  return String(value || "Unknown")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function createChartPoint(index, count, totalPoints, maximum) {
  const chartWidth = CHART_WIDTH - CHART_LEFT - CHART_RIGHT;
  const chartHeight = CHART_HEIGHT - CHART_TOP - CHART_BOTTOM;

  const x =
    totalPoints <= 1
      ? CHART_LEFT + chartWidth / 2
      : CHART_LEFT + (index / (totalPoints - 1)) * chartWidth;

  const y =
    CHART_TOP +
    chartHeight -
    (maximum > 0 ? (count / maximum) * chartHeight : 0);

  return { x, y };
}

function DashboardOverviewChart({ trends = [], bucket = "day" }) {
  const rows = Array.isArray(trends) ? trends : [];

  const maximum = Math.max(
    1,
    ...rows.flatMap((row) => [
      Number(row?.orders) || 0,
      Number(row?.leads) || 0,
    ]),
  );

  const labelStep = Math.max(1, Math.ceil(rows.length / 6));

  const orderPoints = rows.map((row, index) => {
    const point = createChartPoint(
      index,
      Number(row?.orders) || 0,
      rows.length,
      maximum,
    );

    return `${point.x},${point.y}`;
  });

  const leadPoints = rows.map((row, index) => {
    const point = createChartPoint(
      index,
      Number(row?.leads) || 0,
      rows.length,
      maximum,
    );

    return `${point.x},${point.y}`;
  });

  if (rows.length === 0) {
    return (
      <div className="admin-dashboard-empty mt-5 grid min-h-56 place-items-center rounded-xl text-center">
        <div>
          <p className="text-sm font-bold text-slate-300">
            No chart activity yet
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Orders and Leads will appear here when activity is recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto overscroll-x-contain">
      <svg
        aria-labelledby="admin-dashboard-chart-title admin-dashboard-chart-description"
        className="min-w-[620px]"
        role="img"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <title id="admin-dashboard-chart-title">
          Orders and Leads overview
        </title>

        <desc id="admin-dashboard-chart-description">
          Line chart comparing Orders and Leads over the selected analytics
          range.
        </desc>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const chartHeight = CHART_HEIGHT - CHART_TOP - CHART_BOTTOM;

          const y = CHART_TOP + (1 - ratio) * chartHeight;
          const value = Math.round(maximum * ratio);

          return (
            <g key={ratio}>
              <line
                className="admin-dashboard-chart-grid"
                strokeWidth="1"
                x1={CHART_LEFT}
                x2={CHART_WIDTH - CHART_RIGHT}
                y1={y}
                y2={y}
              />

              <text
                className="admin-dashboard-chart-label text-[10px]"
                textAnchor="end"
                x={CHART_LEFT - 8}
                y={y + 4}
              >
                {value}
              </text>
            </g>
          );
        })}

        <polyline
          className="admin-dashboard-chart-orders"
          fill="none"
          points={orderPoints.join(" ")}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />

        <polyline
          className="admin-dashboard-chart-leads"
          fill="none"
          points={leadPoints.join(" ")}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />

        {rows.map((row, index) => {
          if (
            index % labelStep !== 0 &&
            index !== rows.length - 1
          ) {
            return null;
          }

          const point = createChartPoint(
            index,
            0,
            rows.length,
            maximum,
          );

          return (
            <text
              className="admin-dashboard-chart-label text-[10px]"
              key={row.start}
              textAnchor="middle"
              x={point.x}
              y={CHART_HEIGHT - 10}
            >
              {formatBucketLabel(row.start, bucket)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function MetricCard({ label, value, icon, tone, description }) {
  return (
    <article
      className="admin-dashboard-metric relative overflow-hidden rounded-xl p-4"
      data-tone={tone}
    >
      <span
        aria-hidden="true"
        className="admin-dashboard-metric-accent absolute inset-x-0 top-0 h-px"
      />

      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="admin-dashboard-metric-icon flex size-11 shrink-0 items-center justify-center rounded-full"
        >
          <AdminIcon name={icon} size={19} />
        </span>

        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-slate-300">
            {label}
          </p>

          <p className="mt-1 text-[26px] font-medium leading-none tracking-tight text-white">
            {formatNumber(value)}
          </p>

          <p className="mt-2 truncate text-[10px] text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

function PanelHeader({ title, route, actionLabel = "View All" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold text-white">{title}</h2>

      {route ? (
        <Link
          className="admin-dashboard-view-link inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[10px] font-semibold"
          to={route}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, admin, logout } = useAdminAuth();

  const [analyticsRange, setAnalyticsRange] = useState("30d");
  const [snapshotRefreshKey, setSnapshotRefreshKey] = useState(0);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState("");
  const [snapshot, setSnapshot] = useState({
    projectsCount: null,
    servicesCount: null,
    ordersTotal: null,
    leadsTotal: null,
    messagesTotal: null,
    orders: [],
    leads: [],
    messages: [],
  });

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

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadDashboardSnapshot() {
      try {
        setIsSnapshotLoading(true);
        setSnapshotError("");

        const [
          projectsResponse,
          servicesResponse,
          ordersResponse,
          leadsResponse,
          messagesResponse,
        ] = await Promise.all([
          fetchAdminProjects(accessToken, {}, { signal: controller.signal }),
          fetchAdminServices(accessToken, {}, { signal: controller.signal }),
          fetchAdminServiceOrders(
            accessToken,
            { page: 1, limit: 5 },
            { signal: controller.signal },
          ),
          fetchAdminLeads(
            accessToken,
            { page: 1, limit: 5, sort: "newest" },
            { signal: controller.signal },
          ),
          fetchAdminContactMessages(
            accessToken,
            { page: 1, limit: 5, sort: "newest" },
            { signal: controller.signal },
          ),
        ]);

        setSnapshot({
          projectsCount:
            Number(projectsResponse.count) ||
            projectsResponse.projects?.length ||
            0,
          servicesCount:
            Number(servicesResponse.count) ||
            servicesResponse.services?.length ||
            0,
          ordersTotal:
            Number(ordersResponse.total) ||
            Number(ordersResponse.count) ||
            ordersResponse.orders?.length ||
            0,
          leadsTotal:
            Number(leadsResponse.total) ||
            Number(leadsResponse.count) ||
            leadsResponse.leads?.length ||
            0,
          messagesTotal:
            Number(messagesResponse.total) ||
            Number(messagesResponse.count) ||
            messagesResponse.messages?.length ||
            0,
          orders: Array.isArray(ordersResponse.orders)
            ? ordersResponse.orders.slice(0, 5)
            : [],
          leads: Array.isArray(leadsResponse.leads)
            ? leadsResponse.leads.slice(0, 5)
            : [],
          messages: Array.isArray(messagesResponse.messages)
            ? messagesResponse.messages.slice(0, 5)
            : [],
        });
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
          handleUnauthorized();
          return;
        }

        setSnapshotError(
          requestError?.message || "Unable to load dashboard snapshot.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsSnapshotLoading(false);
        }
      }
    }

    loadDashboardSnapshot();

    return () => {
      controller.abort();
    };
  }, [accessToken, handleUnauthorized, snapshotRefreshKey]);

  const adminName = String(admin?.name || "Admin").trim();
  const currentSubscribers = analyticsData?.currentSubscribers || {};

  const metrics = useMemo(
    () => [
      {
        key: "projects",
        label: "Total Projects",
        value: snapshot.projectsCount,
        icon: "projects",
        tone: "violet",
        description: "Current portfolio items",
      },
      {
        key: "services",
        label: "Services",
        value: snapshot.servicesCount,
        icon: "services",
        tone: "blue",
        description: "Current Service catalog",
      },
      {
        key: "orders",
        label: "Orders",
        value: snapshot.ordersTotal,
        icon: "orders",
        tone: "green",
        description: "Current Service Orders",
      },
      {
        key: "leads",
        label: "Leads",
        value: snapshot.leadsTotal,
        icon: "leads",
        tone: "orange",
        description: "Current CRM records",
      },
      {
        key: "messages",
        label: "Messages",
        value: snapshot.messagesTotal,
        icon: "messages",
        tone: "purple",
        description: "Contact enquiries",
      },
      {
        key: "subscribers",
        label: "Subscribers",
        value: hasCurrentAnalyticsData
          ? currentSubscribers.total
          : null,
        icon: "subscribers",
        tone: "pink",
        description: "Current newsletter total",
      },
    ],
    [
      currentSubscribers.total,
      hasCurrentAnalyticsData,
      snapshot.leadsTotal,
      snapshot.messagesTotal,
      snapshot.ordersTotal,
      snapshot.projectsCount,
      snapshot.servicesCount,
    ],
  );

  function handleRefreshDashboard() {
    setSnapshotRefreshKey((current) => current + 1);
    refreshAnalytics();
  }

  const isBusy = isSnapshotLoading || isAnalyticsLoading;
  const hasDashboardError = Boolean(snapshotError || analyticsError);

  return (
    <main className="admin-dashboard-reference min-h-[calc(100vh-62px)]">
      <section className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white lg:text-[26px]">
              {getGreeting()}, {adminName}{" "}
              <span aria-hidden="true">👋</span>
            </h1>

            <p className="mt-1.5 text-sm text-slate-400">
              Here&apos;s what&apos;s happening with your portfolio today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="admin-dashboard-range flex min-h-10 items-center gap-2 rounded-xl px-3">
              <AdminIcon name="calendar" size={15} />

              <span className="sr-only">Analytics date range</span>

              <select
                aria-label="Analytics date range"
                className="min-w-[154px] bg-transparent text-xs font-semibold outline-none"
                disabled={isAnalyticsLoading}
                onChange={(event) => setAnalyticsRange(event.target.value)}
                value={analyticsRange}
              >
                {ANALYTICS_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="admin-dashboard-refresh inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold"
              disabled={isBusy}
              onClick={handleRefreshDashboard}
              type="button"
            >
              {isBusy ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {hasDashboardError ? (
          <div
            className="admin-dashboard-error mt-4 rounded-xl px-4 py-3 text-xs"
            role="alert"
          >
            Some dashboard data could not be loaded.{" "}
            {snapshotError || analyticsError?.message}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {metrics.map((metric) => (
            <MetricCard {...metric} key={metric.key} />
          ))}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.18fr_1fr_1fr]">
          <section className="admin-dashboard-panel rounded-xl p-4">
            <PanelHeader title="Overview" />

            <div className="mt-3 flex items-center justify-center gap-5 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-sm bg-sky-500" />
                Orders
              </span>

              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-sm bg-violet-500" />
                Leads
              </span>
            </div>

            <DashboardOverviewChart
              bucket={analyticsData?.range?.bucket}
              trends={analyticsData?.trends}
            />
          </section>

          <section className="admin-dashboard-panel rounded-xl p-4">
            <PanelHeader
              route="/admin/service-orders"
              title="Recent Orders"
            />

            <div className="mt-3 divide-y divide-slate-800/80">
              {snapshot.orders.length > 0 ? (
                snapshot.orders.map((order) => (
                  <Link
                    className="admin-dashboard-list-row grid min-h-[52px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-2.5"
                    key={order._id}
                    to={`/admin/service-orders/${order._id}`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="admin-dashboard-row-avatar flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                      >
                        {createInitials(order.customerName, "OR")}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-slate-100">
                          {order.orderNumber || "Order"}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {order.customerName || "Customer"}
                        </p>
                      </div>
                    </div>

                    <span className="whitespace-nowrap text-[11px] font-bold text-slate-100">
                      {formatOrderPrice(order)}
                    </span>

                    <span
                      className="admin-dashboard-status rounded-md px-2 py-1 text-[9px] font-semibold"
                      data-status={order.status || "unknown"}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="py-8 text-center text-xs text-slate-500">
                  {isSnapshotLoading
                    ? "Loading recent Orders..."
                    : "No Service Orders yet."}
                </p>
              )}
            </div>
          </section>

          <section className="admin-dashboard-panel rounded-xl p-4">
            <PanelHeader title="Quick Actions" />

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  className="admin-dashboard-quick-action flex min-h-[54px] items-center gap-2.5 rounded-xl px-3"
                  data-tone={action.tone}
                  key={action.route}
                  to={action.route}
                >
                  <span
                    aria-hidden="true"
                    className="admin-dashboard-quick-icon flex size-8 shrink-0 items-center justify-center rounded-lg"
                  >
                    <AdminIcon name={action.icon} size={16} />
                  </span>

                  <span className="min-w-0 truncate text-[11px] font-semibold text-slate-100">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.08fr_1.08fr_.92fr]">
          <section className="admin-dashboard-panel rounded-xl p-4">
            <PanelHeader route="/admin/leads" title="Recent Leads" />

            <div className="mt-3 divide-y divide-slate-800/80">
              {snapshot.leads.length > 0 ? (
                snapshot.leads.slice(0, 4).map((lead) => (
                  <Link
                    className="admin-dashboard-list-row grid min-h-[55px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-2.5"
                    key={lead._id}
                    to={`/admin/leads/${lead._id}/edit`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="admin-dashboard-row-avatar flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                      >
                        {createInitials(lead.name, "LD")}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-slate-100">
                          {lead.name || "Lead"}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {lead.subject || lead.service || "CRM Lead"}
                        </p>
                      </div>
                    </div>

                    <span className="whitespace-nowrap text-[9px] text-slate-500">
                      {formatRelativeTime(lead.createdAt)}
                    </span>

                    <span
                      className="admin-dashboard-status rounded-md px-2 py-1 text-[9px] font-semibold"
                      data-status={lead.status || "unknown"}
                    >
                      {formatStatus(lead.status)}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="py-8 text-center text-xs text-slate-500">
                  {isSnapshotLoading
                    ? "Loading recent Leads..."
                    : "No Leads yet."}
                </p>
              )}
            </div>
          </section>

          <section className="admin-dashboard-panel rounded-xl p-4">
            <PanelHeader
              route="/admin/contact-messages"
              title="Recent Messages"
            />

            <div className="mt-3 divide-y divide-slate-800/80">
              {snapshot.messages.length > 0 ? (
                snapshot.messages.slice(0, 4).map((message) => (
                  <div
                    className="admin-dashboard-list-row grid min-h-[55px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-2.5"
                    key={message._id}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="admin-dashboard-row-avatar flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                      >
                        {createInitials(message.name, "CM")}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-slate-100">
                          {message.name || "Visitor"}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {message.message || message.subject || "Contact Message"}
                        </p>
                      </div>
                    </div>

                    <span className="whitespace-nowrap text-[9px] text-slate-500">
                      {formatRelativeTime(message.createdAt)}
                    </span>

                    <span
                      aria-label={message.status === "new" ? "New message" : undefined}
                      className={`size-1.5 rounded-full ${
                        message.status === "new"
                          ? "bg-blue-500"
                          : "bg-slate-700"
                      }`}
                    />
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-xs text-slate-500">
                  {isSnapshotLoading
                    ? "Loading recent Messages..."
                    : "No Contact Messages yet."}
                </p>
              )}
            </div>
          </section>

          <section className="admin-dashboard-panel rounded-xl p-4">
            <PanelHeader title="System Overview" />

            <dl className="mt-3 divide-y divide-slate-800/80">
              <div className="admin-dashboard-system-row flex min-h-[50px] items-center gap-3 py-2.5">
                <span
                  aria-hidden="true"
                  className="admin-dashboard-system-icon flex size-8 shrink-0 items-center justify-center rounded-lg"
                >
                  <AdminIcon name="account" size={15} />
                </span>

                <dt className="min-w-0 flex-1 text-[11px] text-slate-200">
                  Admin Session
                </dt>

                <dd className="text-[10px] font-semibold text-emerald-400">
                  Active
                </dd>
              </div>

              <div className="admin-dashboard-system-row flex min-h-[50px] items-center gap-3 py-2.5">
                <span
                  aria-hidden="true"
                  className="admin-dashboard-system-icon flex size-8 shrink-0 items-center justify-center rounded-lg"
                >
                  <AdminIcon name="dashboard" size={15} />
                </span>

                <dt className="min-w-0 flex-1 text-[11px] text-slate-200">
                  Analytics API
                </dt>

                <dd
                  className={`text-[10px] font-semibold ${
                    analyticsError
                      ? "text-rose-400"
                      : hasCurrentAnalyticsData
                        ? "text-emerald-400"
                        : "text-amber-400"
                  }`}
                >
                  {analyticsError
                    ? "Unavailable"
                    : hasCurrentAnalyticsData
                      ? "Connected"
                      : "Checking"}
                </dd>
              </div>

              <div className="admin-dashboard-system-row flex min-h-[50px] items-center gap-3 py-2.5">
                <span
                  aria-hidden="true"
                  className="admin-dashboard-system-icon flex size-8 shrink-0 items-center justify-center rounded-lg"
                >
                  <AdminIcon name="settings" size={15} />
                </span>

                <dt className="min-w-0 flex-1 text-[11px] text-slate-200">
                  CMS Data
                </dt>

                <dd
                  className={`text-[10px] font-semibold ${
                    snapshotError
                      ? "text-rose-400"
                      : isSnapshotLoading
                        ? "text-amber-400"
                        : "text-emerald-400"
                  }`}
                >
                  {snapshotError
                    ? "Unavailable"
                    : isSnapshotLoading
                      ? "Checking"
                      : "Connected"}
                </dd>
              </div>

              <div className="admin-dashboard-system-row flex min-h-[50px] items-center gap-3 py-2.5">
                <span
                  aria-hidden="true"
                  className="admin-dashboard-system-icon flex size-8 shrink-0 items-center justify-center rounded-lg"
                >
                  <AdminIcon name="audit" size={15} />
                </span>

                <dt className="min-w-0 flex-1 text-[11px] text-slate-200">
                  Access Role
                </dt>

                <dd className="text-right text-[10px] font-semibold text-slate-300">
                  {formatRole(admin?.role)}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-[9px] leading-4 text-slate-600">
              Only real application state is shown here. Storage, backup and
              infrastructure metrics are not displayed unless a verified API
              provides them.
            </p>
          </section>
        </div>

        <footer className="admin-dashboard-footer mt-6 flex flex-col gap-2 border-t pt-5 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} RakeshNexify. All rights reserved.
          </p>

          <p>
            {formatRangeLabel(analyticsData?.range, analyticsRange)}
          </p>
        </footer>
      </section>
    </main>
  );
}

export default AdminDashboardPage;