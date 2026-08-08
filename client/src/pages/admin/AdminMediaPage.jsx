import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import MediaDetailsPanel from "../../components/admin/media/MediaDetailsPanel";
import MediaPreview from "../../components/admin/media/MediaPreview";
import MediaUploadPanel from "../../components/admin/media/MediaUploadPanel";
import useAdminAuth from "../../hooks/useAdminAuth";
import useAdminMedia from "../../hooks/useAdminMedia";
import { fetchAdminMediaFolders } from "../../services/adminMediaApi";
import {
  formatDimensions,
  formatDuration,
  formatFileSize,
  getMediaTypeLabel,
} from "../../utils/mediaForm";

const initialFilters = {
  search: "",
  mediaType: "",
  folder: "",
  tag: "",
  sort: "newest",
  limit: 24,
};

function AdminMediaPage() {
  const navigate = useNavigate();
  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({
    ...initialFilters,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...initialFilters,
    page: 1,
  });

  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [folders, setFolders] = useState([]);
  const [areFoldersLoading, setAreFoldersLoading] = useState(true);
  const [folderRefreshKey, setFolderRefreshKey] = useState(0);

  const {
    media,
    count,
    total,
    page,
    limit,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    isLoading,
    error,
    errorMessage,
    refreshMedia,
  } = useAdminMedia(accessToken, appliedFilters);

  const canEditMedia = ["super-admin", "admin", "editor"].includes(admin?.role);

  const canDeleteMedia = ["super-admin", "admin"].includes(admin?.role);

  useEffect(() => {
    if (error?.status !== 401) {
      return;
    }

    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: "/admin/media",
        },
      },
    });
  }, [error, logout, navigate]);

  useEffect(() => {
    if (!accessToken) {
      setFolders([]);
      setAreFoldersLoading(false);

      return undefined;
    }

    const controller = new AbortController();

    async function loadFolders() {
      setAreFoldersLoading(true);

      try {
        const response = await fetchAdminMediaFolders(accessToken, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setFolders(response.folders);
      } catch (requestError) {
        if (controller.signal.aborted || requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: "/admin/media",
              },
            },
          });

          return;
        }

        console.error("Admin Media folders loading failed:", requestError);

        setFolders([]);
      } finally {
        if (!controller.signal.aborted) {
          setAreFoldersLoading(false);
        }
      }
    }

    loadFolders();

    return () => {
      controller.abort();
    };
  }, [accessToken, folderRefreshKey, logout, navigate]);

  function handleUnauthorized() {
    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: "/admin/media",
        },
      },
    });
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      [name]: name === "limit" ? Number(value) : value,
    }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();

    setSuccessMessage("");

    setAppliedFilters({
      ...formFilters,
      page: 1,
    });
  }

  function handleClearFilters() {
    setSuccessMessage("");

    setFormFilters({
      ...initialFilters,
    });

    setAppliedFilters({
      ...initialFilters,
      page: 1,
    });
  }

  function handleFolderSelect(folder) {
    setSuccessMessage("");

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      folder,
    }));

    setAppliedFilters((currentFilters) => ({
      ...currentFilters,
      folder,
      page: 1,
    }));
  }

  function handlePageChange(nextPage) {
    if (
      isLoading ||
      nextPage < 1 ||
      (totalPages > 0 && nextPage > totalPages)
    ) {
      return;
    }

    setAppliedFilters((currentFilters) => ({
      ...currentFilters,
      page: nextPage,
    }));
  }

  async function handleUploaded(uploadedMedia, message) {
    setSelectedMediaId(uploadedMedia?._id || "");
    setSuccessMessage(message || "Media uploaded successfully.");

    setFolderRefreshKey((currentKey) => currentKey + 1);

    await refreshMedia();
  }

  async function handleMediaChanged(updatedMedia, message) {
    setSelectedMediaId(updatedMedia?._id || selectedMediaId);
    setSuccessMessage(message || "Media updated successfully.");

    setFolderRefreshKey((currentKey) => currentKey + 1);

    await refreshMedia();
  }

  async function handleMediaDeleted(deletedMedia, message) {
    setSelectedMediaId("");

    setSuccessMessage(
      message || `"${deletedMedia?.title || "Media"}" was permanently deleted.`,
    );

    setFolderRefreshKey((currentKey) => currentKey + 1);

    await refreshMedia();
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/admin/dashboard"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          ← Back to Admin Dashboard
        </Link>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
            Media Management
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Media Library
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Upload and manage reusable images, SVG files, PDFs, audio and video
            assets stored securely through Cloudinary.
          </p>
        </div>

        <div className="mt-8">
          <MediaUploadPanel
            accessToken={accessToken}
            canUpload={canEditMedia}
            onUploaded={handleUploaded}
            onUnauthorized={handleUnauthorized}
          />
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
                Folders
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Browse Media Folders
              </h2>
            </div>

            {areFoldersLoading && (
              <span className="text-xs font-semibold text-slate-500">
                Loading folders...
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleFolderSelect("")}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                !appliedFilters.folder
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-600"
              }`}
            >
              All Media
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  !appliedFilters.folder
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {total}
              </span>
            </button>

            {folders.map((folderRecord) => {
              const isActive = appliedFilters.folder === folderRecord.folder;

              return (
                <button
                  key={folderRecord.folder}
                  type="button"
                  onClick={() => handleFolderSelect(folderRecord.folder)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                    isActive
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-600"
                  }`}
                >
                  <span aria-hidden="true">📁</span>

                  <span className="break-all">{folderRecord.folder}</span>

                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {folderRecord.count}
                  </span>
                </button>
              );
            })}
          </div>

          {!areFoldersLoading && folders.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">
              No custom Media folders have been created yet.
            </p>
          )}
        </section>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label
                htmlFor="media-search"
                className="text-sm font-semibold text-slate-700"
              >
                Search
              </label>

              <input
                id="media-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Title, filename, caption, tags..."
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="media-type-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Media Type
              </label>

              <select
                id="media-type-filter"
                name="mediaType"
                value={formFilters.mediaType}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="">All Media</option>
                <option value="image">Images</option>
                <option value="svg">SVG</option>
                <option value="document">PDF Documents</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="media-folder-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Folder
              </label>

              <input
                id="media-folder-filter"
                name="folder"
                value={formFilters.folder}
                onChange={handleFilterChange}
                placeholder="projects/covers"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="media-tag-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Tag
              </label>

              <input
                id="media-tag-filter"
                name="tag"
                value={formFilters.tag}
                onChange={handleFilterChange}
                placeholder="Exact tag"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="media-sort-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Sort
              </label>

              <select
                id="media-sort-filter"
                name="sort"
                value={formFilters.sort}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title-asc">Title A–Z</option>
                <option value="title-desc">Title Z–A</option>
                <option value="size-desc">Largest first</option>
                <option value="size-asc">Smallest first</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="media-limit-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Per Page
              </label>

              <select
                id="media-limit-filter"
                name="limit"
                value={formFilters.limit}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              disabled={isLoading}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
            >
              Clear Filters
            </button>

            <button
              type="button"
              onClick={refreshMedia}
              disabled={isLoading}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </form>

        {successMessage && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700"
          >
            {successMessage}
          </div>
        )}

        {errorMessage && error?.status !== 401 && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">
                {isLoading
                  ? "Loading Media..."
                  : `${total} asset${total === 1 ? "" : "s"} total · ${count} on this page`}
              </p>

              {totalPages > 0 && (
                <p className="text-sm font-semibold text-slate-500">
                  Page {page} of {totalPages}
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="mt-6 grid min-h-72 place-items-center rounded-3xl border border-slate-200 bg-white">
                <div className="text-center">
                  <div className="mx-auto size-11 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    Loading Media...
                  </p>
                </div>
              </div>
            ) : media.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  M
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-950">
                  No Media found
                </h2>

                <p className="mt-3 text-slate-600">
                  Upload an asset or clear the current filters.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {media.map((item) => {
                  const dimensions = formatDimensions(item.width, item.height);

                  const duration = formatDuration(item.duration);

                  const isSelected = selectedMediaId === item._id;

                  return (
                    <article
                      key={item._id}
                      className={`min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                        isSelected
                          ? "border-brand-500 ring-4 ring-brand-100"
                          : "border-slate-200 hover:border-brand-200"
                      }`}
                    >
                      <MediaPreview media={item} compact />

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-bold text-slate-950">
                              {item.title}
                            </h3>

                            <p className="mt-1 truncate text-xs text-slate-400">
                              {item.originalName}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                            {getMediaTypeLabel(item.mediaType)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                          <span>{formatFileSize(item.size)}</span>

                          {dimensions && <span>· {dimensions}</span>}

                          {duration && <span>· {duration}</span>}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedMediaId(item._id)}
                          className="mt-4 inline-flex min-h-9 w-full items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                        >
                          {isSelected ? "Selected" : "View Details"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <button
                  type="button"
                  disabled={!hasPreviousPage || isLoading}
                  onClick={() => handlePageChange(page - 1)}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                <span className="text-sm font-semibold text-slate-600">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={!hasNextPage || isLoading}
                  onClick={() => handlePageChange(page + 1)}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </section>

          <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
            <MediaDetailsPanel
              accessToken={accessToken}
              mediaId={selectedMediaId}
              canEdit={canEditMedia}
              canDelete={canDeleteMedia}
              onChanged={handleMediaChanged}
              onDeleted={handleMediaDeleted}
              onUnauthorized={handleUnauthorized}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminMediaPage;
