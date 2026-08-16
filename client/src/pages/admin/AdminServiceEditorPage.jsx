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
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="max-w-5xl space-y-4"
          >
            <span className="sr-only">
              Loading service details...
            </span>

            <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />

            <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />
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
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="alert"
            className="max-w-2xl rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              Service Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Service could not be
              opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {loadError}
            </p>

            <Link
              to="/admin/services"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              ← Return to Services
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-w-5xl">
          <Link
            to="/admin/services"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden="true">
              ←
            </span>

            Services Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              {isEditMode
                ? "Update Service"
                : "Create Service"}
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode
                ? `Edit ${
                    service?.title ||
                    "Service"
                  }`
                : "Add a New Service"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isEditMode
                ? "Update the service content, publication settings, ordering and SEO information."
                : "Create a complete service that can be managed through the Admin CMS and published on the portfolio."}
            </p>
          </header>

          <div className="mt-6">
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