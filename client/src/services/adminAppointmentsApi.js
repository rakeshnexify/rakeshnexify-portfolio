import { createApiUrl } from "../config/apiConfig";

const ADMIN_APPOINTMENTS_PATH =
  "/api/admin/appointments";

function createAuthorizationHeaders(
  accessToken,
  {
    includeJsonContentType = false,
  } = {},
) {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  if (includeJsonContentType) {
    headers["Content-Type"] =
      "application/json";
  }

  return headers;
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function createAdminAppointmentApiError(
  response,
  responseData,
  fallbackMessage,
) {
  const message =
    typeof responseData?.message === "string" &&
    responseData.message.trim()
      ? responseData.message.trim()
      : fallbackMessage;

  const error = new Error(message);

  error.name = "AdminAppointmentApiError";
  error.status = response.status;
  error.fieldErrors =
    responseData?.fieldErrors &&
    typeof responseData.fieldErrors ===
      "object" &&
    !Array.isArray(responseData.fieldErrors)
      ? responseData.fieldErrors
      : {};

  return error;
}

function appendQueryValue(
  searchParams,
  key,
  value,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return;
  }

  const normalizedValue =
    typeof value === "string"
      ? value.trim()
      : String(value);

  if (!normalizedValue) {
    return;
  }

  searchParams.set(key, normalizedValue);
}

function buildAppointmentsQuery(filters = {}) {
  const searchParams =
    new URLSearchParams();

  appendQueryValue(
    searchParams,
    "page",
    filters.page,
  );

  appendQueryValue(
    searchParams,
    "limit",
    filters.limit,
  );

  appendQueryValue(
    searchParams,
    "search",
    filters.search,
  );

  appendQueryValue(
    searchParams,
    "status",
    filters.status,
  );

  appendQueryValue(
    searchParams,
    "service",
    filters.service,
  );

  appendQueryValue(
    searchParams,
    "assignedTo",
    filters.assignedTo,
  );

  appendQueryValue(
    searchParams,
    "preferredDateFrom",
    filters.preferredDateFrom,
  );

  appendQueryValue(
    searchParams,
    "preferredDateTo",
    filters.preferredDateTo,
  );

  appendQueryValue(
    searchParams,
    "scheduledFrom",
    filters.scheduledFrom,
  );

  appendQueryValue(
    searchParams,
    "scheduledTo",
    filters.scheduledTo,
  );

  const queryString =
    searchParams.toString();

  return queryString
    ? `?${queryString}`
    : "";
}

function getPositiveNumber(
  value,
  fallback,
) {
  const parsedValue = Number(value);

  if (
    Number.isFinite(parsedValue) &&
    parsedValue > 0
  ) {
    return parsedValue;
  }

  return fallback;
}

function normalizeAppointmentsListResponse(
  responseData,
) {
  const nestedData =
    responseData?.data &&
    typeof responseData.data === "object" &&
    !Array.isArray(responseData.data)
      ? responseData.data
      : null;

  const appointments =
    Array.isArray(responseData?.data)
      ? responseData.data
      : Array.isArray(
            responseData?.appointments,
          )
        ? responseData.appointments
        : Array.isArray(
              nestedData?.appointments,
            )
          ? nestedData.appointments
          : [];

  const pagination =
    responseData?.pagination &&
    typeof responseData.pagination ===
      "object"
      ? responseData.pagination
      : nestedData?.pagination &&
          typeof nestedData.pagination ===
            "object"
        ? nestedData.pagination
        : {};

  const count = getPositiveNumber(
    responseData?.count ??
      nestedData?.count,
    appointments.length,
  );

  const total = getPositiveNumber(
    responseData?.total ??
      nestedData?.total ??
      pagination.total,
    count,
  );

  const page = getPositiveNumber(
    responseData?.page ??
      nestedData?.page ??
      pagination.page,
    1,
  );

  const limit = getPositiveNumber(
    responseData?.limit ??
      nestedData?.limit ??
      pagination.limit,
    Math.max(appointments.length, 1),
  );

  const pages = getPositiveNumber(
    responseData?.pages ??
      responseData?.totalPages ??
      nestedData?.pages ??
      nestedData?.totalPages ??
      pagination.pages ??
      pagination.totalPages,
    Math.max(
      1,
      Math.ceil(total / limit),
    ),
  );

  return {
    appointments,
    count,
    total,
    page,
    limit,
    pages,
  };
}

async function fetchAdminAppointments(
  accessToken,
  filters = {},
  {
    signal,
  } = {},
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_APPOINTMENTS_PATH}${buildAppointmentsQuery(
        filters,
      )}`,
    ),
    {
      method: "GET",
      headers:
        createAuthorizationHeaders(
          accessToken,
        ),
      signal,
    },
  );

  const responseData =
    await parseJsonResponse(response);

  if (!response.ok) {
    throw createAdminAppointmentApiError(
      response,
      responseData,
      "Unable to load consultation requests.",
    );
  }

  if (responseData?.success !== true) {
    throw new Error(
      responseData?.message ||
        "Appointments request was unsuccessful.",
    );
  }

  return normalizeAppointmentsListResponse(
    responseData,
  );
}

async function fetchAdminAppointmentById(
  accessToken,
  appointmentId,
  {
    signal,
  } = {},
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_APPOINTMENTS_PATH}/${encodeURIComponent(
        appointmentId,
      )}`,
    ),
    {
      method: "GET",
      headers:
        createAuthorizationHeaders(
          accessToken,
        ),
      signal,
    },
  );

  const responseData =
    await parseJsonResponse(response);

  if (!response.ok) {
    throw createAdminAppointmentApiError(
      response,
      responseData,
      "Unable to load the consultation request.",
    );
  }

  if (
    responseData?.success !== true ||
    !responseData?.data ||
    typeof responseData.data !==
      "object" ||
    Array.isArray(responseData.data)
  ) {
    throw new Error(
      "Appointment API returned an unsupported response.",
    );
  }

  return responseData.data;
}

async function updateAdminAppointment(
  accessToken,
  appointmentId,
  appointmentData,
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_APPOINTMENTS_PATH}/${encodeURIComponent(
        appointmentId,
      )}`,
    ),
    {
      method: "PATCH",
      headers:
        createAuthorizationHeaders(
          accessToken,
          {
            includeJsonContentType: true,
          },
        ),
      body: JSON.stringify(
        appointmentData,
      ),
    },
  );

  const responseData =
    await parseJsonResponse(response);

  if (!response.ok) {
    throw createAdminAppointmentApiError(
      response,
      responseData,
      "Unable to update the consultation request.",
    );
  }

  if (
    responseData?.success !== true ||
    !responseData?.data ||
    typeof responseData.data !==
      "object" ||
    Array.isArray(responseData.data)
  ) {
    throw new Error(
      "Appointment update returned an unsupported response.",
    );
  }

  return {
    message:
      typeof responseData.message ===
        "string" &&
      responseData.message.trim()
        ? responseData.message.trim()
        : "Appointment updated successfully.",
    appointment: responseData.data,
  };
}

async function deleteAdminAppointment(
  accessToken,
  appointmentId,
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_APPOINTMENTS_PATH}/${encodeURIComponent(
        appointmentId,
      )}`,
    ),
    {
      method: "DELETE",
      headers:
        createAuthorizationHeaders(
          accessToken,
        ),
    },
  );

  const responseData =
    await parseJsonResponse(response);

  if (!response.ok) {
    throw createAdminAppointmentApiError(
      response,
      responseData,
      "Unable to delete the consultation request.",
    );
  }

  if (responseData?.success !== true) {
    throw new Error(
      responseData?.message ||
        "Appointment deletion was unsuccessful.",
    );
  }

  return {
    message:
      typeof responseData.message ===
        "string" &&
      responseData.message.trim()
        ? responseData.message.trim()
        : "Appointment deleted successfully.",
  };
}

async function convertAdminAppointmentToLead(
  accessToken,
  appointmentId,
  conversionData = {},
) {
  const response = await fetch(
    createApiUrl(
      `${ADMIN_APPOINTMENTS_PATH}/${encodeURIComponent(
        appointmentId,
      )}/convert-to-lead`,
    ),
    {
      method: "POST",
      headers:
        createAuthorizationHeaders(
          accessToken,
          {
            includeJsonContentType: true,
          },
        ),
      body: JSON.stringify(
        conversionData,
      ),
    },
  );

  const responseData =
    await parseJsonResponse(response);

  if (!response.ok) {
    throw createAdminAppointmentApiError(
      response,
      responseData,
      "Unable to convert the Appointment to a Lead.",
    );
  }

  if (
    responseData?.success !== true ||
    !responseData?.data ||
    typeof responseData.data !==
      "object" ||
    Array.isArray(responseData.data)
  ) {
    throw new Error(
      "Lead conversion returned an unsupported response.",
    );
  }

  return {
    message:
      typeof responseData.message ===
        "string" &&
      responseData.message.trim()
        ? responseData.message.trim()
        : "Appointment converted to Lead successfully.",
    lead: responseData.data,
  };
}

export {
  convertAdminAppointmentToLead,
  deleteAdminAppointment,
  fetchAdminAppointmentById,
  fetchAdminAppointments,
  updateAdminAppointment,
};