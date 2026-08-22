import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import CompanyForm from "../../components/admin/companies/CompanyForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  createAdminCompany,
  fetchAdminCompanyById,
  updateAdminCompany,
} from "../../services/adminCompaniesApi";

function AdminCompanyEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: companyId } = useParams();
  const { accessToken, logout } = useAdminAuth();
  const isEditMode = mode === "edit";
  const hasMissingCompanyId = isEditMode && !companyId;
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditMode && !hasMissingCompanyId);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isEditMode || !companyId || !accessToken) return undefined;
    const controller = new AbortController();

    async function loadCompany() {
      try {
        const data = await fetchAdminCompanyById(accessToken, companyId, { signal: controller.signal });
        setCompany(data);
        setLoadError("");
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (error?.status === 401) {
          logout();
          navigate("/admin/login", { replace: true, state: { from: { pathname: `/admin/companies/${companyId}/edit` } } });
          return;
        }
        console.error("Company submenu item loading failed:", error);
        setLoadError(error instanceof Error ? error.message : "Company submenu item could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadCompany();
    return () => controller.abort();
  }, [accessToken, companyId, isEditMode, logout, navigate]);

  function handleAuthenticationError(error) {
    if (error?.status !== 401) return false;
    logout();
    navigate("/admin/login", {
      replace: true,
      state: { from: { pathname: isEditMode ? `/admin/companies/${companyId}/edit` : "/admin/companies/new" } },
    });
    return true;
  }

  async function handleSubmit(payload) {
    try {
      if (isEditMode) {
        const response = await updateAdminCompany(accessToken, companyId, payload);
        navigate("/admin/companies", { replace: true, state: { successMessage: response.message || "Company submenu item updated successfully." } });
        return;
      }
      const response = await createAdminCompany(accessToken, payload);
      navigate("/admin/companies", { replace: true, state: { successMessage: response.message || "Company submenu item created successfully." } });
    } catch (error) {
      if (!handleAuthenticationError(error)) throw error;
    }
  }

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 px-4 dark:bg-slate-950"><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading company submenu item...</p></main>;
  }

  if (isEditMode && (loadError || hasMissingCompanyId)) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/60 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Company Menu Error</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">Submenu item could not be opened</h1>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{hasMissingCompanyId ? "Company ID is required." : loadError}</p>
          <Link to="/admin/companies" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white">Return to Company Menu</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link to="/admin/companies" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:text-slate-300"><span aria-hidden="true">&larr;</span>Company Submenu</Link>
        <header className="mt-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Navigation</p>
          <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{isEditMode ? `Edit ${company?.name || "submenu company"}` : "Add submenu company"}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Set only the company name, external website, display order and whether the link appears inside the public Companies menu.</p>
        </header>
        <div className="mt-6">
          <CompanyForm key={isEditMode ? company?._id : "new-company-menu-link"} initialValues={company || {}} onSubmit={handleSubmit} submitLabel={isEditMode ? "Save Menu Link" : "Add Menu Link"} mode={isEditMode ? "edit" : "create"} />
        </div>
      </section>
    </main>
  );
}

export default AdminCompanyEditorPage;
