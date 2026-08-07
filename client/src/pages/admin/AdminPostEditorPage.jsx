import { useEffect, useMemo, useRef, useState } from "react";
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
  const { accessToken, admin, logout } = useAdminAuth();

  const isEditMode = mode === "edit";
  const hasMissingPostId = isEditMode && !postId;

  const [post, setPost] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(!hasMissingPostId);
  const [areProjectsLoading, setAreProjectsLoading] = useState(true);
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
      if (hasMissingPostId) {
        setAreProjectsLoading(false);
      }

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
  }, [
    accessToken,
    hasMissingPostId,
    isEditMode,
    logout,
    navigate,
    postId,
  ]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultPostFormValues;
    }

    return createPostFormValues(post || {});
  }, [isEditMode, post]);

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
        ? await updateAdminPost(
            accessToken,
            postId,
            postPayload,
            {
              signal: controller.signal,
            },
          )
        : await createAdminPost(
            accessToken,
            postPayload,
            {
              signal: controller.signal,
            },
          );

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

  function handleLogout() {
    const currentSubmission = activeSubmissionRef.current;

    currentSubmission.controller?.abort();

    activeSubmissionRef.current = {
      controller: null,
      requestId: currentSubmission.requestId + 1,
    };

    logout();

    navigate("/admin/login", {
      replace: true,
    });
  }

  function preventNavigationDuringSubmit(event) {
    if (isSubmitting) {
      event.preventDefault();
    }
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

          <p className="mt-5 text-sm font-semibold text-slate-600">
            Loading Post editor...
          </p>
        </div>
      </main>
    );
  }

  if (loadError || hasMissingPostId) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Post Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Post editor could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            {hasMissingPostId ? "Post ID is required." : loadError}
          </p>

          <Link
            to="/admin/posts"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to Posts
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            onClick={preventNavigationDuringSubmit}
            aria-disabled={isSubmitting}
            tabIndex={isSubmitting ? -1 : undefined}
            className={`flex min-w-0 items-center gap-3 ${
              isSubmitting ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 font-extrabold text-white">
              RN
            </div>

            <div className="min-w-0">
              <p className="truncate font-extrabold text-slate-950">
                RakeshNexify
              </p>

              <p className="truncate text-xs font-medium text-slate-500">
                Blog & News Editor
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-500 md:inline">
              {admin?.name}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isSubmitting}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/posts"
          onClick={preventNavigationDuringSubmit}
          aria-disabled={isSubmitting}
          tabIndex={isSubmitting ? -1 : undefined}
          className={`inline-flex items-center gap-2 text-sm font-semibold transition ${
            isSubmitting
              ? "pointer-events-none text-slate-400 opacity-60"
              : "text-slate-500 hover:text-brand-600"
          }`}
        >
          <span aria-hidden="true">←</span>
          Back to Posts
        </Link>

        <div className="mt-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
            Blog & News Management
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {isEditMode ? `Edit ${post?.title || "Post"}` : "Add New Post"}
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            {isEditMode
              ? "Update article content, publishing metadata, related Projects, visibility and SEO."
              : "Create a Blog or News article in the shared dynamic Post management system."}
          </p>
        </div>

        <div className="mt-8">
          <PostForm
            key={isEditMode ? post?._id : "new-post"}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={isEditMode ? "Update Post" : "Create Post"}
            projectOptions={projectOptions}
            areProjectsLoading={areProjectsLoading}
            onSubmittingChange={setIsSubmitting}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminPostEditorPage;
