import { createApiUrl } from "../config/apiConfig";

const ADMIN_ANALYTICS_PATH = "/api/admin/analytics";
const REQUEST_TIMEOUT_MS = 15000;
const ANALYTICS_RANGES = new Set(["7d", "30d", "90d", "all"]);

const STATUS_KEYS = {
  orders: ["new", "reviewing", "confirmed", "in-progress", "completed", "cancelled", "rejected"],
  appointments: ["requested", "confirmed", "completed", "cancelled", "declined", "no-show"],
  leads: ["new", "qualified", "contacted", "proposal", "negotiation", "won", "lost", "archived"],
  contactMessages: ["new", "read", "replied", "archived"],
  subscribers: ["active", "unsubscribed"],
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNonNegativeNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
}

function normalizeRange(value) {
  const normalizedValue = normalizeText(value);
  return ANALYTICS_RANGES.has(normalizedValue) ? normalizedValue : "30d";
}

function createAuthorizationHeaders(accessToken) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function createAdminAnalyticsApiError(response, responseData, fallbackMessage) {
  const message = normalizeText(responseData?.message) || fallbackMessage;
  const error = new Error(message);

  error.name = "AdminAnalyticsApiError";
  error.status = response.status;
  error.fieldErrors =
    responseData?.fieldErrors &&
    typeof responseData.fieldErrors === "object" &&
    !Array.isArray(responseData.fieldErrors)
      ? responseData.fieldErrors
      : {};

  return error;
}

function normalizeStatusBreakdown(value, statuses) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return Object.fromEntries(
    statuses.map((status) => [status, normalizeNonNegativeNumber(source[status])]),
  );
}

function normalizeConversion(value, includeLost = false) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const result = {
    eligible: normalizeNonNegativeNumber(source.eligible),
    rate: normalizeNonNegativeNumber(source.rate),
  };

  if (includeLost) {
    result.won = normalizeNonNegativeNumber(source.won);
    result.lost = normalizeNonNegativeNumber(source.lost);
  } else {
    result.converted = normalizeNonNegativeNumber(source.converted);
  }

  return result;
}

function normalizeAnalyticsResponse(responseData) {
  const data =
    responseData?.data && typeof responseData.data === "object" && !Array.isArray(responseData.data)
      ? responseData.data
      : null;

  if (!data) {
    throw new Error("Analytics request returned an unsupported response.");
  }

  const range =
    data.range && typeof data.range === "object" && !Array.isArray(data.range)
      ? data.range
      : {};

  const overview =
    data.overview && typeof data.overview === "object" && !Array.isArray(data.overview)
      ? data.overview
      : {};

  const currentSubscribers =
    data.currentSubscribers &&
    typeof data.currentSubscribers === "object" &&
    !Array.isArray(data.currentSubscribers)
      ? data.currentSubscribers
      : {};

  const statusBreakdowns =
    data.statusBreakdowns &&
    typeof data.statusBreakdowns === "object" &&
    !Array.isArray(data.statusBreakdowns)
      ? data.statusBreakdowns
      : {};

  const conversions =
    data.conversions && typeof data.conversions === "object" && !Array.isArray(data.conversions)
      ? data.conversions
      : {};

  return {
    range: {
      key: normalizeRange(range.key),
      from: range.from === null ? null : normalizeText(range.from),
      to: normalizeText(range.to),
      timezone: normalizeText(range.timezone) || "UTC",
      bucket: normalizeText(range.bucket),
    },
    overview: {
      orders: normalizeNonNegativeNumber(overview.orders),
      appointments: normalizeNonNegativeNumber(overview.appointments),
      leads: normalizeNonNegativeNumber(overview.leads),
      contactMessages: normalizeNonNegativeNumber(overview.contactMessages),
      subscriberActivity: normalizeNonNegativeNumber(overview.subscriberActivity),
    },
    currentSubscribers: {
      total: normalizeNonNegativeNumber(currentSubscribers.total),
      active: normalizeNonNegativeNumber(currentSubscribers.active),
      unsubscribed: normalizeNonNegativeNumber(currentSubscribers.unsubscribed),
    },
    statusBreakdowns: {
      orders: normalizeStatusBreakdown(statusBreakdowns.orders, STATUS_KEYS.orders),
      appointments: normalizeStatusBreakdown(statusBreakdowns.appointments, STATUS_KEYS.appointments),
      leads: normalizeStatusBreakdown(statusBreakdowns.leads, STATUS_KEYS.leads),
      contactMessages: normalizeStatusBreakdown(
        statusBreakdowns.contactMessages,
        STATUS_KEYS.contactMessages,
      ),
      subscribers: normalizeStatusBreakdown(statusBreakdowns.subscribers, STATUS_KEYS.subscribers),
    },
    trends: Array.isArray(data.trends)
      ? data.trends.slice(0, 400).map((row) => ({
          start: normalizeText(row?.start),
          orders: normalizeNonNegativeNumber(row?.orders),
          appointments: normalizeNonNegativeNumber(row?.appointments),
          leads: normalizeNonNegativeNumber(row?.leads),
          contactMessages: normalizeNonNegativeNumber(row?.contactMessages),
          subscriberActivity: normalizeNonNegativeNumber(row?.subscriberActivity),
        })).filter((row) => row.start)
      : [],
    conversions: {
      contactMessagesToLeads: normalizeConversion(conversions.contactMessagesToLeads),
      appointmentsToLeads: normalizeConversion(conversions.appointmentsToLeads),
      leadWonRate: normalizeConversion(conversions.leadWonRate, true),
    },
    leadSources: Array.isArray(data.leadSources)
      ? data.leadSources.slice(0, 20).map((row) => ({
          source: normalizeText(row?.source) || "unknown",
          count: normalizeNonNegativeNumber(row?.count),
        }))
      : [],
    estimatedPipelineValue: Array.isArray(data.estimatedPipelineValue)
      ? data.estimatedPipelineValue.slice(0, 20).map((row) => ({
          currency: normalizeText(row?.currency).toUpperCase(),
          amount: normalizeNonNegativeNumber(row?.amount),
          leadCount: normalizeNonNegativeNumber(row?.leadCount),
        })).filter((row) => row.currency)
      : [],
    topOrderedServices: Array.isArray(data.topOrderedServices)
      ? data.topOrderedServices.slice(0, 5).map((row) => ({
          slug: normalizeText(row?.slug),
          title: normalizeText(row?.title),
          count: normalizeNonNegativeNumber(row?.count),
        })).filter((row) => row.slug)
      : [],
  };
}

function createAbortContext(callerSignal) {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  function handleCallerAbort() {
    controller.abort();
  }

  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener("abort", handleCallerAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    wasTimedOut: () => timedOut,
    cleanup() {
      window.clearTimeout(timeoutId);
      callerSignal?.removeEventListener("abort", handleCallerAbort);
    },
  };
}

async function fetchAdminAnalytics(accessToken, range = "30d", { signal } = {}) {
  const normalizedRange = normalizeRange(range);
  const query = new URLSearchParams({ range: normalizedRange });
  const abortContext = createAbortContext(signal);

  try {
    const response = await fetch(
      createApiUrl(`${ADMIN_ANALYTICS_PATH}?${query.toString()}`),
      {
        method: "GET",
        headers: createAuthorizationHeaders(accessToken),
        signal: abortContext.signal,
      },
    );

    const responseData = await parseJsonResponse(response);

    if (!response.ok) {
      throw createAdminAnalyticsApiError(
        response,
        responseData,
        "Unable to load Admin analytics.",
      );
    }

    if (responseData?.success !== true) {
      throw new Error(
        normalizeText(responseData?.message) || "Analytics request was unsuccessful.",
      );
    }

    return normalizeAnalyticsResponse(responseData);
  } catch (error) {
    if (error?.name === "AbortError" && abortContext.wasTimedOut()) {
      const timeoutError = new Error("Analytics request timed out. Please try again.");
      timeoutError.name = "AdminAnalyticsTimeoutError";
      throw timeoutError;
    }

    throw error;
  } finally {
    abortContext.cleanup();
  }
}

export { ANALYTICS_RANGES, fetchAdminAnalytics };
