import { createApiUrl } from "../config/apiConfig";

const ADMIN_TEAM_MEMBERS_PATH = "/api/admin/team";

function createAdminTeamMembersApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin team members request failed with status ${response.status}.`,
  );

  error.status = response.status;
  error.fieldErrors = responseData?.fieldErrors || {};

  return error;
}

async function readAdminTeamMembersResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminTeamMembersApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin Team Members API returned an invalid response.");
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

function buildAdminTeamMembersQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  const professionalRole = String(filters.professionalRole || "").trim();

  const status = String(filters.status || "").trim();

  const availabilityStatus = String(filters.availabilityStatus || "").trim();

  if (search) {
    query.set("search", search);
  }

  if (professionalRole) {
    query.set("professionalRole", professionalRole);
  }

  if (status) {
    query.set("status", status);
  }

  if (availabilityStatus) {
    query.set("availabilityStatus", availabilityStatus);
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

async function fetchAdminTeamMembers(
  accessToken,
  filters = {},
  { signal } = {},
) {
  const queryString = buildAdminTeamMembersQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_TEAM_MEMBERS_PATH}${queryString}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminTeamMembersResponse(response);

  return {
    count: responseData.count ?? responseData.data?.length ?? 0,

    teamMembers: Array.isArray(responseData.data) ? responseData.data : [],
  };
}

async function fetchAdminTeamMemberById(
  accessToken,
  teamMemberId,
  { signal } = {},
) {
  if (!teamMemberId) {
    throw new Error("Team member ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_TEAM_MEMBERS_PATH}/${teamMemberId}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminTeamMembersResponse(response);

  return responseData.data;
}

async function createAdminTeamMember(accessToken, teamMemberData) {
  const response = await fetch(createApiUrl(ADMIN_TEAM_MEMBERS_PATH), {
    method: "POST",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(teamMemberData),
  });

  const responseData = await readAdminTeamMembersResponse(response);

  return {
    message: responseData.message,
    teamMember: responseData.data,
  };
}

async function updateAdminTeamMember(
  accessToken,
  teamMemberId,
  teamMemberData,
) {
  if (!teamMemberId) {
    throw new Error("Team member ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_TEAM_MEMBERS_PATH}/${teamMemberId}`),
    {
      method: "PATCH",

      headers: {
        ...createAuthorizationHeaders(accessToken),

        "Content-Type": "application/json",
      },

      body: JSON.stringify(teamMemberData),
    },
  );

  const responseData = await readAdminTeamMembersResponse(response);

  return {
    message: responseData.message,
    teamMember: responseData.data,
  };
}

async function deleteAdminTeamMember(accessToken, teamMemberId) {
  if (!teamMemberId) {
    throw new Error("Team member ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_TEAM_MEMBERS_PATH}/${teamMemberId}`),
    {
      method: "DELETE",

      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminTeamMembersResponse(response);

  return {
    message: responseData.message,
    deletedTeamMember: responseData.data,
  };
}

export {
  createAdminTeamMember,
  deleteAdminTeamMember,
  fetchAdminTeamMemberById,
  fetchAdminTeamMembers,
  updateAdminTeamMember,
};
