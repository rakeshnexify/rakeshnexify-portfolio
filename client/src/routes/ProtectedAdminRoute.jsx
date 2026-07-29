import { Navigate, Outlet, useLocation } from "react-router";

import useAdminAuth from "../hooks/useAdminAuth";

function AdminSessionLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="text-center">
        <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

        <p className="mt-5 text-sm font-semibold text-slate-600">
          Verifying admin session...
        </p>
      </div>
    </main>
  );
}

function ProtectedAdminRoute() {
  const location = useLocation();

  const { isAuthenticated, isCheckingSession } = useAdminAuth();

  if (isCheckingSession) {
    return <AdminSessionLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedAdminRoute;
