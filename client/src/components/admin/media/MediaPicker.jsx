import { useEffect, useMemo, useState } from "react";

import useAdminMedia from "../../../hooks/useAdminMedia";
import { fetchAdminMediaFolders } from "../../../services/adminMediaApi";
import { formatFileSize, getMediaTypeLabel } from "../../../utils/mediaForm";
import MediaPreview from "./MediaPreview";

const ALL_MEDIA_TYPES = ["image", "svg", "document", "audio", "video"];

const DEFAULT_PICKER_FILTERS = {
  search: "",
  folder: "",
  mediaType: "",
  mediaTypes: [],
  sort: "newest",
  page: 1,
  limit: 24,
};

function areSameMediaTypes(firstTypes, secondTypes) {
  if (!Array.isArray(firstTypes) || !Array.isArray(secondTypes)) {
    return false;
  }

  if (firstTypes.length !== secondTypes.length) {
    return false;
  }

  return firstTypes.every((type, index) => type === secondTypes[index]);
}

function MediaPicker({
  accessToken,
  allowedTypes = [],
  selectedUrl = "",
  onSelect,
  onUnauthorized,
}) {
  const [formSearch, setFormSearch] = useState("");

  const [filters, setFilters] = useState({
    ...DEFAULT_PICKER_FILTERS,
  });

  const [folders, setFolders] = useState([]);

  const [areFoldersLoading, setAreFoldersLoading] = useState(true);

  const normalizedAllowedTypes = useMemo(() => {
    if (!Array.isArray(allowedTypes)) {
      return [];
    }

    return [
      ...new Set(
        allowedTypes
          .map((type) =>
            String(type || "")
              .trim()
              .toLowerCase(),
          )
          .filter((type) => ALL_MEDIA_TYPES.includes(type)),
      ),
    ];
  }, [allowedTypes]);

  const hasTypeRestriction = normalizedAllowedTypes.length > 0;

  const typeOptions = hasTypeRestriction
    ? normalizedAllowedTypes
    : ALL_MEDIA_TYPES;

  const effectiveFilters = useMemo(() => {
    if (!hasTypeRestriction) {
      if (
        !filters.mediaType &&
        (!Array.isArray(filters.mediaTypes) ||
          filters.mediaTypes.length === 0)
      ) {
        return filters;
      }

      return {
        ...filters,
        mediaType: "",
        mediaTypes: [],
        page: 1,
      };
    }

    if (normalizedAllowedTypes.length === 1) {
      const onlyAllowedType = normalizedAllowedTypes[0];

      if (
        filters.mediaType === onlyAllowedType &&
        (!Array.isArray(filters.mediaTypes) ||
          filters.mediaTypes.length === 0)
      ) {
        return filters;
      }

      return {
        ...filters,
        mediaType: onlyAllowedType,
        mediaTypes: [],
        page: 1,
      };
    }

    if (
      filters.mediaType &&
      normalizedAllowedTypes.includes(filters.mediaType)
    ) {
      if (
        !Array.isArray(filters.mediaTypes) ||
        filters.mediaTypes.length === 0
      ) {
        return filters;
      }

      return {
        ...filters,
        mediaTypes: [],
        page: 1,
      };
    }

    if (
      !filters.mediaType &&
      areSameMediaTypes(
        filters.mediaTypes,
        normalizedAllowedTypes,
      )
    ) {
      return filters;
    }

    return {
      ...filters,
      mediaType: "",
      mediaTypes: normalizedAllowedTypes,
      page: 1,
    };
  }, [filters, hasTypeRestriction, normalizedAllowedTypes]);

  const hasMultipleAllowedTypes =
    hasTypeRestriction && normalizedAllowedTypes.length > 1;

  const selectedTypeOption =
    hasMultipleAllowedTypes && !effectiveFilters.mediaType
      ? "__compatible__"
      : effectiveFilters.mediaType;

  const {
    media,
    total,
    page,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    isLoading,
    error,
    errorMessage,
  } = useAdminMedia(accessToken, effectiveFilters);

  useEffect(() => {
    if (error?.status === 401) {
      onUnauthorized?.();
    }
  }, [error, onUnauthorized]);

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
          onUnauthorized?.();
          return;
        }

        console.error("Media Picker folders failed:", requestError);

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
  }, [accessToken, onUnauthorized]);

  const visibleFolders = accessToken
    ? folders
    : [];

  const isVisibleFoldersLoading =
    Boolean(accessToken) && areFoldersLoading;

  function updateFilters(updater) {
    setFilters(() => updater(effectiveFilters));
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    updateFilters((currentFilters) => ({
      ...currentFilters,
      search: formSearch.trim(),
      page: 1,
    }));
  }

  function handleFolderSelect(folder) {
    updateFilters((currentFilters) => ({
      ...currentFilters,
      folder,
      page: 1,
    }));
  }

  function handleTypeChange(event) {
    const selectedType = event.target.value;

    updateFilters((currentFilters) => {
      if (selectedType === "__compatible__") {
        return {
          ...currentFilters,
          mediaType: "",
          mediaTypes: normalizedAllowedTypes,
          page: 1,
        };
      }

      return {
        ...currentFilters,
        mediaType: selectedType,
        mediaTypes: [],
        page: 1,
      };
    });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || (totalPages > 0 && nextPage > totalPages)) {
      return;
    }

    updateFilters((currentFilters) => ({
      ...currentFilters,
      page: nextPage,
    }));
  }

  return (
    <div>
      <form
        onSubmit={handleSearchSubmit}
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
      >
        <input
          type="search"
          value={formSearch}
          onChange={(event) => setFormSearch(event.target.value)}
          placeholder="Search Media..."
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
        />

        <select
          value={selectedTypeOption}
          onChange={handleTypeChange}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
        >
          {!hasTypeRestriction && <option value="">All Media Types</option>}

          {hasMultipleAllowedTypes && (
            <option value="__compatible__">All Compatible</option>
          )}

          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {getMediaTypeLabel(type)}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Search
        </button>
      </form>

      <div className="mt-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleFolderSelect("")}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              !filters.folder
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-brand-300"
            }`}
          >
            All Folders
          </button>

          {visibleFolders.map((folderRecord) => (
            <button
              key={folderRecord.folder}
              type="button"
              onClick={() => handleFolderSelect(folderRecord.folder)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                filters.folder === folderRecord.folder
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-brand-300"
              }`}
            >
              📁 {folderRecord.folder} ({folderRecord.count})
            </button>
          ))}
        </div>

        {isVisibleFoldersLoading && (
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Loading folders...
          </p>
        )}
      </div>

      {errorMessage && error?.status !== 401 && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-500">
          {isLoading
            ? "Loading..."
            : `${total} Media asset${total === 1 ? "" : "s"}`}
        </p>

        {totalPages > 0 && (
          <p className="text-xs font-semibold text-slate-400">
            Page {page} of {totalPages}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="mt-5 grid min-h-64 place-items-center rounded-2xl border border-slate-200">
          <div className="text-center">
            <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              Loading Media...
            </p>
          </div>
        </div>
      ) : media.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center">
          <p className="font-bold text-slate-800">No compatible Media found</p>

          <p className="mt-2 text-sm text-slate-500">
            Change the search, folder or Media type.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid max-h-[52vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => {
            const isSelected = Boolean(selectedUrl) && selectedUrl === item.url;

            return (
              <article
                key={item._id}
                className={`overflow-hidden rounded-2xl border bg-white ${
                  isSelected
                    ? "border-brand-500 ring-4 ring-brand-100"
                    : "border-slate-200"
                }`}
              >
                <MediaPreview media={item} compact />

                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-950">
                        {item.title}
                      </h3>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {item.originalName}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                      {getMediaTypeLabel(item.mediaType)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {formatFileSize(item.size)}
                  </p>

                  <button
                    type="button"
                    onClick={() => onSelect?.(item)}
                    className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    {isSelected ? "Use Again" : "Use This Media"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <button
            type="button"
            disabled={!hasPreviousPage || isLoading}
            onClick={() => handlePageChange(page - 1)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="text-sm font-semibold text-slate-500">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={!hasNextPage || isLoading}
            onClick={() => handlePageChange(page + 1)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default MediaPicker;
