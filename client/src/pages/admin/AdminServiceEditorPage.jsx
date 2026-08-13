import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

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

function AdminServiceEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: serviceId } = useParams();

  const { accessToken, logout } = useAdminAuth();

  const isEditMode = mode === "edit";

  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isEditMode || !serviceId || !accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadService() {
      try {
        setIsLoading(true);
        setLoadError("");

        const serviceData = await fetchAdminServiceById(
          accessToken,
          serviceId,
          {
            signal: controller.signal,
          },
        );

        setService(serviceData);
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
                pathname: `/admin/services/${serviceId}/edit`,
              },
            },
          });

          return;
        }

        console.error("Admin service loading failed:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Service could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadService();

    return () => {
      controller.abort();
    };
  }, [accessToken, isEditMode, logout, navigate, serviceId]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultServiceFormValues;
    }

    return createServiceFormValues(service || {});
  }, [isEditMode, service]);

  const handleMediaUnauthorized = useCallback(() => {
    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: isEditMode
            ? `/admin/services/${serviceId}/edit`
            : "/admin/services/new",
        },
      },
    });
  }, [isEditMode, logout, navigate, serviceId]);

  async function handleAuthenticationError(error) {
    if (error?.status !== 401) {
      return false;
    }

    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: isEditMode
            ? `/admin/services/${serviceId}/edit`
            : "/admin/services/new",
        },
      },
    });

    return true;
  }

  async function handleSubmit(servicePayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminService(
          accessToken,
          serviceId,
          servicePayload,
        );

        navigate("/admin/services", {
          replace: true,
          state: {
            successMessage: response.message || "Service updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminService(accessToken, servicePayload);

      navigate("/admin/services", {
        replace: true,
        state: {
          successMessage: response.message || "Service created successfully.",
        },
      });
    } catch (error) {
      const wasAuthenticationError = await handleAuthenticationError(error);

      if (!wasAuthenticationError) {
        throw error;
      }
    }
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

          <p className="mt-5 text-sm font-semibold text-slate-600">
            Loading service details...
          </p>
        </div>
      </main>
    );
  }

  if (isEditMode && loadError) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Service Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Service could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">{loadError}</p>

          <Link
            to="/admin/services"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to services
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/services"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Services Management
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
            {isEditMode ? "Update Service" : "Create Service"}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {isEditMode
              ? `Edit ${service?.title || "service"}`
              : "Add a new service"}
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            {isEditMode
              ? "Update the service content, visibility, featured status, order and SEO information."
              : "Create a complete service that can be displayed dynamically on the public portfolio."}
          </p>
        </div>

        <div className="mt-8">
          <ServiceForm
            key={isEditMode ? service?._id : "new-service"}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={isEditMode ? "Update Service" : "Create Service"}
            accessToken={accessToken}
            onMediaUnauthorized={handleMediaUnauthorized}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminServiceEditorPage;
