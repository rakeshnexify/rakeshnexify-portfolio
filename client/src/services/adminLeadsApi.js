import { createApiUrl } from "../config/apiConfig";

const ADMIN_LEADS_PATH = "/api/admin/leads";

const leadStatuses = [
  "new",
  "qualified",
  "contacted",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "archived",
];

const leadPriorities = ["low", "medium", "high", "urgent"];

const leadFollowUpFilters = ["overdue", "today", "upcoming", "none"];

const leadSortOptions = [
  "newest",
  "oldest",
  "followup",
  "value-high",
  "value-low",
];

function createAdminLeadsApiError(responseData, response) {
  const error = new Error(
    responseData?.message ||
      `Admin leads request failed with status ${response.status}.`,
  );

  error.status = response.status;
  error.fieldErrors = responseData?.fieldErrors || responseData?.errors || {};

  return error;
}

async function readAdminLeadsResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw createAdminLeadsApiError(responseData, response);
  }

  if (!responseData?.success) {
    throw new Error("Admin Leads API returned an invalid response.");
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

function cleanTextFilter(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanPositiveInteger(value, maximum = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);

  return Number.isSafeInteger(number) && number > 0 && number <= maximum
    ? number
    : null;
}

function buildAdminLeadsQuery(filters = {}) {
  const query = new URLSearchParams();

  const search = cleanTextFilter(filters.search);

  const status = cleanTextFilter(filters.status).toLowerCase();

  const priority = cleanTextFilter(filters.priority).toLowerCase();

  const source = cleanTextFilter(filters.source);

  const service = cleanTextFilter(filters.service);

  const assignedTo = cleanTextFilter(filters.assignedTo);

  const followUp = cleanTextFilter(filters.followUp).toLowerCase();

  const sort = cleanTextFilter(filters.sort).toLowerCase();

  const page = cleanPositiveInteger(filters.page, 100_000);

  const limit = cleanPositiveInteger(filters.limit, 100);

  if (search) {
    query.set("search", search);
  }

  if (status && leadStatuses.includes(status)) {
    query.set("status", status);
  }

  if (priority && leadPriorities.includes(priority)) {
    query.set("priority", priority);
  }

  if (source) {
    query.set("source", source);
  }

  if (service) {
    query.set("service", service);
  }

  if (assignedTo) {
    query.set("assignedTo", assignedTo);
  }

  if (followUp && leadFollowUpFilters.includes(followUp)) {
    query.set("followUp", followUp);
  }

  if (sort && leadSortOptions.includes(sort)) {
    query.set("sort", sort);
  }

  if (page) {
    query.set("page", String(page));
  }

  if (limit) {
    query.set("limit", String(limit));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

function createEmptyStatusCounts() {
  return leadStatuses.reduce(
    (counts, status) => ({
      ...counts,
      [status]: 0,
    }),
    {},
  );
}

function normalizeStatusCounts(statusCounts) {
  const normalizedCounts = createEmptyStatusCounts();

  if (
    !statusCounts ||
    typeof statusCounts !== "object" ||
    Array.isArray(statusCounts)
  ) {
    return normalizedCounts;
  }

  leadStatuses.forEach((status) => {
    const count = Number(statusCounts[status]);

    normalizedCounts[status] =
      Number.isFinite(count) && count >= 0 ? count : 0;
  });

  return normalizedCounts;
}

function normalizeFollowUpCounts(followUpCounts) {
  const normalizedCounts = {
    overdue: 0,
    today: 0,
  };

  if (
    !followUpCounts ||
    typeof followUpCounts !== "object" ||
    Array.isArray(followUpCounts)
  ) {
    return normalizedCounts;
  }

  ["overdue", "today"].forEach((key) => {
    const count = Number(followUpCounts[key]);

    normalizedCounts[key] =
      Number.isFinite(count) && count >= 0 ? count : 0;
  });

  return normalizedCounts;
}

async function fetchAdminLeads(accessToken, filters = {}, { signal } = {}) {
  const queryString = buildAdminLeadsQuery(filters);

  const response = await fetch(
    createApiUrl(`${ADMIN_LEADS_PATH}${queryString}`),
    {
      method: "GET",
      headers: createAuthorizationHeaders(accessToken),
      signal,
    },
  );

  const responseData = await readAdminLeadsResponse(response);

  const leads = Array.isArray(responseData.data) ? responseData.data : [];

  return {
    leads,
    count: Number(responseData.count) || leads.length,
    total: Number(responseData.total) || leads.length,
    page: Number(responseData.page) || 1,
    limit: Number(responseData.limit) || 20,
    totalPages: Number(responseData.totalPages) || 1,
    statusCounts: normalizeStatusCounts(responseData.statusCounts),
    followUpCounts: normalizeFollowUpCounts(responseData.followUpCounts),
  };
}

async function fetchAdminLeadById(accessToken, leadId, { signal } = {}) {
  if (!leadId) {
    throw new Error("Lead ID is required.");
  }

  const response = await fetch(createApiUrl(`${ADMIN_LEADS_PATH}/${leadId}`), {
    method: "GET",
    headers: createAuthorizationHeaders(accessToken),
    signal,
  });

  const responseData = await readAdminLeadsResponse(response);

  return responseData.data;
}

async function createAdminLead(accessToken, leadData) {
  const response = await fetch(createApiUrl(ADMIN_LEADS_PATH), {
    method: "POST",
    headers: {
      ...createAuthorizationHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(leadData),
  });

  const responseData = await readAdminLeadsResponse(response);

  return {
    message: responseData.message,
    lead: responseData.data,
  };
}

async function updateAdminLead(accessToken, leadId, leadData) {
  if (!leadId) {
    throw new Error("Lead ID is required.");
  }

  const response = await fetch(createApiUrl(`${ADMIN_LEADS_PATH}/${leadId}`), {
    method: "PATCH",
    headers: {
      ...createAuthorizationHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(leadData),
  });

  const responseData = await readAdminLeadsResponse(response);

  return {
    message: responseData.message,
    lead: responseData.data,
  };
}

async function addAdminLeadNote(accessToken, leadId, text) {
  if (!leadId) {
    throw new Error("Lead ID is required.");
  }

  const response = await fetch(
    createApiUrl(`${ADMIN_LEADS_PATH}/${leadId}/notes`),
    {
      method: "POST",
      headers: {
        ...createAuthorizationHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
      }),
    },
  );

  const responseData = await readAdminLeadsResponse(response);

  return {
    message: responseData.message,
    lead: responseData.data,
  };
}

async function deleteAdminLead(accessToken, leadId) {
  if (!leadId) {
    throw new Error("Lead ID is required.");
  }

  const response = await fetch(createApiUrl(`${ADMIN_LEADS_PATH}/${leadId}`), {
    method: "DELETE",
    headers: createAuthorizationHeaders(accessToken),
  });

  const responseData = await readAdminLeadsResponse(response);

  return {
    message: responseData.message,
    deletedLead: responseData.data,
  };
}

export {
  addAdminLeadNote,
  buildAdminLeadsQuery,
  createAdminLead,
  deleteAdminLead,
  fetchAdminLeadById,
  fetchAdminLeads,
  leadFollowUpFilters,
  leadPriorities,
  leadSortOptions,
  leadStatuses,
  updateAdminLead,
};
