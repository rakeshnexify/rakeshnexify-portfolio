import { Link, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";

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

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();

  function handleLogout() {
    logout();

    navigate("/admin/login", {
      replace: true,
    });
  }

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
              News, Team members, companies, Testimonials, FAQs, Leads / CRM,
              enquiries and website settings from this secure dashboard.
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

        <div className="mt-8 grid min-w-0 gap-6 [&>*]:min-w-0 md:grid-cols-2">
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
    </main>
  );
}

export default AdminDashboardPage;
