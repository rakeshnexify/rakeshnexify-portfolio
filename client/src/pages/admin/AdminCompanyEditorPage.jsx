import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router";

import CompanyForm from "../../components/admin/companies/CompanyForm";
import useAdminAuth from "../../hooks/useAdminAuth";

import {
  createAdminCompany,
  fetchAdminCompanyById,
  updateAdminCompany,
} from "../../services/adminCompaniesApi";

import {
  createCompanyFormFromData,
  defaultCompanyFormValues,
} from "../../utils/companyForm";

function AdminCompanyEditorPage({ mode = "create" }) {
  const navigate = useNavigate();

  const { id: companyId } = useParams();

  const { accessToken, logout } = useAdminAuth();

  const isEditMode = mode === "edit";

  const hasMissingCompanyId = isEditMode && !companyId;

  const [company, setCompany] = useState(null);

  const [isLoading, setIsLoading] = useState(
    isEditMode && !hasMissingCompanyId,
  );

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isEditMode || !companyId || !accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadCompany() {
      try {
        const companyData = await fetchAdminCompanyById(
          accessToken,
          companyId,
          {
            signal: controller.signal,
          },
        );

        setCompany(companyData);
        setLoadError("");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        if (error?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,

            state: {
              from: {
                pathname: `/admin/companies/${companyId}/edit`,
              },
            },
          });

          return;
        }

        console.error("Admin company loading failed:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Company could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadCompany();

    return () => {
      controller.abort();
    };
  }, [accessToken, companyId, isEditMode, logout, navigate]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultCompanyFormValues;
    }

    return createCompanyFormFromData(company || {});
  }, [company, isEditMode]);

  const handleMediaUnauthorized = useCallback(() => {
    logout();

    navigate("/admin/login", {
      replace: true,

      state: {
        from: {
          pathname: isEditMode
            ? `/admin/companies/${companyId}/edit`
            : "/admin/companies/new",
        },
      },
    });
  }, [companyId, isEditMode, logout, navigate]);

  function handleAuthenticationError(error) {
    if (error?.status !== 401) {
      return false;
    }

    logout();

    navigate("/admin/login", {
      replace: true,

      state: {
        from: {
          pathname: isEditMode
            ? `/admin/companies/${companyId}/edit`
            : "/admin/companies/new",
        },
      },
    });

    return true;
  }

  async function handleSubmit(companyPayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminCompany(
          accessToken,
          companyId,
          companyPayload,
        );

        navigate("/admin/companies", {
          replace: true,

          state: {
            successMessage: response.message || "Company updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminCompany(accessToken, companyPayload);

      navigate("/admin/companies", {
        replace: true,

        state: {
          successMessage: response.message || "Company created successfully.",
        },
      });
    } catch (error) {
      const wasAuthenticationError = handleAuthenticationError(error);

      if (!wasAuthenticationError) {
        throw error;
      }
    }
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 motion-reduce:animate-none" />

          <p className="mt-5 text-sm font-semibold text-slate-600">
            Loading company details...
          </p>
        </div>
      </main>
    );
  }

  if (isEditMode && (loadError || hasMissingCompanyId)) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Company Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Company could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            {hasMissingCompanyId ? "Company ID is required." : loadError}
          </p>

          <Link
            to="/admin/companies"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Return to companies
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          to="/admin/companies"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <span aria-hidden="true">&larr;</span>
          Companies Management
        </Link>

        <header className="mt-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
            {isEditMode ? "Update Company" : "Create Company"}
          </p>

          <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {isEditMode
              ? `Edit ${company?.name || "company"}`
              : "Add a new company"}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {isEditMode
              ? "Update company information, business areas, services, statistics, contact details, social links, visibility and SEO settings."
              : "Create a complete company profile with business information, services, achievements, contact details and public visibility settings."}
          </p>
        </header>

        <div className="mt-6">
          <CompanyForm
            key={isEditMode ? company?._id : "new-company"}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={isEditMode ? "Update Company" : "Create Company"}
            accessToken={accessToken}
            onMediaUnauthorized={handleMediaUnauthorized}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminCompanyEditorPage;
