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

import StatisticForm from "../../components/admin/statistics/StatisticForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  createAdminStatistic,
  fetchAdminStatisticById,
  updateAdminStatistic,
} from "../../services/adminStatisticsApi";
import {
  createStatisticFormValues,
  defaultStatisticFormValues,
} from "../../utils/statisticForm";

function AdminStatisticEditorPage({
  mode = "create",
}) {
  const navigate = useNavigate();

  const {
    id: statisticId,
  } = useParams();

  const {
    accessToken,
    logout,
  } = useAdminAuth();

  const isEditMode =
    mode === "edit";

  const [
    statistic,
    setStatistic,
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
      !statisticId ||
      !accessToken
    ) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadStatistic() {
      try {
        setIsLoading(true);
        setLoadError("");

        const statisticData =
          await fetchAdminStatisticById(
            accessToken,
            statisticId,
            {
              signal:
                controller.signal,
            },
          );

        setStatistic(statisticData);
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
                  pathname: `/admin/statistics/${statisticId}/edit`,
                },
              },
            },
          );

          return;
        }

        console.error(
          "Admin statistic loading failed:",
          error,
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Statistic could not be loaded.",
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    loadStatistic();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    isEditMode,
    logout,
    navigate,
    statisticId,
  ]);

  const initialValues =
    useMemo(() => {
      if (!isEditMode) {
        return defaultStatisticFormValues;
      }

      return createStatisticFormValues(
        statistic || {},
      );
    }, [
      isEditMode,
      statistic,
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
                ? `/admin/statistics/${statisticId}/edit`
                : "/admin/statistics/new",
            },
          },
        },
      );
    }, [
      isEditMode,
      logout,
      navigate,
      statisticId,
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
              ? `/admin/statistics/${statisticId}/edit`
              : "/admin/statistics/new",
          },
        },
      },
    );

    return true;
  }

  async function handleSubmit(
    statisticPayload,
  ) {
    try {
      if (isEditMode) {
        const response =
          await updateAdminStatistic(
            accessToken,
            statisticId,
            statisticPayload,
          );

        navigate(
          "/admin/statistics",
          {
            replace: true,
            state: {
              successMessage:
                response.message ||
                "Statistic updated successfully.",
            },
          },
        );

        return;
      }

      const response =
        await createAdminStatistic(
          accessToken,
          statisticPayload,
        );

      navigate(
        "/admin/statistics",
        {
          replace: true,
          state: {
            successMessage:
              response.message ||
              "Statistic created successfully.",
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
              Loading statistic details...
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
              Statistic Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Statistic could not be opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {loadError}
            </p>

            <Link
              to="/admin/statistics"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              â† Return to Statistics
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
            to="/admin/statistics"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden="true">&larr;</span>

            Statistics Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              {isEditMode
                ? "Update Statistic"
                : "Create Statistic"}
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode
                ? `Edit ${
                    statistic?.label ||
                    "Statistic"
                  }`
                : "Add a New Statistic"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isEditMode
                ? "Update the statistic value, label, icon, display order and publication controls."
                : "Create a reusable portfolio statistic that can be managed through the Admin CMS."}
            </p>
          </header>

          <div className="mt-6">
            <StatisticForm
              key={
                isEditMode
                  ? statistic?._id
                  : "new-statistic"
              }
              initialValues={
                initialValues
              }
              onSubmit={
                handleSubmit
              }
              submitLabel={
                isEditMode
                  ? "Update Statistic"
                  : "Create Statistic"
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

export default AdminStatisticEditorPage;
