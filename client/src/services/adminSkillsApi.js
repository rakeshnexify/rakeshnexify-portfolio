import { createApiUrl } from "../config/apiConfig";

const ADMIN_SKILLS_PATH = "/api/admin/skills";

function createAdminSkillsApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin Skills request failed with status ${response.status}.`,
  );

  error.status = response.status;

  error.fieldErrors = responseData?.fieldErrors || {};

  return error;
}

async function readAdminSkillsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminSkillsApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin Skills API returned an invalid response.");
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

function buildAdminSkillsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = String(filters.search || "").trim();

  const category = String(filters.category || "").trim();

  const proficiencyLevel = String(
    filters.proficiencyLevel || "",
  )
    .trim()
    .toLowerCase();

  if (search) {
    query.set("search", search);
  }

  if (category) {
    query.set("category", category);
  }

  if (proficiencyLevel) {
    query.set("proficiencyLevel", proficiencyLevel);
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

async function fetchAdminSkills(
  accessToken,
  filters = {},
  { signal } = {},
) {
  const queryString = buildAdminSkillsQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_SKILLS_PATH}${queryString}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminSkillsResponse(response);

  return {
    count: responseData.count ?? responseData.data?.length ?? 0,

    skills: Array.isArray(responseData.data)
      ? responseData.data
      : [],
  };
}

async function fetchAdminSkillById(
  accessToken,
  skillId,
  { signal } = {},
) {
  if (!skillId) {
    throw new Error("Skill ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_SKILLS_PATH}/${skillId}`),
    {
      method: "GET",

      headers: createAuthorizationHeaders(accessToken),

      signal,
    },
  );

  const responseData = await readAdminSkillsResponse(response);

  return responseData.data;
}

async function createAdminSkill(accessToken, skillData) {
  const response = await fetch(createApiUrl(ADMIN_SKILLS_PATH), {
    method: "POST",

    headers: {
      ...createAuthorizationHeaders(accessToken),

      "Content-Type": "application/json",
    },

    body: JSON.stringify(skillData),
  });

  const responseData = await readAdminSkillsResponse(response);

  return {
    message: responseData.message,

    skill: responseData.data,
  };
}

async function updateAdminSkill(
  accessToken,
  skillId,
  skillData,
) {
  if (!skillId) {
    throw new Error("Skill ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_SKILLS_PATH}/${skillId}`),
    {
      method: "PATCH",

      headers: {
        ...createAuthorizationHeaders(accessToken),

        "Content-Type": "application/json",
      },

      body: JSON.stringify(skillData),
    },
  );

  const responseData = await readAdminSkillsResponse(response);

  return {
    message: responseData.message,

    skill: responseData.data,
  };
}

async function deleteAdminSkill(accessToken, skillId) {
  if (!skillId) {
    throw new Error("Skill ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_SKILLS_PATH}/${skillId}`),
    {
      method: "DELETE",

      headers: createAuthorizationHeaders(accessToken),
    },
  );

  const responseData = await readAdminSkillsResponse(response);

  return {
    message: responseData.message,

    deletedSkill: responseData.data,
  };
}

export {
  createAdminSkill,
  deleteAdminSkill,
  fetchAdminSkillById,
  fetchAdminSkills,
  updateAdminSkill,
};