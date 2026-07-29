import { Navigate, Route, Routes } from "react-router";

import HomePage from "../pages/HomePage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminLoginPage from "../pages/admin/AdminLoginPage";
import AdminServicesPage from "../pages/admin/AdminServicesPage";
import AdminServiceEditorPage from "../pages/admin/AdminServiceEditorPage";
import ProjectDetailsPage from "../pages/ProjectDetailsPage";
import ProtectedAdminRoute from "./ProtectedAdminRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/projects/:slug" element={<ProjectDetailsPage />} />

      <Route
        path="/admin"
        element={<Navigate to="/admin/dashboard" replace />}
      />

      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/services" element={<AdminServicesPage />} />
        <Route
          path="/admin/services/new"
          element={<AdminServiceEditorPage mode="create" />}
        />

        <Route
          path="/admin/services/:id/edit"
          element={<AdminServiceEditorPage mode="edit" />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
