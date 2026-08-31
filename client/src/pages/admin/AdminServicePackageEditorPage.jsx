import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

import ServicePackageForm from "../../components/admin/service-packages/ServicePackageForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import { fetchAdminServices } from "../../services/adminServicesApi";
import {
  createAdminServicePackage,
  fetchAdminServicePackageById,
  updateAdminServicePackage,
} from "../../services/adminServicePackagesApi";
import {
  createServicePackageFormValues,
  defaultServicePackageFormValues,
} from "../../utils/servicePackageForm";

function AdminServicePackageEditorPage({
  mode = "create",
}) {
  const navigate = useNavigate();

  const {
    id: servicePackageId,
  } = useParams();

  const {
    accessToken,
    logout,
  } = useAdminAuth();

  const isEditMode =
    mode === "edit";

  const [
    servicePackage,
    setServicePackage,
  ] = useState(null);

  const [
    services,
    setServices,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadEditorData() {
      try {
        setIsLoading(true);
        setLoadError("");

        const [
          servicesResponse,
          packageResponse,
        ] = await Promise.all([
          fetchAdminServices(
            accessToken,
            {},
            {
              signal:
                controller.signal,
            },
          ),
          isEditMode
            ? fetchAdminServicePackageById(
                accessToken,
                servicePackageId,
                {
                  signal:
                    controller.signal,
                },
              )
            : Promise.resolve(
                null,
              ),
        ]);

        setServices(
          servicesResponse.services,
        );

        setServicePackage(
          packageResponse,
        );
      } catch (error) {
        if (
          error?.name ===
          "AbortError"
        ) {
          return;
        }

        if (error?.status === 401) {
          logout();

          navigate(
            "/admin/login",
            {
              replace: true,
              state: {
                from: {
                  pathname: isEditMode
                    ? `/admin/service-packages/${servicePackageId}/edit`
                    : "/admin/service-packages/new",
                },
              },
            },
          );

          return;
        }

        console.error(
          "Service Package editor loading failed:",
          error,
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Service Package editor could not be loaded.",
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    loadEditorData();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    isEditMode,
    logout,
    navigate,
    servicePackageId,
  ]);

  const initialValues =
    useMemo(() => {
      if (!isEditMode) {
        return defaultServicePackageFormValues;
      }

      return createServicePackageFormValues(
        servicePackage || {},
      );
    }, [
      isEditMode,
      servicePackage,
    ]);

  async function handleAuthenticationError(
    error,
  ) {
    if (error?.status !== 401) {
      return false;
    }

    logout();

    navigate(
      "/admin/login",
      {
        replace: true,
        state: {
          from: {
            pathname: isEditMode
              ? `/admin/service-packages/${servicePackageId}/edit`
              : "/admin/service-packages/new",
          },
        },
      },
    );

    return true;
  }

  async function handleSubmit(
    servicePackagePayload,
  ) {
    try {
      if (isEditMode) {
        const response =
          await updateAdminServicePackage(
            accessToken,
            servicePackageId,
            servicePackagePayload,
          );

        navigate(
          "/admin/service-packages",
          {
            replace: true,
            state: {
              successMessage:
                response.message ||
                "Service Package updated successfully.",
            },
          },
        );

        return;
      }

      const response =
        await createAdminServicePackage(
          accessToken,
          servicePackagePayload,
        );

      navigate(
        "/admin/service-packages",
        {
          replace: true,
          state: {
            successMessage:
              response.message ||
              "Service Package created successfully.",
          },
        },
      );
    } catch (error) {
      const wasAuthenticationError =
        await handleAuthenticationError(
          error,
        );

      if (
        !wasAuthenticationError
      ) {
        throw error;
      }
    }
  }

  if (isLoading) {
    return (
      <main className="rnx-admin-service-package-editor-v489 min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-6xl space-y-2"
          >
            <span className="sr-only">
              Loading Service Package editor...
            </span>

            <div className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />

            <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="rnx-admin-service-package-editor-v489 min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-slate-900 sm:p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 dark:text-red-300">
              Service Package Error
            </p>

            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Editor could not be opened
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {loadError}
            </p>

            <Link
              to="/admin/service-packages"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              ← Return to Service Packages
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rnx-admin-service-package-editor-v489 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin/service-packages"
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span aria-hidden="true">
              ←
            </span>

            Service Packages Management
          </Link>

          <header className="mt-0.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300 sm:text-[10px]">
              {isEditMode
                ? "Update Package"
                : "Create Package"}
            </p>

            <h1 className="mt-0.5 break-words text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {isEditMode
                ? `Edit ${
                    servicePackage?.name ||
                    "Service Package"
                  }`
                : "Add a Service Package"}
            </h1>

            <p className="mt-0.5 max-w-3xl text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-[11px]">
              Manage package identity, pricing, features and publishing.
            </p>
          </header>

          <div className="mt-2">
            <ServicePackageForm
              key={
                isEditMode
                  ? servicePackage?._id
                  : "new-service-package"
              }
              initialValues={
                initialValues
              }
              services={
                services
              }
              servicesLoading={
                false
              }
              onSubmit={
                handleSubmit
              }
              submitLabel={
                isEditMode
                  ? "Update Service Package"
                  : "Create Service Package"
              }
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminServicePackageEditorPage;