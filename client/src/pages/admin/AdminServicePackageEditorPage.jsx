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
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="max-w-6xl space-y-4"
          >
            <span className="sr-only">
              Loading Service Package editor...
            </span>

            <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />

            <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="alert"
            className="max-w-2xl rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              Service Package Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Editor could not be opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {loadError}
            </p>

            <Link
              to="/admin/service-packages"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              ← Return to Service Packages
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-w-6xl">
          <Link
            to="/admin/service-packages"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden="true">
              ←
            </span>

            Service Packages Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              {isEditMode
                ? "Update Package"
                : "Create Package"}
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode
                ? `Edit ${
                    servicePackage?.name ||
                    "Service Package"
                  }`
                : "Add a Service Package"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Configure the owning Service, pricing and billing
              model, comparison content, customer fit, WhatsApp
              readiness, publication state and display order.
            </p>
          </header>

          <div className="mt-6">
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