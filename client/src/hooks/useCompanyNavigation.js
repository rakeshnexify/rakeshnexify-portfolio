import { useMemo } from "react";

import useCompanies from "./useCompanies";

const EMPTY_COMPANIES = [];

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const characterCode = text.charCodeAt(index);

    if (characterCode <= 31 || characterCode === 127) {
      return true;
    }
  }

  return false;
}

function getSafeExternalWebsiteUrl(value) {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return parsedUrl.toString();
    }
  } catch {
    return "";
  }

  return "";
}

function sortNavigationCompanies(firstCompany, secondCompany) {
  const firstOrder = Number(firstCompany?.order);
  const secondOrder = Number(secondCompany?.order);

  const safeFirstOrder = Number.isFinite(firstOrder) ? firstOrder : 0;
  const safeSecondOrder = Number.isFinite(secondOrder) ? secondOrder : 0;

  if (safeFirstOrder !== safeSecondOrder) {
    return safeFirstOrder - safeSecondOrder;
  }

  return String(firstCompany?.name || "").localeCompare(
    String(secondCompany?.name || ""),
    undefined,
    {
      sensitivity: "base",
    },
  );
}

function useCompanyNavigation() {
  const { companies, isLoading, error, refreshCompanies } = useCompanies({
    fallbackCompanies: EMPTY_COMPANIES,
    status: "active",
    featured: true,
  });

  const navigationCompanies = useMemo(() => {
    const sourceCompanies = Array.isArray(companies) ? companies : [];

    return sourceCompanies
      .filter((company) =>
        ["owned", "managed"].includes(
          String(company?.relationship || "")
            .trim()
            .toLowerCase(),
        ),
      )
      .map((company, index) => {
        const name = String(company?.name || "").trim();
        const websiteUrl = getSafeExternalWebsiteUrl(company?.websiteUrl);

        if (!name || !websiteUrl) {
          return null;
        }

        return {
          key:
            company?._id ||
            company?.id ||
            company?.slug ||
            `${name}-${websiteUrl}-${index}`,
          name,
          websiteUrl,
          order: company?.order,
        };
      })
      .filter(Boolean)
      .sort(sortNavigationCompanies);
  }, [companies]);

  return {
    companies: navigationCompanies,
    isLoading,
    error,
    refreshCompanies,
  };
}

export default useCompanyNavigation;
