import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import FaqForm from "../../components/admin/faqs/FaqForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  createAdminFaq,
  fetchAdminFaqById,
  updateAdminFaq,
} from "../../services/adminFaqsApi";
import {
  createFaqFormValues,
  defaultFaqFormValues,
} from "../../utils/faqForm";

function AdminFaqEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: faqId } = useParams();
  const { accessToken, logout } = useAdminAuth();

  const isEditMode = mode === "edit";
  const hasMissingFaqId = isEditMode && !faqId;

  const [faq, setFaq] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState("");

  const editorPath = isEditMode
    ? `/admin/faqs/${faqId}/edit`
    : "/admin/faqs/new";

  useEffect(() => {
    if (!accessToken || !isEditMode || hasMissingFaqId) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadFaq() {
      try {
        setIsLoading(true);
        setLoadError("");

        const record = await fetchAdminFaqById(
          accessToken,
          faqId,
          { signal: controller.signal },
        );

        if (!controller.signal.aborted) {
          setFaq(record);
        }
      } catch (error) {
        if (controller.signal.aborted || error?.name === "AbortError") {
          return;
        }

        if (error?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: editorPath,
              },
            },
          });

          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "FAQ editor could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadFaq();

    return () => controller.abort();
  }, [
    accessToken,
    editorPath,
    faqId,
    hasMissingFaqId,
    isEditMode,
    logout,
    navigate,
  ]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return { ...defaultFaqFormValues };
    }

    return createFaqFormValues(faq || {});
  }, [faq, isEditMode]);

  async function handleSubmit(payload) {
    try {
      if (isEditMode) {
        const response = await updateAdminFaq(
          accessToken,
          faqId,
          payload,
        );

        navigate("/admin/faqs", {
          replace: true,
          state: {
            successMessage:
              response.message || "FAQ updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminFaq(accessToken, payload);

      navigate("/admin/faqs", {
        replace: true,
        state: {
          successMessage:
            response.message || "FAQ created successfully.",
        },
      });
    } catch (error) {
      if (error?.status === 401) {
        logout();
        navigate("/admin/login", { replace: true });
        return;
      }

      throw error;
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-5xl space-y-4"
          >
            <span className="sr-only">
              Loading FAQ editor...
            </span>

            <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />

            <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (loadError || hasMissingFaqId) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              FAQ Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              FAQ editor could not be opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasMissingFaqId ? "FAQ ID is required." : loadError}
            </p>

            <Link
              to="/admin/faqs"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              &larr; Return to FAQs
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/admin/faqs"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden="true">
              &larr;
            </span>

            FAQs Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Help & Answers
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode ? "Edit FAQ" : "Add FAQ"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage the customer-facing question, answer, dynamic category,
              display priority and public publication controls.
            </p>
          </header>

          <div className="mt-6">
            <FaqForm
              key={isEditMode ? faq?._id : "new-faq"}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel={isEditMode ? "Update FAQ" : "Create FAQ"}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminFaqEditorPage;
