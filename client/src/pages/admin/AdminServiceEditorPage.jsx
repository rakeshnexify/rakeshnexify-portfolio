import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

import ServiceForm from "../../components/admin/services/ServiceForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  createAdminService,
  fetchAdminServiceById,
  updateAdminService,
} from "../../services/adminServicesApi";
import {
  createServiceFormValues,
  defaultServiceFormValues,
} from "../../utils/serviceForm";

function AdminServiceEditorPage({
  mode = "create",
}) {
  const navigate = useNavigate();

  const {
    id: serviceId,
  } = useParams();

  const {
    accessToken,
    logout,
  } = useAdminAuth();

  const isEditMode =
    mode === "edit";

  const [
    service,
    setService,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(isEditMode);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  useEffect(() => {
    if (
      !isEditMode ||
      !serviceId ||
      !accessToken
    ) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadService() {
      try {
        setIsLoading(true);
        setLoadError("");

        const serviceData =
          await fetchAdminServiceById(
            accessToken,
            serviceId,
            {
              signal:
                controller.signal,
            },
          );

        setService(serviceData);
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
                  pathname: `/admin/services/${serviceId}/edit`,
                },
              },
            },
          );

          return;
        }

        console.error(
          "Admin service loading failed:",
          error,
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Service could not be loaded.",
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    loadService();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    isEditMode,
    logout,
    navigate,
    serviceId,
  ]);

  const initialValues =
    useMemo(() => {
      if (!isEditMode) {
        return defaultServiceFormValues;
      }

      return createServiceFormValues(
        service || {},
      );
    }, [
      isEditMode,
      service,
    ]);

  const handleMediaUnauthorized =
    useCallback(() => {
      logout();

      navigate(
        "/admin/login",
        {
          replace: true,
          state: {
            from: {
              pathname: isEditMode
                ? `/admin/services/${serviceId}/edit`
                : "/admin/services/new",
            },
          },
        },
      );
    }, [
      isEditMode,
      logout,
      navigate,
      serviceId,
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
              ? `/admin/services/${serviceId}/edit`
              : "/admin/services/new",
          },
        },
      },
    );

    return true;
  }

  async function handleSubmit(
    servicePayload,
  ) {
    try {
      if (isEditMode) {
        const response =
          await updateAdminService(
            accessToken,
            serviceId,
            servicePayload,
          );

        navigate(
          "/admin/services",
          {
            replace: true,
            state: {
              successMessage:
                response.message ||
                "Service updated successfully.",
            },
          },
        );

        return;
      }

      const response =
        await createAdminService(
          accessToken,
          servicePayload,
        );

      navigate(
        "/admin/services",
        {
          replace: true,
          state: {
            successMessage:
              response.message ||
              "Service created successfully.",
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
      <main className="rnx-admin-service-editor-v489 min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-6xl space-y-2"
          >
            <span className="sr-only">
              Loading service details...
            </span>

            <div className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />

            <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (
    isEditMode &&
    loadError
  ) {
    return (
      <main className="rnx-admin-service-editor-v489 min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-slate-900 sm:p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 dark:text-red-300">
              Service Error
            </p>

            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Service could not be
              opened
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {loadError}
            </p>

            <Link
              to="/admin/services"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              ← Return to Services
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rnx-admin-service-editor-v489 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin/services"
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span aria-hidden="true">
              ←
            </span>

            Services Management
          </Link>

          <header className="mt-0.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300 sm:text-[10px]">
              {isEditMode
                ? "Update Service"
                : "Create Service"}
            </p>

            <h1 className="mt-0.5 break-words text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {isEditMode
                ? `Edit ${
                    service?.title ||
                    "Service"
                  }`
                : "Add a New Service"}
            </h1>

            <p className="mt-0.5 max-w-3xl text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-[11px]">
              {isEditMode
                ? "Update service content, display settings and SEO."
                : "Create service content, display settings and SEO in one compact editor."}
            </p>
          </header>

          <div className="mt-2">
            <ServiceForm
              key={
                isEditMode
                  ? service?._id
                  : "new-service"
              }
              initialValues={
                initialValues
              }
              onSubmit={
                handleSubmit
              }
              submitLabel={
                isEditMode
                  ? "Update Service"
                  : "Create Service"
              }
              accessToken={
                accessToken
              }
              onMediaUnauthorized={
                handleMediaUnauthorized
              }
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminServiceEditorPage;