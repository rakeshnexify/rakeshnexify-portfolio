function normalizeRating(value) {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  ) {
    return value;
  }

  if (typeof value === "string" && /^[1-5]$/.test(value)) {
    return value.charCodeAt(0) - 48;
  }

  return 0;
}

export { normalizeRating };
