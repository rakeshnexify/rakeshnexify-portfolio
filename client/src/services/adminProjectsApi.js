const configuredApiUrl =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = configuredApiUrl.replace(/\/+$/, "");

function createAdminProjectsApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin projects request failed with status ${response.status}.`,
  );

  error.status = response.status;
  error.fieldErrors = responseData?.fieldErrors || {};

  return error;
}

async function readAdminProjectsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminProjectsApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin Projects API returned an invalid response.");
  }

  return responseData;
}

function createAuthorizationHeaders(accessToken) {
  if (!accessToken) {
    throw new Error("Admin access token is required.");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

function buildAdminProjectsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  const category = String(filters.category || "").trim();

  const projectType = String(filters.projectType || "").trim();

  const status = String(filters.status || "").trim();

  if (search) {
    query.set("search", search);
  }

  if (category) {
    query.set("category", category);
  }

  if (projectType) {
    query.set("projectType", projectType);
  }

  if (status) {
    query.set("status", status);
  }

  if (typeof filters.isVisible === "boolean") {
    query.set("isVisible", String(filters.isVisible));
  }

  if (typeof filters.isFeatured === "boolean") {
    query.set("isFeatured", String(filters.isFeatured));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

async function fetchAdminProjects(accessToken, filters = {}, { signal } = {}) {
  const response = await fetch(
    `${API_URL}/api/admin/projects${buildAdminProjectsQuery(filters)}`,
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData = await readAdminProjectsResponse(response);

  return {
    count: responseData.count ?? responseData.data?.length ?? 0,

    projects: Array.isArray(responseData.data) ? responseData.data : [],
  };
}

async function fetchAdminProjectById(accessToken, projectId, { signal } = {}) {
  if (!projectId) {
    throw new Error("Project ID is required.");
  }

  const response = await fetch(`${API_URL}/api/admin/projects/${projectId}`, {
    method: "GET",
    headers: createAuthorizationHeaders(accessToken),
    signal,
  });

  const responseData = await readAdminProjectsResponse(response);

  return responseData.data;
}

async function createAdminProject(accessToken, projectData) {
  const response = await fetch(`${API_URL}/api/admin/projects`, {
    method: "POST",
    headers: {
      ...createAuthorizationHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  });

  const responseData = await readAdminProjectsResponse(response);

  return {
    message: responseData.message,
    project: responseData.data,
  };
}

async function updateAdminProject(accessToken, projectId, projectData) {
  if (!projectId) {
    throw new Error("Project ID is required.");
  }

  const response = await fetch(`${API_URL}/api/admin/projects/${projectId}`, {
    method: "PATCH",
    headers: {
      ...createAuthorizationHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  });

  const responseData = await readAdminProjectsResponse(response);

  return {
    message: responseData.message,
    project: responseData.data,
  };
}

async function deleteAdminProject(accessToken, projectId) {
  if (!projectId) {
    throw new Error("Project ID is required.");
  }

  const response = await fetch(`${API_URL}/api/admin/projects/${projectId}`, {
    method: "DELETE",
    headers: createAuthorizationHeaders(accessToken),
  });

  const responseData = await readAdminProjectsResponse(response);

  return {
    message: responseData.message,
    deletedProject: responseData.data,
  };
}

export {
  createAdminProject,
  deleteAdminProject,
  fetchAdminProjectById,
  fetchAdminProjects,
  updateAdminProject,
};
