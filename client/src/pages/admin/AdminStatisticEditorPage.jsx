import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

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

function AdminStatisticEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: statisticId } = useParams();

  const { accessToken, logout } = useAdminAuth();

  const isEditMode = mode === "edit";

  const [statistic, setStatistic] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isEditMode || !statisticId || !accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadStatistic() {
      try {
        setIsLoading(true);
        setLoadError("");

        const statisticData = await fetchAdminStatisticById(
          accessToken,
          statisticId,
          {
            signal: controller.signal,
          },
        );

        setStatistic(statisticData);
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
                pathname: `/admin/statistics/${statisticId}/edit`,
              },
            },
          });

          return;
        }

        console.error("Admin statistic loading failed:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Statistic could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadStatistic();

    return () => {
      controller.abort();
    };
  }, [accessToken, isEditMode, logout, navigate, statisticId]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultStatisticFormValues;
    }

    return createStatisticFormValues(statistic || {});
  }, [isEditMode, statistic]);

  const handleMediaUnauthorized = useCallback(() => {
    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: isEditMode
            ? `/admin/statistics/${statisticId}/edit`
            : "/admin/statistics/new",
        },
      },
    });
  }, [isEditMode, logout, navigate, statisticId]);

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
            ? `/admin/statistics/${statisticId}/edit`
            : "/admin/statistics/new",
        },
      },
    });

    return true;
  }

  async function handleSubmit(statisticPayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminStatistic(
          accessToken,
          statisticId,
          statisticPayload,
        );

        navigate("/admin/statistics", {
          replace: true,
          state: {
            successMessage:
              response.message || "Statistic updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminStatistic(
        accessToken,
        statisticPayload,
      );

      navigate("/admin/statistics", {
        replace: true,
        state: {
          successMessage: response.message || "Statistic created successfully.",
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
            Loading statistic details...
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
            Statistic Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Statistic could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">{loadError}</p>

          <Link
            to="/admin/statistics"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to statistics
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/statistics"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Statistics Management
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
            {isEditMode ? "Update Statistic" : "Create Statistic"}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {isEditMode
              ? `Edit ${statistic?.label || "statistic"}`
              : "Add a new statistic"}
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            {isEditMode
              ? "Update the statistic value, label, icon, display order and visibility."
              : "Create a dynamic portfolio statistic such as projects completed, years of experience or technologies used."}
          </p>
        </div>

        <div className="mt-8">
          <StatisticForm
            key={isEditMode ? statistic?._id : "new-statistic"}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={isEditMode ? "Update Statistic" : "Create Statistic"}
            accessToken={accessToken}
            onMediaUnauthorized={handleMediaUnauthorized}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminStatisticEditorPage;
