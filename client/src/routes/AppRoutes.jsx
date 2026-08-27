import { useEffect, useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";

import AdminLayout from "../components/admin/layout/AdminLayout";
import PageSeo from "../components/seo/PageSeo";
import HomePage from "../pages/HomePage";
import ContactPage from "../pages/ContactPage";
import NotFoundPage from "../pages/NotFoundPage";
import AdminAuditLogDetailPage from "../pages/admin/AdminAuditLogDetailPage";
import AdminAuditLogsPage from "../pages/admin/AdminAuditLogsPage";
import AdminAppointmentDetailPage from "../pages/admin/AdminAppointmentDetailPage";
import AdminAppointmentsPage from "../pages/admin/AdminAppointmentsPage";
import AdminCertificationAchievementEditorPage from "../pages/admin/AdminCertificationAchievementEditorPage";
import AdminCertificationAchievementsPage from "../pages/admin/AdminCertificationAchievementsPage";
import AdminClientPartnerEditorPage from "../pages/admin/AdminClientPartnerEditorPage";
import AdminClientsPartnersPage from "../pages/admin/AdminClientsPartnersPage";
import AdminCompaniesPage from "../pages/admin/AdminCompaniesPage";
import AdminCompanyEditorPage from "../pages/admin/AdminCompanyEditorPage";
import AdminContactMessagesPage from "../pages/admin/AdminContactMessagesPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminEducationEditorPage from "../pages/admin/AdminEducationEditorPage";
import AdminEducationPage from "../pages/admin/AdminEducationPage";
import AdminExperienceEditorPage from "../pages/admin/AdminExperienceEditorPage";
import AdminExperiencePage from "../pages/admin/AdminExperiencePage";
import AdminFaqEditorPage from "../pages/admin/AdminFaqEditorPage";
import AdminFaqsPage from "../pages/admin/AdminFaqsPage";
import AdminLeadEditorPage from "../pages/admin/AdminLeadEditorPage";
import AdminLeadsPage from "../pages/admin/AdminLeadsPage";
import AdminLoginPage from "../pages/admin/AdminLoginPage";
import AdminMediaPage from "../pages/admin/AdminMediaPage";
import AdminPostEditorPage from "../pages/admin/AdminPostEditorPage";
import AdminPostsPage from "../pages/admin/AdminPostsPage";
import AdminPackageDesignEditorPage from "../pages/admin/AdminPackageDesignEditorPage";
import AdminPackageDesignsPage from "../pages/admin/AdminPackageDesignsPage";
import AdminProjectEditorPage from "../pages/admin/AdminProjectEditorPage";
import AdminProjectsPage from "../pages/admin/AdminProjectsPage";
import AdminServiceEditorPage from "../pages/admin/AdminServiceEditorPage";
import AdminServiceOrderDetailPage from "../pages/admin/AdminServiceOrderDetailPage";
import AdminServiceOrdersPage from "../pages/admin/AdminServiceOrdersPage";
import AdminServicePackageEditorPage from "../pages/admin/AdminServicePackageEditorPage";
import AdminServicePackagesPage from "../pages/admin/AdminServicePackagesPage";
import AdminServicesPage from "../pages/admin/AdminServicesPage";
import AdminSkillEditorPage from "../pages/admin/AdminSkillEditorPage";
import AdminSkillsPage from "../pages/admin/AdminSkillsPage";
import AdminSiteSettingsEditorPage from "../pages/admin/AdminSiteSettingsEditorPage";
import AdminSiteSettingsPage from "../pages/admin/AdminSiteSettingsPage";
import AdminStatisticEditorPage from "../pages/admin/AdminStatisticEditorPage";
import AdminStatisticsPage from "../pages/admin/AdminStatisticsPage";
import AdminSubscribersPage from "../pages/admin/AdminSubscribersPage";
import AdminTestimonialEditorPage from "../pages/admin/AdminTestimonialEditorPage";
import AdminTestimonialsPage from "../pages/admin/AdminTestimonialsPage";
import AdminTeamMemberEditorPage from "../pages/admin/AdminTeamMemberEditorPage";
import AdminTeamMembersPage from "../pages/admin/AdminTeamMembersPage";

import ProtectedAdminRoute from "./ProtectedAdminRoute";
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
  const { pathname, hash } = useLocation();

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
       * Dynamic homepage sections can change layout height after data loads.
       * Keep the requested hash section aligned for a few seconds.
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
  }, [pathname, hash]);

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
          <Route path="/contact" element={<ContactPage />} />

          <Route path="/skills" element={<Navigate to="/#skills" replace />} />
          <Route path="/services" element={<Navigate to="/#services" replace />} />
          <Route path="/projects/*" element={<Navigate to="/#projects" replace />} />
          <Route path="/team" element={<Navigate to="/#team" replace />} />
          <Route
            path="/testimonials"
            element={<Navigate to="/#testimonials" replace />}
          />

          <Route
            path="/education"
            element={<Navigate to="/#education" replace />}
          />
          <Route
            path="/experience"
            element={<Navigate to="/#experience" replace />}
          />
          <Route
            path="/achievements"
            element={<Navigate to="/#achievements" replace />}
          />
          <Route
            path="/case-studies"
            element={<Navigate to="/#case-studies" replace />}
          />
          <Route
            path="/clients-partners"
            element={<Navigate to="/#clients-partners" replace />}
          />
          <Route path="/faq" element={<Navigate to="/#faq" replace />} />
          <Route path="/blog/*" element={<Navigate to="/#posts" replace />} />
          <Route path="/news/*" element={<Navigate to="/#posts" replace />} />
          <Route
            path="/consultation"
            element={<Navigate to="/contact" replace />}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route element={<ProtectedAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

            <Route
              path="/admin/audit-logs"
              element={<AdminAuditLogsPage />}
            />

            <Route
              path="/admin/audit-logs/:id"
              element={<AdminAuditLogDetailPage />}
            />

            <Route
              path="/admin/site-settings"
              element={<AdminSiteSettingsPage />}
            />

            <Route
              path="/admin/site-settings/:pageKey"
              element={<AdminSiteSettingsEditorPage />}
            />

            <Route
              path="/admin/appointments"
              element={<AdminAppointmentsPage />}
            />

            <Route
              path="/admin/appointments/:id"
              element={<AdminAppointmentDetailPage />}
            />

            <Route
              path="/admin/subscribers"
              element={<AdminSubscribersPage />}
            />

            <Route
              path="/admin/contact-messages"
              element={<AdminContactMessagesPage />}
            />

            <Route path="/admin/leads" element={<AdminLeadsPage />} />
            <Route
              path="/admin/leads/new"
              element={<AdminLeadEditorPage mode="create" />}
            />
            <Route
              path="/admin/leads/:id/edit"
              element={<AdminLeadEditorPage mode="edit" />}
            />

            <Route
              path="/admin/achievements"
              element={<AdminCertificationAchievementsPage />}
            />
            <Route
              path="/admin/achievements/new"
              element={
                <AdminCertificationAchievementEditorPage mode="create" />
              }
            />
            <Route
              path="/admin/achievements/:id/edit"
              element={<AdminCertificationAchievementEditorPage mode="edit" />}
            />

            <Route path="/admin/faqs" element={<AdminFaqsPage />} />
            <Route
              path="/admin/faqs/new"
              element={<AdminFaqEditorPage mode="create" />}
            />
            <Route
              path="/admin/faqs/:id/edit"
              element={<AdminFaqEditorPage mode="edit" />}
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

            <Route
              path="/admin/service-packages"
              element={<AdminServicePackagesPage />}
            />
            <Route
              path="/admin/service-packages/new"
              element={<AdminServicePackageEditorPage mode="create" />}
            />
            <Route
              path="/admin/service-packages/:id/edit"
              element={<AdminServicePackageEditorPage mode="edit" />}
            />

            <Route
              path="/admin/service-orders"
              element={<AdminServiceOrdersPage />}
            />
            <Route
              path="/admin/service-orders/:id"
              element={<AdminServiceOrderDetailPage />}
            />

            <Route
              path="/admin/package-designs"
              element={<AdminPackageDesignsPage />}
            />
            <Route
              path="/admin/package-designs/new"
              element={<AdminPackageDesignEditorPage mode="create" />}
            />
            <Route
              path="/admin/package-designs/:id/edit"
              element={<AdminPackageDesignEditorPage mode="edit" />}
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

            <Route path="/admin/education" element={<AdminEducationPage />} />
            <Route
              path="/admin/education/new"
              element={<AdminEducationEditorPage mode="create" />}
            />
            <Route
              path="/admin/education/:id/edit"
              element={<AdminEducationEditorPage mode="edit" />}
            />

            <Route path="/admin/experience" element={<AdminExperiencePage />} />
            <Route
              path="/admin/experience/new"
              element={<AdminExperienceEditorPage mode="create" />}
            />
            <Route
              path="/admin/experience/:id/edit"
              element={<AdminExperienceEditorPage mode="edit" />}
            />

            <Route
              path="/admin/testimonials"
              element={<AdminTestimonialsPage />}
            />
            <Route
              path="/admin/testimonials/new"
              element={<AdminTestimonialEditorPage mode="create" />}
            />
            <Route
              path="/admin/testimonials/:id/edit"
              element={<AdminTestimonialEditorPage mode="edit" />}
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

            <Route path="/admin/posts" element={<AdminPostsPage />} />
            <Route
              path="/admin/posts/new"
              element={<AdminPostEditorPage mode="create" />}
            />
            <Route
              path="/admin/posts/:id/edit"
              element={<AdminPostEditorPage mode="edit" />}
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

            <Route
              path="/admin/clients-partners"
              element={<AdminClientsPartnersPage />}
            />
            <Route
              path="/admin/clients-partners/new"
              element={<AdminClientPartnerEditorPage mode="create" />}
            />
            <Route
              path="/admin/clients-partners/:id/edit"
              element={<AdminClientPartnerEditorPage mode="edit" />}
            />

            <Route path="/admin/media" element={<AdminMediaPage />} />
          </Route>
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
