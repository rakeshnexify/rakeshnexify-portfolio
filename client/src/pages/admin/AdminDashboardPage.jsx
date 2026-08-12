import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import AdminAnalyticsOverview from "../../components/admin/analytics/AdminAnalyticsOverview";
import useAdminAnalytics from "../../hooks/useAdminAnalytics";
import useAdminAuth from "../../hooks/useAdminAuth";


const ANALYTICS_RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

const dashboardModules = [
  {
    title: "Site Settings",
    description:
      "Manage the RakeshNexify brand identity, owner profile, Hero and About content, contact information, SEO and homepage sections.",
    status: "Management ready",
    path: "/admin/site-settings",
  },
  {
    title: "Services",
    description: "Create, edit, reorder, feature and hide portfolio services.",
    status: "Management ready",
    path: "/admin/services",
  },
  {
    title: "Service Packages / Pricing",
    description:
      "Create and manage Development and Management packages, pricing, billing cycles, comparison features, featured state, WhatsApp readiness and public visibility.",
    status: "Management ready",
    path: "/admin/service-packages",
  },
  {
    title: "Package Designs",
    description:
      "Create and manage selectable package designs, reusable Media thumbnails, responsive screenshots, live demos, default selection, featured state and public visibility.",
    status: "Management ready",
    path: "/admin/package-designs",
  },
  {
    title: "Service Orders",
    description:
      "Review customer package orders, selected designs, project requirements, order status and private Admin notes.",
    status: "Management ready",
    path: "/admin/service-orders",
  },
  {
    title: "Appointments / Consultations",
    description:
      "Review consultation requests, confirm schedules, assign Admin ownership, manage lifecycle status and convert qualified requests into Leads.",
    status: "Management ready",
    path: "/admin/appointments",
  },
  {
    title: "Newsletter / Subscribers",
    description:
      "Review newsletter Subscribers, search and filter subscription status, unsubscribe active Subscribers and perform restricted permanent deletion when necessary.",
    status: "Management ready",
    path: "/admin/subscribers",
  },
  {
    title: "Statistics",
    description:
      "Create, edit, reorder, feature and control the visibility of portfolio statistics.",
    status: "Management ready",
    path: "/admin/statistics",
  },
  {
    title: "Skills",
    description:
      "Create and manage professional Skills, categories, proficiency levels, experience, display order, featured status and public visibility.",
    status: "Management ready",
    path: "/admin/skills",
  },
  {
    title: "Education",
    description:
      "Create and manage institutions, qualifications, study timelines, grades, supporting links, display order, featured status and public visibility.",
    status: "Management ready",
    path: "/admin/education",
  },
  {
    title: "Experience",
    description:
      "Create and manage organizations, professional roles, employment timelines, responsibilities, achievements, expertise, display order, featured status and public visibility.",
    status: "Management ready",
    path: "/admin/experience",
  },
  {
    title: "Certifications & Achievements",
    description:
      "Create and manage independent certifications, licenses, awards and achievements, credential evidence, optional Education or Experience relations, display order, featured status and public visibility.",
    status: "Management ready",
    path: "/admin/achievements",
  },
  {
    title: "Projects",
    description:
      "Manage portfolio projects, case studies, images and project links.",
    status: "Management ready",
    path: "/admin/projects",
  },
  {
    title: "Media Management",
    description:
      "Upload and manage reusable images, SVG files, PDFs, audio and video assets with Cloudinary storage, metadata, usage tracking and safe deletion.",
    status: "Management ready",
    path: "/admin/media",
  },
  {
    title: "Blog & News",
    description:
      "Create and manage Blog and News articles, publishing metadata, related Projects, SEO, display order, featured status and public visibility.",
    status: "Management ready",
    path: "/admin/posts",
  },
  {
    title: "Team Members",
    description:
      "Create and manage Team member profiles, professional roles, availability, display order, featured status and public visibility.",
    status: "Management ready",
    path: "/admin/team",
  },
  {
    title: "Companies",
    description:
      "Create and manage company profiles, business information, services, contact details and public visibility.",
    status: "Management ready",
    path: "/admin/companies",
  },
  {
    title: "Testimonials",
    description:
      "Create and manage client reviews, ratings, profile media, related Projects, display order, featured status and public visibility.",
    status: "Management ready",
    path: "/admin/testimonials",
  },
  {
    title: "FAQs",
    description:
      "Create and manage customer questions, answers, dynamic categories, display order, featured priority and public visibility.",
    status: "Management ready",
    path: "/admin/faqs",
  },
  {
    title: "Leads / CRM",
    description:
      "Manage qualified enquiries and sales opportunities, pipeline status, priority, estimated value, assignments and follow-up schedules.",
    status: "Management ready",
    path: "/admin/leads",
  },
  {
    title: "Contact Messages",
    description:
      "Review client enquiries, update response status, save private notes and archive completed conversations.",
    status: "Management ready",
    path: "/admin/contact-messages",
  },
];

function formatRole(role = "") {
  return role
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


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
  const { admin, accessToken, logout } = useAdminAuth();
  const [analyticsRange, setAnalyticsRange] = useState("30d");

  function handleLogout() {
    logout();

    navigate("/admin/login", {
      replace: true,
    });
  }


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
    hasCurrentRangeData:
      hasCurrentAnalyticsData,
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 font-extrabold text-white">
              RN
            </div>

            <div className="min-w-0">
              <p className="truncate font-extrabold text-slate-950">
                RakeshNexify
              </p>

              <p className="truncate text-xs font-medium text-slate-500">
                Admin Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden text-sm font-semibold text-slate-600 transition hover:text-brand-600 sm:inline-flex"
            >
              View Portfolio
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
              Administration
            </p>

            <h1 className="mt-3 break-words text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome, {admin?.name || "Administrator"}
            </h1>

            <p className="mt-4 max-w-2xl break-words leading-7 text-slate-400">
              Manage your portfolio content, services, Service Packages,
              pricing, Package Designs, Skills, Education, Experience,
              Certifications & Achievements, projects, Media Library, Blog and
              News, Team members, companies, Testimonials, FAQs, consultation
              requests, newsletter Subscribers, Leads / CRM, enquiries and website settings from this
              secure dashboard.
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-700 bg-slate-900 p-4 lg:min-w-64">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Signed in account
            </p>

            <p className="mt-2 break-words text-sm font-semibold text-white">
              {admin?.email}
            </p>

            <span className="mt-3 inline-flex max-w-full break-words rounded-lg bg-brand-600/20 px-3 py-1.5 text-xs font-bold text-brand-300">
              {formatRole(admin?.role)}
            </span>
          </div>
        </div>

        <section
          aria-labelledby="admin-analytics-heading"
          className="mt-8"
        >
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                Admin Analytics
              </p>

              <h2
                id="admin-analytics-heading"
                className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
              >
                Business performance snapshot
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Private operational aggregates from Orders, Appointments, Leads,
                Contact Messages and newsletter Subscriber activity.
              </p>

              {hasCurrentAnalyticsData ? (
                <p className="mt-2 text-xs font-semibold text-slate-400">
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

          {!analyticsError &&
          !hasCurrentAnalyticsData ? (
            <div
              role="status"
              className="mt-5 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500"
            >
              {isAnalyticsLoading
                ? "Loading Admin analytics..."
                : "Preparing Admin analytics..."}
            </div>
          ) : null}

          {!analyticsError &&
          hasCurrentAnalyticsData ? (
            <div className="mt-5">
              <AdminAnalyticsOverview data={analyticsData} />
            </div>
          ) : null}
        </section>

        <section
          aria-labelledby="management-modules-heading"
          className="mt-10"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
              Management
            </p>
            <h2
              id="management-modules-heading"
              className="mt-2 text-2xl font-black tracking-tight text-slate-950"
            >
              Management modules
            </h2>
          </div>

          <div className="mt-5 grid min-w-0 gap-6 [&>*]:min-w-0 md:grid-cols-2">
          {dashboardModules.map((module) => (
            <article
              key={module.title}
              className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:shadow-lg"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="min-w-0 break-words text-xl font-bold text-slate-950">
                  {module.title}
                </h2>

                <span className="shrink-0 self-start rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {module.status}
                </span>
              </div>

              <p className="mt-3 flex-1 break-words leading-7 text-slate-600">
                {module.description}
              </p>

              <Link
                to={module.path}
                className="mt-6 inline-flex min-h-10 max-w-full self-start items-center justify-center rounded-lg bg-brand-600 px-4 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Open management page →
              </Link>
            </article>
          ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default AdminDashboardPage;
