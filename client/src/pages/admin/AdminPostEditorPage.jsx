import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import PostForm from "../../components/admin/posts/PostForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import { fetchAdminProjects } from "../../services/adminProjectsApi";
import {
  createAdminPost,
  fetchAdminPostById,
  updateAdminPost,
} from "../../services/adminPostsApi";
import {
  createPostFormValues,
  defaultPostFormValues,
} from "../../utils/postForm";

function AdminPostEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: postId } = useParams();
  const { accessToken, logout } = useAdminAuth();

  const isEditMode = mode === "edit";
  const hasMissingPostId = isEditMode && !postId;

  const [post, setPost] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(!hasMissingPostId);
  const [areProjectsLoading, setAreProjectsLoading] = useState(!hasMissingPostId);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMountedRef = useRef(true);
  const activeSubmissionRef = useRef({
    controller: null,
    requestId: 0,
  });

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      const currentSubmission = activeSubmissionRef.current;

      currentSubmission.controller?.abort();

      activeSubmissionRef.current = {
        controller: null,
        requestId: currentSubmission.requestId + 1,
      };
    };
  }, []);

  useEffect(() => {
    if (!accessToken || hasMissingPostId) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadEditorData() {
      try {
        setLoadError("");
        setAreProjectsLoading(true);

        if (isEditMode) {
          setIsLoading(true);
        }

        const [postData, projectsResponse] = await Promise.all([
          isEditMode
            ? fetchAdminPostById(accessToken, postId, {
                signal: controller.signal,
              })
            : Promise.resolve(null),
          fetchAdminProjects(
            accessToken,
            {},
            {
              signal: controller.signal,
            },
          ),
        ]);

        setPost(postData);
        setProjectOptions(projectsResponse.projects);
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
                pathname: isEditMode
                  ? `/admin/posts/${postId}/edit`
                  : "/admin/posts/new",
              },
            },
          });

          return;
        }

        console.error("Admin Post editor loading failed:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Post editor data could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setAreProjectsLoading(false);
        }
      }
    }

    loadEditorData();

    return () => {
      controller.abort();
    };
  }, [accessToken, hasMissingPostId, isEditMode, logout, navigate, postId]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultPostFormValues;
    }

    return createPostFormValues(post || {});
  }, [isEditMode, post]);

  const handleMediaUnauthorized = useCallback(() => {
    const currentSubmission = activeSubmissionRef.current;

    currentSubmission.controller?.abort();

    activeSubmissionRef.current = {
      controller: null,
      requestId: currentSubmission.requestId + 1,
    };

    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: isEditMode
            ? `/admin/posts/${postId}/edit`
            : "/admin/posts/new",
        },
      },
    });
  }, [isEditMode, logout, navigate, postId]);

  function handleAuthenticationError(error) {
    if (error?.status !== 401) {
      return false;
    }

    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: isEditMode
            ? `/admin/posts/${postId}/edit`
            : "/admin/posts/new",
        },
      },
    });

    return true;
  }

  async function handleSubmit(postPayload) {
    const previousSubmission = activeSubmissionRef.current;

    previousSubmission.controller?.abort();

    const controller = new AbortController();
    const requestId = previousSubmission.requestId + 1;

    activeSubmissionRef.current = {
      controller,
      requestId,
    };

    try {
      const response = isEditMode
        ? await updateAdminPost(accessToken, postId, postPayload, {
            signal: controller.signal,
          })
        : await createAdminPost(accessToken, postPayload, {
            signal: controller.signal,
          });

      if (
        controller.signal.aborted ||
        !isMountedRef.current ||
        activeSubmissionRef.current.requestId !== requestId
      ) {
        return;
      }

      navigate("/admin/posts", {
        replace: true,
        state: {
          successMessage:
            response.message ||
            (isEditMode
              ? "Post updated successfully."
              : "Post created successfully."),
        },
      });
    } catch (error) {
      if (
        controller.signal.aborted ||
        error?.name === "AbortError" ||
        !isMountedRef.current ||
        activeSubmissionRef.current.requestId !== requestId
      ) {
        return;
      }

      const wasAuthenticationError = handleAuthenticationError(error);

      if (!wasAuthenticationError) {
        throw error;
      }
    } finally {
      if (
        isMountedRef.current &&
        activeSubmissionRef.current.requestId === requestId
      ) {
        activeSubmissionRef.current = {
          controller: null,
          requestId,
        };
      }
    }
  }

  function preventNavigationDuringSubmit(event) {
    if (isSubmitting) {
      event.preventDefault();
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 lg:px-8">
          <div role="status" aria-live="polite" className="mx-auto max-w-6xl space-y-2">
            <span className="sr-only">Loading Post editor...</span>
            <div className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
            <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (loadError || hasMissingPostId) {
    return (
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-slate-900 sm:p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 dark:text-red-300">
              Post Error
            </p>

            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Post editor could not be opened
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {hasMissingPostId ? "Post ID is required." : loadError}
            </p>

            <Link
              to="/admin/posts"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              &larr; Return to Blog & News
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rnx-admin-post-editor-v494 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin/posts"
            onClick={preventNavigationDuringSubmit}
            aria-disabled={isSubmitting}
            tabIndex={isSubmitting ? -1 : undefined}
            className={`inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold transition ${
              isSubmitting
                ? "pointer-events-none text-slate-400 opacity-60"
                : "text-slate-500 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
            }`}
          >
            <span aria-hidden="true">&larr;</span>
            Blog & News
          </Link>

          <header className="mt-0.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300 sm:text-[10px]">
              {isEditMode ? "Edit Post" : "Create Post"}
            </p>

            <h1 className="mt-0.5 break-words text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {isEditMode ? `Edit ${post?.title || "Post"}` : "Add Blog / News Post"}
            </h1>

            <p className="mt-0.5 max-w-3xl text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-[11px]">
              {isEditMode
                ? "Update article content, media, publishing and SEO."
                : "Create Blog or News content in one compact editor."}
            </p>
          </header>

          <div className="mt-2">
            <PostForm
              key={isEditMode ? post?._id : "new-post"}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel={isEditMode ? "Update Post" : "Create Post"}
              projectOptions={projectOptions}
              areProjectsLoading={areProjectsLoading}
              onSubmittingChange={setIsSubmitting}
              accessToken={accessToken}
              onMediaUnauthorized={handleMediaUnauthorized}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminPostEditorPage;
