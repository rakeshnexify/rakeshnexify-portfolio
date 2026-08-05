import { useEffect, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";

import PageSeo from "../components/seo/PageSeo";
import CompaniesPage from "../pages/CompaniesPage";
import CompanyDetailsPage from "../pages/CompanyDetailsPage";
import HomePage from "../pages/HomePage";
import NotFoundPage from "../pages/NotFoundPage";
import ProjectDetailsPage from "../pages/ProjectDetailsPage";
import ProjectsPage from "../pages/ProjectsPage";
import ServicesPage from "../pages/ServicesPage";
import StatisticsPage from "../pages/StatisticsPage";
import TeamPage from "../pages/TeamPage";
import TeamMemberDetailsPage from "../pages/TeamMemberDetailsPage";

import AdminCompaniesPage from "../pages/admin/AdminCompaniesPage";
import AdminCompanyEditorPage from "../pages/admin/AdminCompanyEditorPage";
import AdminContactMessagesPage from "../pages/admin/AdminContactMessagesPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminLoginPage from "../pages/admin/AdminLoginPage";
import AdminProjectEditorPage from "../pages/admin/AdminProjectEditorPage";
import AdminProjectsPage from "../pages/admin/AdminProjectsPage";
import AdminServiceEditorPage from "../pages/admin/AdminServiceEditorPage";
import AdminServicesPage from "../pages/admin/AdminServicesPage";
import AdminSkillEditorPage from "../pages/admin/AdminSkillEditorPage";
import AdminSkillsPage from "../pages/admin/AdminSkillsPage";
import AdminSiteSettingsEditorPage from "../pages/admin/AdminSiteSettingsEditorPage";
import AdminSiteSettingsPage from "../pages/admin/AdminSiteSettingsPage";
import AdminStatisticEditorPage from "../pages/admin/AdminStatisticEditorPage";
import AdminStatisticsPage from "../pages/admin/AdminStatisticsPage";
import AdminTeamMemberEditorPage from "../pages/admin/AdminTeamMemberEditorPage";
import AdminTeamMembersPage from "../pages/admin/AdminTeamMembersPage";

import ProtectedAdminRoute from "./ProtectedAdminRoute";
import PublicPageVisibilityRoute from "./PublicPageVisibilityRoute";
import PublicSiteRoute from "./PublicSiteRoute";

function AdminSeoManager() {
  const { pathname } = useLocation();

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!isAdminRoute) {
    return null;
  }

  const isLoginPage = pathname === "/admin/login";

  return (
    <PageSeo
      title={
        isLoginPage
          ? "Admin Login | RakeshNexify"
          : "Admin Panel | RakeshNexify"
      }
      description={
        isLoginPage
          ? "Secure administrator login for the RakeshNexify website management system."
          : "Secure RakeshNexify website administration and content management area."
      }
      canonicalPath={pathname}
      type="website"
      noIndex
      brandName="RakeshNexify"
    />
  );
}

function RouteScrollManager() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) {
      return undefined;
    }

    const previousScrollRestoration = window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    let animationFrameId = 0;
    let retryTimerId = 0;
    let stopObserverTimerId = 0;
    let resizeObserver = null;
    let isCancelled = false;

    function cancelScheduledFrame() {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);

        animationFrameId = 0;
      }
    }

    function scrollToPageTop() {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }

    if (!hash) {
      animationFrameId = window.requestAnimationFrame(() => {
        scrollToPageTop();
      });

      return () => {
        isCancelled = true;

        cancelScheduledFrame();
      };
    }

    let sectionId = "";

    try {
      sectionId = decodeURIComponent(hash.slice(1));
    } catch {
      sectionId = hash.slice(1);
    }

    function alignHashSection() {
      if (isCancelled) {
        return false;
      }

      const targetSection = document.getElementById(sectionId);

      if (!targetSection) {
        return false;
      }

      cancelScheduledFrame();

      animationFrameId = window.requestAnimationFrame(() => {
        if (isCancelled) {
          return;
        }

        targetSection.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      });

      return true;
    }

    function watchHomepageLayout() {
      if (!("ResizeObserver" in window)) {
        return;
      }

      const layoutRoot =
        document.getElementById("main-content") || document.body;

      resizeObserver = new ResizeObserver(() => {
        alignHashSection();
      });

      resizeObserver.observe(layoutRoot);

      /*
       * Services, Projects and Companies data
       * load hone ke baad layout height change
       * ho sakti hai. Kuch seconds tak target
       * section ko aligned rakhenge.
       */
      stopObserverTimerId = window.setTimeout(() => {
        resizeObserver?.disconnect();
        resizeObserver = null;
      }, 5000);
    }

    let retryCount = 0;
    const maximumRetries = 80;

    function findAndAlignHashSection() {
      if (isCancelled) {
        return;
      }

      const sectionFound = alignHashSection();

      if (sectionFound) {
        watchHomepageLayout();
        return;
      }

      retryCount += 1;

      if (retryCount >= maximumRetries) {
        scrollToPageTop();
        return;
      }

      retryTimerId = window.setTimeout(findAndAlignHashSection, 50);
    }

    findAndAlignHashSection();

    return () => {
      isCancelled = true;

      cancelScheduledFrame();

      window.clearTimeout(retryTimerId);

      window.clearTimeout(stopObserverTimerId);

      resizeObserver?.disconnect();
    };
  }, [pathname, search, hash]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <RouteScrollManager />

      <AdminSeoManager />

      <Routes>
        <Route element={<PublicSiteRoute />}>
          <Route path="/" element={<HomePage />} />

          <Route
            element={<PublicPageVisibilityRoute sectionKey="statistics" />}
          >
            <Route path="/statistics" element={<StatisticsPage />} />
          </Route>

          <Route element={<PublicPageVisibilityRoute sectionKey="services" />}>
            <Route path="/services" element={<ServicesPage />} />
          </Route>

          <Route element={<PublicPageVisibilityRoute sectionKey="projects" />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailsPage />} />
          </Route>

          <Route element={<PublicPageVisibilityRoute sectionKey="team" />}>
            <Route path="/team" element={<TeamPage />} />

            <Route path="/team/:slug" element={<TeamMemberDetailsPage />} />
          </Route>

          <Route element={<PublicPageVisibilityRoute sectionKey="companies" />}>
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/companies/:slug" element={<CompanyDetailsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

          <Route
            path="/admin/site-settings"
            element={<AdminSiteSettingsPage />}
          />

          <Route
            path="/admin/site-settings/:pageKey"
            element={<AdminSiteSettingsEditorPage />}
          />

          <Route
            path="/admin/contact-messages"
            element={<AdminContactMessagesPage />}
          />

          <Route path="/admin/services" element={<AdminServicesPage />} />
          <Route
            path="/admin/services/new"
            element={<AdminServiceEditorPage mode="create" />}
          />
          <Route
            path="/admin/services/:id/edit"
            element={<AdminServiceEditorPage mode="edit" />}
          />

          <Route path="/admin/statistics" element={<AdminStatisticsPage />} />
          <Route
            path="/admin/statistics/new"
            element={<AdminStatisticEditorPage mode="create" />}
          />
          <Route
            path="/admin/statistics/:id/edit"
            element={<AdminStatisticEditorPage mode="edit" />}
          />

          <Route path="/admin/skills" element={<AdminSkillsPage />} />
          <Route
            path="/admin/skills/new"
            element={<AdminSkillEditorPage mode="create" />}
          />
          <Route
            path="/admin/skills/:id/edit"
            element={<AdminSkillEditorPage mode="edit" />}
          />

          <Route path="/admin/team" element={<AdminTeamMembersPage />} />
          <Route
            path="/admin/team/new"
            element={<AdminTeamMemberEditorPage mode="create" />}
          />
          <Route
            path="/admin/team/:id/edit"
            element={<AdminTeamMemberEditorPage mode="edit" />}
          />

          <Route path="/admin/projects" element={<AdminProjectsPage />} />
          <Route
            path="/admin/projects/new"
            element={<AdminProjectEditorPage mode="create" />}
          />
          <Route
            path="/admin/projects/:id/edit"
            element={<AdminProjectEditorPage mode="edit" />}
          />

          <Route path="/admin/companies" element={<AdminCompaniesPage />} />
          <Route
            path="/admin/companies/new"
            element={<AdminCompanyEditorPage mode="create" />}
          />
          <Route
            path="/admin/companies/:id/edit"
            element={<AdminCompanyEditorPage mode="edit" />}
          />
        </Route>

        <Route
          path="/admin/*"
          element={<Navigate to="/admin/dashboard" replace />}
        />
      </Routes>
    </>
  );
}

export default AppRoutes;
