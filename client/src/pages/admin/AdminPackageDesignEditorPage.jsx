import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import PackageDesignForm from "../../components/admin/package-designs/PackageDesignForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import { fetchAdminServicePackages } from "../../services/adminServicePackagesApi";
import {
  createAdminPackageDesign,
  fetchAdminPackageDesignById,
  updateAdminPackageDesign,
} from "../../services/adminPackageDesignsApi";
import {
  createPackageDesignFormValues,
  defaultPackageDesignFormValues,
} from "../../utils/packageDesignForm";

function AdminPackageDesignEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: packageDesignId } = useParams();
  const { accessToken, logout } = useAdminAuth();
  const isEditMode = mode === "edit";

  const [packageDesign, setPackageDesign] = useState(null);
  const [servicePackages, setServicePackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const currentPath = isEditMode
    ? `/admin/package-designs/${packageDesignId}/edit`
    : "/admin/package-designs/new";

  useEffect(() => {
    if (!accessToken) return undefined;

    const controller = new AbortController();

    async function loadEditorData() {
      try {
        setIsLoading(true);
        setLoadError("");

        const [packagesResponse, designResponse] = await Promise.all([
          fetchAdminServicePackages(accessToken, {}, { signal: controller.signal }),
          isEditMode
            ? fetchAdminPackageDesignById(accessToken, packageDesignId, {
                signal: controller.signal,
              })
            : Promise.resolve(null),
        ]);

        setServicePackages(packagesResponse.servicePackages);
        setPackageDesign(designResponse);
      } catch (error) {
        if (error?.name === "AbortError") return;

        if (error?.status === 401) {
          logout();
          navigate("/admin/login", {
            replace: true,
            state: { from: { pathname: currentPath } },
          });
          return;
        }

        console.error("Package Design editor loading failed:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Package Design editor could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadEditorData();

    return () => controller.abort();
  }, [accessToken, currentPath, isEditMode, logout, navigate, packageDesignId]);

  const initialValues = useMemo(() => {
    if (!isEditMode) return defaultPackageDesignFormValues;

    return createPackageDesignFormValues(packageDesign || {});
  }, [isEditMode, packageDesign]);

  const handleMediaUnauthorized = useCallback(() => {
    logout();
    navigate("/admin/login", {
      replace: true,
      state: { from: { pathname: currentPath } },
    });
  }, [currentPath, logout, navigate]);

  function handleAuthenticationError(error) {
    if (error?.status !== 401) return false;

    handleMediaUnauthorized();
    return true;
  }

  async function handleSubmit(packageDesignPayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminPackageDesign(
          accessToken,
          packageDesignId,
          packageDesignPayload,
        );

        navigate("/admin/package-designs", {
          replace: true,
          state: {
            successMessage:
              response.message || "Package Design updated successfully.",
          },
        });
        return;
      }

      const response = await createAdminPackageDesign(
        accessToken,
        packageDesignPayload,
      );

      navigate("/admin/package-designs", {
        replace: true,
        state: {
          successMessage:
            response.message || "Package Design created successfully.",
        },
      });
    } catch (error) {
      const wasAuthenticationError = handleAuthenticationError(error);

      if (!wasAuthenticationError) throw error;
    }
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
          <p className="mt-5 text-sm font-semibold text-slate-600">
            Loading Package Design editor...
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
            Package Design Error
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Editor could not be opened
          </h1>
          <p className="mt-4 leading-7 text-slate-600">{loadError}</p>
          <Link to="/admin/package-designs" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700">
            Return to Package Designs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/admin/package-designs" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600">
          <span aria-hidden="true">←</span>
          Package Designs Management
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
            {isEditMode ? "Update Design" : "Create Design"}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {isEditMode
              ? `Edit ${packageDesign?.name || "Package Design"}`
              : "Add a Package Design"}
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Manage the design thumbnail, responsive screenshots, live demo,
            default selection, featured state, order and public visibility.
          </p>
        </div>

        <div className="mt-8">
          <PackageDesignForm
            key={isEditMode ? packageDesign?._id : "new-package-design"}
            initialValues={initialValues}
            servicePackages={servicePackages}
            onSubmit={handleSubmit}
            submitLabel={isEditMode ? "Update Package Design" : "Create Package Design"}
            accessToken={accessToken}
            onMediaUnauthorized={handleMediaUnauthorized}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminPackageDesignEditorPage;
