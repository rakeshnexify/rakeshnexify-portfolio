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
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 lg:px-8">
          <div role="status" aria-live="polite" className="mx-auto max-w-6xl space-y-2">
            <span className="sr-only">Loading statistic details...</span>
            <div className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
            <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (isEditMode && loadError) {
    return (
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-slate-900 sm:p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 dark:text-red-300">
              Statistic Error
            </p>

            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Statistic could not be opened
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {loadError}
            </p>

            <Link
              to="/admin/statistics"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <span aria-hidden="true">&larr;</span>
              <span className="ml-1.5">Return to Statistics</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rnx-admin-statistic-editor-v486 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin/statistics"
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span aria-hidden="true">&larr;</span>
            Statistics
          </Link>

          <header className="mt-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-600 dark:text-brand-300">
              {isEditMode ? "Edit Statistic" : "New Statistic"}
            </p>

            <h1 className="mt-0.5 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[22px]">
              {isEditMode
                ? `Edit ${statistic?.label || "Statistic"}`
                : "Add Statistic"}
            </h1>

            <p className="mt-0.5 max-w-3xl text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">
              {isEditMode
                ? "Update metric value, display settings and public state."
                : "Create a reusable portfolio metric managed through the Admin CMS."}
            </p>
          </header>

          <div className="mt-2">
            <StatisticForm
              key={isEditMode ? statistic?._id : "new-statistic"}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel={isEditMode ? "Update Statistic" : "Create Statistic"}
              accessToken={accessToken}
              onMediaUnauthorized={handleMediaUnauthorized}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminStatisticEditorPage;
