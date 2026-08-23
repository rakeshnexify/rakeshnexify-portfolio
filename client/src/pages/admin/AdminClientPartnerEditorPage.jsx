import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import ClientPartnerForm from "../../components/admin/clients-partners/ClientPartnerForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  createAdminCompany,
  fetchAdminCompanyById,
  updateAdminCompany,
} from "../../services/adminCompaniesApi";

function isClientPartner(company) {
  return ["client", "partner"].includes(
    String(company?.relationship || "")
      .trim()
      .toLowerCase(),
  );
}

function AdminClientPartnerEditorPage({ mode = "create" }) {
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
        const data = await fetchAdminCompanyById(accessToken, companyId, {
          signal: controller.signal,
        });

        if (!isClientPartner(data)) {
          setLoadError(
            "This Company record is not a Client or Partner. Manage owned/managed companies from Company Menu.",
          );
          return;
        }

        setCompany(data);
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
                pathname: `/admin/clients-partners/${companyId}/edit`,
              },
            },
          });
          return;
        }

        console.error("Client / Partner loading failed:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Client / Partner could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadCompany();

    return () => controller.abort();
  }, [accessToken, companyId, isEditMode, logout, navigate]);

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
            ? `/admin/clients-partners/${companyId}/edit`
            : "/admin/clients-partners/new",
        },
      },
    });

    return true;
  }

  function handleMediaUnauthorized() {
    handleAuthenticationError({ status: 401 });
  }

  async function handleSubmit(payload) {
    try {
      if (isEditMode) {
        const response = await updateAdminCompany(
          accessToken,
          companyId,
          payload,
        );

        navigate("/admin/clients-partners", {
          replace: true,
          state: {
            successMessage:
              response.message || "Client / Partner updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminCompany(accessToken, payload);

      navigate("/admin/clients-partners", {
        replace: true,
        state: {
          successMessage:
            response.message || "Client / Partner created successfully.",
        },
      });
    } catch (error) {
      if (!handleAuthenticationError(error)) {
        throw error;
      }
    }
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 dark:bg-slate-950">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Loading client / partner...
        </p>
      </main>
    );
  }

  if (isEditMode && (loadError || hasMissingCompanyId)) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/60 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
            Clients & Partners Error
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
            Relationship could not be opened
          </h1>
          <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
            {hasMissingCompanyId ? "Company ID is required." : loadError}
          </p>
          <Link
            to="/admin/clients-partners"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white"
          >
            Return to Clients & Partners
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          to="/admin/clients-partners"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:text-slate-300"
        >
          <span aria-hidden="true">&larr;</span>
          Clients & Partners
        </Link>

        <header className="mt-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
            Relationships
          </p>
          <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {isEditMode
              ? `Edit ${company?.name || "client / partner"}`
              : "Add client / partner"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Manage the public relationship card and Home preview priority
            without changing the separate Companies navigation menu.
          </p>
        </header>

        <div className="mt-6">
          <ClientPartnerForm
            key={isEditMode ? company?._id : "new-client-partner"}
            initialValues={company || {}}
            onSubmit={handleSubmit}
            submitLabel={
              isEditMode ? "Save Relationship" : "Add Client / Partner"
            }
            mode={isEditMode ? "edit" : "create"}
            accessToken={accessToken}
            onMediaUnauthorized={handleMediaUnauthorized}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminClientPartnerEditorPage;
