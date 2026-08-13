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
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
          <p className="mt-5 text-sm font-semibold text-slate-600">
            Loading FAQ editor...
          </p>
        </div>
      </main>
    );
  }

  if (loadError || hasMissingFaqId) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
            !
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            FAQ editor could not be opened
          </h1>

          <p className="mt-3 text-slate-600">
            {hasMissingFaqId ? "FAQ ID is required." : loadError}
          </p>

          <Link
            to="/admin/faqs"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-bold text-white"
          >
            Return to FAQs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/faqs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600"
        >
          ← Back to FAQs
        </Link>

        <div className="mt-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
            Help & Answers
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            {isEditMode ? "Edit FAQ" : "Add FAQ"}
          </h1>

          <p className="mt-4 max-w-3xl leading-7 text-slate-400">
            Manage the customer-facing question, answer, dynamic category,
            display priority and public publication controls.
          </p>
        </div>

        <div className="mt-8">
          <FaqForm
            key={isEditMode ? faq?._id : "new-faq"}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={isEditMode ? "Update FAQ" : "Create FAQ"}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminFaqEditorPage;
