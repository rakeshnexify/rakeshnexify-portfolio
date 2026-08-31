function formatPackagePrice(servicePackage) {
  if (servicePackage?.pricingMode === "custom") {
    return servicePackage?.priceLabel || "Custom pricing";
  }

  const numericPrice = Number(servicePackage?.price);

  if (!Number.isFinite(numericPrice)) {
    return servicePackage?.priceLabel || "Contact for pricing";
  }

  const currency = String(servicePackage?.currency || "NPR").toUpperCase();

  let formattedPrice = `${currency} ${numericPrice.toLocaleString("en-US")}`;

  try {
    formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch {
    // Keep the safe currency + numeric fallback.
  }

  if (servicePackage?.pricingMode === "starting-from") {
    return `From ${formattedPrice}`;
  }

  return formattedPrice;
}

export { formatPackagePrice };
