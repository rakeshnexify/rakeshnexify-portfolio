const leadStatusOptions = [
  {
    value: "new",
    label: "New",
  },
  {
    value: "qualified",
    label: "Qualified",
  },
  {
    value: "contacted",
    label: "Contacted",
  },
  {
    value: "proposal",
    label: "Proposal",
  },
  {
    value: "negotiation",
    label: "Negotiation",
  },
  {
    value: "won",
    label: "Won",
  },
  {
    value: "lost",
    label: "Lost",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

const leadPriorityOptions = [
  {
    value: "low",
    label: "Low",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "high",
    label: "High",
  },
  {
    value: "urgent",
    label: "Urgent",
  },
];

const commonCurrencyOptions = [
  "USD",
  "NPR",
  "INR",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
];

const initialLeadForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "manual",
  service: "",
  serviceSlug: "",
  serviceTitle: "",
  subject: "",
  requirementSummary: "",
  status: "new",
  priority: "medium",
  estimatedValue: "",
  currency: "USD",
  assignedTo: "",
  nextFollowUpAt: "",
  lastContactedAt: "",
  lostReason: "",
  order: "0",
};

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) => String(number).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

function toIsoDateTimeOrNull(value) {
  const cleanedValue = cleanString(value);

  if (!cleanedValue) {
    return null;
  }

  const date = new Date(cleanedValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function createLeadFormState(lead = null) {
  if (!lead || typeof lead !== "object" || Array.isArray(lead)) {
    return {
      ...initialLeadForm,
    };
  }

  const serviceId =
    lead.service && typeof lead.service === "object"
      ? cleanString(lead.service._id)
      : cleanString(lead.service);

  const assignedToId =
    lead.assignedTo && typeof lead.assignedTo === "object"
      ? cleanString(lead.assignedTo._id)
      : cleanString(lead.assignedTo);

  return {
    name: cleanString(lead.name),
    email: cleanString(lead.email),
    phone: cleanString(lead.phone),
    company: cleanString(lead.company),
    source: cleanString(lead.source) || "manual",
    service: serviceId,
    serviceSlug: cleanString(lead.serviceSlug),
    serviceTitle: cleanString(lead.serviceTitle),
    subject: cleanString(lead.subject),
    requirementSummary: cleanString(lead.requirementSummary),
    status: cleanString(lead.status) || "new",
    priority: cleanString(lead.priority) || "medium",
    estimatedValue:
      lead.estimatedValue === null || lead.estimatedValue === undefined
        ? ""
        : String(lead.estimatedValue),
    currency: cleanString(lead.currency).toUpperCase() || "USD",
    assignedTo: assignedToId,
    nextFollowUpAt: formatDateTimeLocal(lead.nextFollowUpAt),
    lastContactedAt: formatDateTimeLocal(lead.lastContactedAt),
    lostReason: cleanString(lead.lostReason),
    order:
      lead.order === null || lead.order === undefined
        ? "0"
        : String(lead.order),
  };
}

function validateLeadForm(form) {
  const fieldErrors = {};

  const name = cleanString(form?.name);
  const email = cleanString(form?.email).toLowerCase();
  const subject = cleanString(form?.subject);
  const currency = cleanString(form?.currency).toUpperCase();
  const estimatedValue = cleanString(form?.estimatedValue);
  const order = cleanString(form?.order);
  const status = cleanString(form?.status).toLowerCase();
  const lostReason = cleanString(form?.lostReason);

  if (name.length < 2) {
    fieldErrors.name = "Lead name must contain at least 2 characters.";
  } else if (name.length > 100) {
    fieldErrors.name = "Lead name cannot exceed 100 characters.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Please provide a valid lead email address.";
  }

  if (subject.length < 3) {
    fieldErrors.subject = "Lead subject must contain at least 3 characters.";
  } else if (subject.length > 150) {
    fieldErrors.subject = "Lead subject cannot exceed 150 characters.";
  }

  if (!leadStatusOptions.some((option) => option.value === status)) {
    fieldErrors.status = "Please select a valid lead status.";
  }

  const priority = cleanString(form?.priority).toLowerCase();

  if (!leadPriorityOptions.some((option) => option.value === priority)) {
    fieldErrors.priority = "Please select a valid lead priority.";
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    fieldErrors.currency = "Currency must use a 3-letter code.";
  }

  if (
    estimatedValue &&
    !/^\d+(?:\.\d+)?$/.test(estimatedValue)
  ) {
    fieldErrors.estimatedValue =
      "Estimated value must be a non-negative number.";
  }

  if (!/^\d+$/.test(order)) {
    fieldErrors.order = "Lead order must be a non-negative integer.";
  } else {
    const orderNumber = Number(order);

    if (
      !Number.isSafeInteger(orderNumber) ||
      orderNumber < 0 ||
      orderNumber > 1_000_000
    ) {
      fieldErrors.order =
        "Lead order must be an integer between 0 and 1000000.";
    }
  }

  if (status !== "lost" && lostReason) {
    fieldErrors.lostReason =
      "Lost reason can only be saved when lead status is Lost.";
  }

  if (lostReason.length > 1000) {
    fieldErrors.lostReason = "Lost reason cannot exceed 1000 characters.";
  }

  const requirementSummary = cleanString(form?.requirementSummary);

  if (requirementSummary.length > 5000) {
    fieldErrors.requirementSummary =
      "Requirement summary cannot exceed 5000 characters.";
  }

  if (cleanString(form?.company).length > 160) {
    fieldErrors.company = "Company name cannot exceed 160 characters.";
  }

  if (cleanString(form?.phone).length > 30) {
    fieldErrors.phone = "Lead phone cannot exceed 30 characters.";
  }

  if (cleanString(form?.source).length > 100) {
    fieldErrors.source = "Lead source cannot exceed 100 characters.";
  }

  return fieldErrors;
}

function createLeadPayload(form) {
  const status = cleanString(form?.status).toLowerCase() || "new";

  const estimatedValue = cleanString(form?.estimatedValue);

  const order = cleanString(form?.order);

  return {
    name: cleanString(form?.name),
    email: cleanString(form?.email).toLowerCase(),
    phone: cleanString(form?.phone),
    company: cleanString(form?.company),
    source: cleanString(form?.source).toLowerCase() || "manual",
    service: cleanString(form?.service) || null,
    serviceSlug: cleanString(form?.serviceSlug).toLowerCase(),
    serviceTitle: cleanString(form?.serviceTitle),
    subject: cleanString(form?.subject),
    requirementSummary: cleanString(form?.requirementSummary),
    status,
    priority: cleanString(form?.priority).toLowerCase() || "medium",
    estimatedValue: estimatedValue ? Number(estimatedValue) : null,
    currency: cleanString(form?.currency).toUpperCase() || "USD",
    assignedTo: cleanString(form?.assignedTo) || null,
    nextFollowUpAt: toIsoDateTimeOrNull(form?.nextFollowUpAt),
    lastContactedAt: toIsoDateTimeOrNull(form?.lastContactedAt),
    lostReason: status === "lost" ? cleanString(form?.lostReason) : "",
    order: order ? Number(order) : 0,
  };
}

function mergeLeadFieldErrors(clientErrors = {}, apiErrors = {}) {
  return {
    ...(clientErrors &&
    typeof clientErrors === "object" &&
    !Array.isArray(clientErrors)
      ? clientErrors
      : {}),
    ...(apiErrors &&
    typeof apiErrors === "object" &&
    !Array.isArray(apiErrors)
      ? apiErrors
      : {}),
  };
}

export {
  commonCurrencyOptions,
  createLeadFormState,
  createLeadPayload,
  initialLeadForm,
  leadPriorityOptions,
  leadStatusOptions,
  mergeLeadFieldErrors,
  validateLeadForm,
};
