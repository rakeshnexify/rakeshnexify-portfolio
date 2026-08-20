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
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-5xl space-y-4"
          >
            <span className="sr-only">
              Loading Post editor...
            </span>

            <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />

            <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (loadError || hasMissingPostId) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              Post Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Post editor could not be opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasMissingPostId ? "Post ID is required." : loadError}
            </p>

            <Link
              to="/admin/posts"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              &larr; Return to Posts
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
            to="/admin/posts"
            onClick={preventNavigationDuringSubmit}
            aria-disabled={isSubmitting}
            tabIndex={isSubmitting ? -1 : undefined}
            className={`inline-flex min-h-10 items-center gap-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none ${
              isSubmitting
                ? "pointer-events-none text-slate-400 opacity-60"
                : "text-slate-600 hover:text-brand-700"
            }`}
          >
            <span aria-hidden="true">
              &larr;
            </span>

            Posts Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Blog & News Management
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode ? `Edit ${post?.title || "Post"}` : "Add New Post"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isEditMode
                ? "Update article content, publishing metadata, related Projects, visibility and SEO."
                : "Create a Blog or News article in the shared dynamic Post management system."}
            </p>
          </header>

          <div className="mt-6">
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
