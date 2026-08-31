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

function AdminPackageDesignEditorPage({
  mode = "create",
}) {
  const navigate = useNavigate();

  const {
    id: packageDesignId,
  } = useParams();

  const {
    accessToken,
    logout,
  } = useAdminAuth();

  const isEditMode =
    mode === "edit";

  const [
    packageDesign,
    setPackageDesign,
  ] = useState(null);

  const [
    servicePackages,
    setServicePackages,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const currentPath =
    isEditMode
      ? `/admin/package-designs/${packageDesignId}/edit`
      : "/admin/package-designs/new";

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
          packagesResponse,
          designResponse,
        ] = await Promise.all([
          fetchAdminServicePackages(
            accessToken,
            {},
            {
              signal:
                controller.signal,
            },
          ),
          isEditMode
            ? fetchAdminPackageDesignById(
                accessToken,
                packageDesignId,
                {
                  signal:
                    controller.signal,
                },
              )
            : Promise.resolve(
                null,
              ),
        ]);

        setServicePackages(
          packagesResponse.servicePackages,
        );

        setPackageDesign(
          designResponse,
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
                  pathname:
                    currentPath,
                },
              },
            },
          );

          return;
        }

        console.error(
          "Package Design editor loading failed:",
          error,
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Package Design editor could not be loaded.",
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
    currentPath,
    isEditMode,
    logout,
    navigate,
    packageDesignId,
  ]);

  const initialValues =
    useMemo(() => {
      if (!isEditMode) {
        return defaultPackageDesignFormValues;
      }

      return createPackageDesignFormValues(
        packageDesign || {},
      );
    }, [
      isEditMode,
      packageDesign,
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
              pathname:
                currentPath,
            },
          },
        },
      );
    }, [
      currentPath,
      logout,
      navigate,
    ]);

  function handleAuthenticationError(
    error,
  ) {
    if (error?.status !== 401) {
      return false;
    }

    handleMediaUnauthorized();

    return true;
  }

  async function handleSubmit(
    packageDesignPayload,
  ) {
    try {
      if (isEditMode) {
        const response =
          await updateAdminPackageDesign(
            accessToken,
            packageDesignId,
            packageDesignPayload,
          );

        navigate(
          "/admin/package-designs",
          {
            replace: true,
            state: {
              successMessage:
                response.message ||
                "Package Design updated successfully.",
            },
          },
        );

        return;
      }

      const response =
        await createAdminPackageDesign(
          accessToken,
          packageDesignPayload,
        );

      navigate(
        "/admin/package-designs",
        {
          replace: true,
          state: {
            successMessage:
              response.message ||
              "Package Design created successfully.",
          },
        },
      );
    } catch (error) {
      const wasAuthenticationError =
        handleAuthenticationError(
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
      <main className="rnx-admin-package-design-editor-v489 min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-6xl space-y-2"
          >
            <span className="sr-only">
              Loading Package Design editor...
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
      <main className="rnx-admin-package-design-editor-v489 min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-slate-900 sm:p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 dark:text-red-300">
              Package Design Error
            </p>

            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Editor could not be
              opened
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {loadError}
            </p>

            <Link
              to="/admin/package-designs"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              ← Return to Package Designs
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rnx-admin-package-design-editor-v489 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin/package-designs"
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span aria-hidden="true">
              ←
            </span>

            Package Designs Management
          </Link>

          <header className="mt-0.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300 sm:text-[10px]">
              {isEditMode
                ? "Update Design"
                : "Create Design"}
            </p>

            <h1 className="mt-0.5 break-words text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {isEditMode
                ? `Edit ${
                    packageDesign?.name ||
                    "Package Design"
                  }`
                : "Add a Package Design"}
            </h1>

            <p className="mt-0.5 max-w-3xl text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-[11px]">
              Manage design identity, media, screenshots, demo and publishing.
            </p>
          </header>

          <div className="mt-2">
            <PackageDesignForm
              key={
                isEditMode
                  ? packageDesign?._id
                  : "new-package-design"
              }
              initialValues={
                initialValues
              }
              servicePackages={
                servicePackages
              }
              onSubmit={
                handleSubmit
              }
              submitLabel={
                isEditMode
                  ? "Update Package Design"
                  : "Create Package Design"
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

export default AdminPackageDesignEditorPage;