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
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="max-w-6xl space-y-4"
          >
            <span className="sr-only">
              Loading Package Design editor...
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
              Package Design Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Editor could not be
              opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {loadError}
            </p>

            <Link
              to="/admin/package-designs"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              ← Return to Package Designs
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
            to="/admin/package-designs"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden="true">
              ←
            </span>

            Package Designs Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              {isEditMode
                ? "Update Design"
                : "Create Design"}
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode
                ? `Edit ${
                    packageDesign?.name ||
                    "Package Design"
                  }`
                : "Add a Package Design"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage package ownership, thumbnail and responsive
              screenshots, live demo details, default selection,
              featured state, publication visibility and display order.
            </p>
          </header>

          <div className="mt-6">
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