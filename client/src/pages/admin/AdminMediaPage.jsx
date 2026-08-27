import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

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
  const [areFoldersLoading, setAreFoldersLoading] = useState(Boolean(accessToken));
  const [folderRefreshKey, setFolderRefreshKey] = useState(0);

  const {
    media,
    count,
    total,
    page,
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
    <main className="admin-media-page min-h-screen">
      <section className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="admin-media-eyebrow text-[10px] font-bold uppercase tracking-[0.16em]">
              Media
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Media Library
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5">
              Upload, find and manage reusable website assets.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="admin-media-count-pill rounded-lg px-3 py-2 font-semibold">
              {isLoading ? "Loading..." : `${total} asset${total === 1 ? "" : "s"}`}
            </span>

            {totalPages > 0 ? (
              <span className="admin-media-count-pill rounded-lg px-3 py-2 font-semibold">
                Page {page}/{totalPages}
              </span>
            ) : null}
          </div>
        </header>

        <div className="mt-4">
          <MediaUploadPanel
            accessToken={accessToken}
            canUpload={canEditMedia}
            onUnauthorized={handleUnauthorized}
            onUploaded={handleUploaded}
          />
        </div>

        {successMessage ? (
          <div
            className="admin-media-success mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
            role="status"
          >
            {successMessage}
          </div>
        ) : null}

        {errorMessage && error?.status !== 401 ? (
          <div
            className="admin-media-error mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}

        <section className="admin-media-toolbar mt-4 rounded-xl p-3">
          <form
            className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.3fr)_150px_150px_140px_110px_auto]"
            onSubmit={handleFilterSubmit}
          >
            <label className="sr-only" htmlFor="media-search-filter">
              Search Media
            </label>

            <input
              className="admin-media-input min-h-10 rounded-lg px-3 text-sm outline-none"
              id="media-search-filter"
              name="search"
              onChange={handleFilterChange}
              placeholder="Search title, file, alt text..."
              type="search"
              value={formFilters.search}
            />

            <label className="sr-only" htmlFor="media-type-filter">
              Media Type
            </label>

            <select
              className="admin-media-input min-h-10 rounded-lg px-3 text-xs font-semibold outline-none"
              id="media-type-filter"
              name="mediaType"
              onChange={handleFilterChange}
              value={formFilters.mediaType}
            >
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="svg">SVG</option>
              <option value="pdf">PDF</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>

            <label className="sr-only" htmlFor="media-sort-filter">
              Sort
            </label>

            <select
              className="admin-media-input min-h-10 rounded-lg px-3 text-xs font-semibold outline-none"
              id="media-sort-filter"
              name="sort"
              onChange={handleFilterChange}
              value={formFilters.sort}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
              <option value="largest">Largest</option>
              <option value="smallest">Smallest</option>
            </select>

            <label className="sr-only" htmlFor="media-tag-filter">
              Tag
            </label>

            <input
              className="admin-media-input min-h-10 rounded-lg px-3 text-xs outline-none"
              id="media-tag-filter"
              name="tag"
              onChange={handleFilterChange}
              placeholder="Tag"
              value={formFilters.tag}
            />

            <label className="sr-only" htmlFor="media-limit-filter">
              Per Page
            </label>

            <select
              className="admin-media-input min-h-10 rounded-lg px-3 text-xs font-semibold outline-none"
              id="media-limit-filter"
              name="limit"
              onChange={handleFilterChange}
              value={formFilters.limit}
            >
              <option value={12}>12 / page</option>
              <option value={24}>24 / page</option>
              <option value={48}>48 / page</option>
              <option value={96}>96 / page</option>
            </select>

            <div className="flex gap-2">
              <button
                className="admin-media-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
                disabled={isLoading}
                type="submit"
              >
                Apply
              </button>

              <button
                aria-label="Clear Media filters"
                className="admin-media-secondary-button inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold"
                disabled={isLoading}
                onClick={handleClearFilters}
                title="Clear filters"
                type="button"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="admin-media-folder-row mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              className={`admin-media-folder-chip inline-flex min-h-8 shrink-0 items-center gap-2 rounded-lg px-3 text-[11px] font-semibold ${
                !appliedFilters.folder ? "is-active" : ""
              }`}
              onClick={() => handleFolderSelect("")}
              type="button"
            >
              All
              <span>{total}</span>
            </button>

            {folders.map((folderRecord) => {
              const isActive = appliedFilters.folder === folderRecord.folder;

              return (
                <button
                  className={`admin-media-folder-chip inline-flex min-h-8 max-w-56 shrink-0 items-center gap-2 rounded-lg px-3 text-[11px] font-semibold ${
                    isActive ? "is-active" : ""
                  }`}
                  key={folderRecord.folder}
                  onClick={() => handleFolderSelect(folderRecord.folder)}
                  type="button"
                >
                  <span className="truncate">{folderRecord.folder}</span>
                  <span>{folderRecord.count}</span>
                </button>
              );
            })}

            {areFoldersLoading ? (
              <span className="shrink-0 px-2 text-[10px]">
                Loading folders...
              </span>
            ) : null}

            <button
              className="admin-media-secondary-button ml-auto inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg px-3 text-[11px] font-semibold"
              disabled={isLoading}
              onClick={refreshMedia}
              type="button"
            >
              Refresh
            </button>
          </div>
        </section>

        <div
          className={`mt-4 grid min-w-0 gap-4 ${
            selectedMediaId
              ? "lg:grid-cols-[minmax(0,1fr)_360px]"
              : "grid-cols-1"
          }`}
        >
          <section className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold">
                {isLoading
                  ? "Loading Media..."
                  : `${count} shown · ${total} total`}
              </p>

              {selectedMediaId ? (
                <button
                  className="admin-media-secondary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[11px] font-semibold"
                  onClick={() => setSelectedMediaId("")}
                  type="button"
                >
                  Close Details
                </button>
              ) : null}
            </div>

            {isLoading ? (
              <div
                className="admin-media-empty mt-3 grid min-h-56 place-items-center rounded-xl"
                role="status"
              >
                <p className="text-xs font-semibold">Loading Media...</p>
              </div>
            ) : media.length === 0 ? (
              <div className="admin-media-empty mt-3 rounded-xl px-5 py-10 text-center">
                <h2 className="text-base font-bold">No Media found</h2>
                <p className="mt-1 text-xs">
                  Upload an asset or clear the current filters.
                </p>
              </div>
            ) : (
              <div
                className={`mt-3 grid gap-3 ${
                  selectedMediaId
                    ? "sm:grid-cols-2 2xl:grid-cols-3"
                    : "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                }`}
              >
                {media.map((item) => {
                  const dimensions = formatDimensions(item.width, item.height);
                  const duration = formatDuration(item.duration);
                  const isSelected = selectedMediaId === item._id;

                  return (
                    <article
                      className={`admin-media-card min-w-0 overflow-hidden rounded-xl ${
                        isSelected ? "is-selected" : ""
                      }`}
                      key={item._id}
                    >
                      <div className="admin-media-card-preview">
                        <MediaPreview compact media={item} />
                      </div>

                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-xs font-bold">
                              {item.title}
                            </h3>

                            <p className="mt-0.5 truncate text-[10px]">
                              {item.originalName}
                            </p>
                          </div>

                          <span className="admin-media-type shrink-0 rounded-md px-2 py-1 text-[9px] font-bold">
                            {getMediaTypeLabel(item.mediaType)}
                          </span>
                        </div>

                        <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
                          <p className="min-w-0 truncate text-[10px] font-medium">
                            {formatFileSize(item.size)}
                            {dimensions ? ` · ${dimensions}` : ""}
                            {duration ? ` · ${duration}` : ""}
                          </p>

                          <button
                            aria-pressed={isSelected}
                            className="admin-media-card-action inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg px-3 text-[10px] font-bold"
                            onClick={() => setSelectedMediaId(item._id)}
                            type="button"
                          >
                            {isSelected ? "Selected" : "Details"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {totalPages > 1 ? (
              <nav
                aria-label="Media pagination"
                className="admin-media-pagination mt-4 flex items-center justify-between gap-3 rounded-xl p-2.5"
              >
                <button
                  className="admin-media-secondary-button inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold"
                  disabled={!hasPreviousPage || isLoading}
                  onClick={() => handlePageChange(page - 1)}
                  type="button"
                >
                  Previous
                </button>

                <span className="text-[11px] font-semibold">
                  {page} / {totalPages}
                </span>

                <button
                  className="admin-media-secondary-button inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold"
                  disabled={!hasNextPage || isLoading}
                  onClick={() => handlePageChange(page + 1)}
                  type="button"
                >
                  Next
                </button>
              </nav>
            ) : null}
          </section>

          {selectedMediaId ? (
            <div className="admin-media-details-shell min-w-0 lg:sticky lg:top-[78px] lg:self-start">
              <MediaDetailsPanel
                accessToken={accessToken}
                canDelete={canDeleteMedia}
                canEdit={canEditMedia}
                mediaId={selectedMediaId}
                onChanged={handleMediaChanged}
                onDeleted={handleMediaDeleted}
                onUnauthorized={handleUnauthorized}
              />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default AdminMediaPage;