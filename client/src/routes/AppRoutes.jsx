import { Navigate, Route, Routes } from "react-router";

import BrandDetailsPage from "../pages/BrandDetailsPage";
import CompaniesPage from "../pages/CompaniesPage";
import CompanyDetailsPage from "../pages/CompanyDetailsPage";
import HomePage from "../pages/HomePage";
import ProjectDetailsPage from "../pages/ProjectDetailsPage";
import ProjectsPage from "../pages/ProjectsPage";
import ServicesPage from "../pages/ServicesPage";

import AdminBrandEditorPage from "../pages/admin/AdminBrandEditorPage";
import AdminBrandsPage from "../pages/admin/AdminBrandsPage";
import AdminCompaniesPage from "../pages/admin/AdminCompaniesPage";
import AdminCompanyEditorPage from "../pages/admin/AdminCompanyEditorPage";
import AdminContactMessagesPage from "../pages/admin/AdminContactMessagesPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminLoginPage from "../pages/admin/AdminLoginPage";
import AdminProjectEditorPage from "../pages/admin/AdminProjectEditorPage";
import AdminProjectsPage from "../pages/admin/AdminProjectsPage";
import AdminServiceEditorPage from "../pages/admin/AdminServiceEditorPage";
import AdminServicesPage from "../pages/admin/AdminServicesPage";
import AdminSiteSettingsPage from "../pages/admin/AdminSiteSettingsPage";

import ProtectedAdminRoute from "./ProtectedAdminRoute";
import PublicSiteRoute from "./PublicSiteRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicSiteRoute />}>
        <Route path="/" element={<HomePage />} />

        <Route path="/services" element={<ServicesPage />} />

        <Route path="/projects" element={<ProjectsPage />} />

        <Route path="/projects/:slug" element={<ProjectDetailsPage />} />

        <Route path="/companies" element={<CompaniesPage />} />

        <Route path="/companies/:slug" element={<CompanyDetailsPage />} />

        <Route path="/brands/:slug" element={<BrandDetailsPage />} />
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

        <Route path="/admin/brands" element={<AdminBrandsPage />} />

        <Route
          path="/admin/brands/new"
          element={<AdminBrandEditorPage mode="create" />}
        />

        <Route
          path="/admin/brands/:id/edit"
          element={<AdminBrandEditorPage mode="edit" />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
