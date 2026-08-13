import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

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

function AdminServicePackageEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: servicePackageId } = useParams();

  const { accessToken, logout } = useAdminAuth();

  const isEditMode = mode === "edit";

  const [servicePackage, setServicePackage] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadEditorData() {
      try {
        setIsLoading(true);
        setLoadError("");

        const [servicesResponse, packageResponse] = await Promise.all([
          fetchAdminServices(
            accessToken,
            {},
            {
              signal: controller.signal,
            },
          ),
          isEditMode
            ? fetchAdminServicePackageById(
                accessToken,
                servicePackageId,
                {
                  signal: controller.signal,
                },
              )
            : Promise.resolve(null),
        ]);

        setServices(servicesResponse.services);
        setServicePackage(packageResponse);
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
                pathname: isEditMode
                  ? `/admin/service-packages/${servicePackageId}/edit`
                  : "/admin/service-packages/new",
              },
            },
          });

          return;
        }

        console.error("Service Package editor loading failed:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Service Package editor could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
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

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultServicePackageFormValues;
    }

    return createServicePackageFormValues(servicePackage || {});
  }, [isEditMode, servicePackage]);

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
            ? `/admin/service-packages/${servicePackageId}/edit`
            : "/admin/service-packages/new",
        },
      },
    });

    return true;
  }

  async function handleSubmit(servicePackagePayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminServicePackage(
          accessToken,
          servicePackageId,
          servicePackagePayload,
        );

        navigate("/admin/service-packages", {
          replace: true,
          state: {
            successMessage:
              response.message || "Service Package updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminServicePackage(
        accessToken,
        servicePackagePayload,
      );

      navigate("/admin/service-packages", {
        replace: true,
        state: {
          successMessage:
            response.message || "Service Package created successfully.",
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
            Loading Service Package editor...
          </p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Service Package Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Editor could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">{loadError}</p>

          <Link
            to="/admin/service-packages"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to Service Packages
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/service-packages"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Service Packages Management
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
            {isEditMode ? "Update Package" : "Create Package"}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {isEditMode
              ? `Edit ${servicePackage?.name || "Service Package"}`
              : "Add a Service Package"}
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Configure package pricing, billing, comparison features, customer
            fit, WhatsApp readiness, display order and publication controls.
          </p>
        </div>

        <div className="mt-8">
          <ServicePackageForm
            key={isEditMode ? servicePackage?._id : "new-service-package"}
            initialValues={initialValues}
            services={services}
            servicesLoading={false}
            onSubmit={handleSubmit}
            submitLabel={
              isEditMode ? "Update Service Package" : "Create Service Package"
            }
          />
        </div>
      </section>
    </main>
  );
}

export default AdminServicePackageEditorPage;
