const defaultStatisticFormValues = {
  key: "",
  label: "",
  value: "",
  prefix: "",
  suffix: "",
  description: "",
  icon: "",
  iconUrl: "",
  accent: "blue",
  url: "",
  openInNewTab: false,
  order: 0,
  isFeatured: false,
  isVisible: true,
};

function cleanString(value) {
  return String(value ?? "").trim();
}

function createStatisticKey(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createStatisticFormValues(statistic = {}) {
  const numericOrder = Number(statistic?.order);

  return {
    key: cleanString(statistic?.key),

    label: cleanString(statistic?.label),

    value: cleanString(statistic?.value),

    prefix: cleanString(statistic?.prefix),

    suffix: cleanString(statistic?.suffix),

    description: cleanString(statistic?.description),

    icon: cleanString(statistic?.icon),

    iconUrl: cleanString(statistic?.iconUrl),

    accent: cleanString(statistic?.accent) || "blue",

    url: cleanString(statistic?.url),

    openInNewTab: statistic?.openInNewTab === true,

    order:
      Number.isFinite(numericOrder) && numericOrder >= 0 ? numericOrder : 0,

    isFeatured: statistic?.isFeatured === true,

    isVisible: statistic?.isVisible === true,
  };
}

function createStatisticPayload(formValues = {}) {
  const values = createStatisticFormValues(formValues);

  return {
    key: createStatisticKey(values.key) || createStatisticKey(values.label),

    label: values.label,

    value: values.value,

    prefix: values.prefix,

    suffix: values.suffix,

    description: values.description,

    icon: values.icon,

    iconUrl: values.iconUrl,

    accent: values.accent,

    url: values.url,

    openInNewTab: values.openInNewTab,

    order: Number(values.order),

    isFeatured: values.isFeatured,

    isVisible: values.isVisible,
  };
}

export {
  createStatisticFormValues,
  createStatisticKey,
  createStatisticPayload,
  defaultStatisticFormValues,
};
