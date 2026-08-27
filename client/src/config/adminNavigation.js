const ADMIN_NAVIGATION_GROUPS = [
  {
    key: "dashboard",
    label: "Dashboard",
    order: 10,
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        route: "/admin/dashboard",
        icon: "dashboard",
        description: "Admin overview and operational dashboard",
        activePrefixes: ["/admin/dashboard"],
      },
    ],
  },
  {
    key: "manage",
    label: "Manage",
    order: 20,
    items: [
      {
        key: "services",
        label: "Services & Packages",
        route: "/admin/services",
        icon: "services",
        description: "Manage Services and pricing packages",
        activePrefixes: ["/admin/services"],
        children: [
          {
            key: "service-packages",
            label: "Service Packages",
            route: "/admin/service-packages",
            icon: "packages",
            description: "Manage Service pricing packages",
            activePrefixes: ["/admin/service-packages"],
            children: [
              {
                key: "package-designs",
                label: "Package Designs",
                route: "/admin/package-designs",
                icon: "designs",
                description: "Manage selectable package designs",
                activePrefixes: ["/admin/package-designs"],
              },
            ],
          },
        ],
      },
      {
        key: "projects",
        label: "Projects",
        route: "/admin/projects",
        icon: "projects",
        description: "Manage projects and case studies",
        activePrefixes: ["/admin/projects"],
      },
      {
        key: "posts",
        label: "Blog / News",
        route: "/admin/posts",
        icon: "posts",
        description: "Manage Blog and News content",
        activePrefixes: ["/admin/posts"],
      },
      {
        key: "testimonials",
        label: "Testimonials",
        route: "/admin/testimonials",
        icon: "testimonials",
        description: "Manage testimonials",
        activePrefixes: ["/admin/testimonials"],
      },
      {
        key: "faqs",
        label: "FAQ",
        route: "/admin/faqs",
        icon: "faq",
        description: "Manage frequently asked questions",
        activePrefixes: ["/admin/faqs"],
      },
      {
        key: "media",
        label: "Media Library",
        route: "/admin/media",
        icon: "media",
        description: "Manage uploaded media",
        activePrefixes: ["/admin/media"],
      },
    ],
  },
  {
    key: "engagement",
    label: "Engagement",
    order: 30,
    items: [
      {
        key: "service-orders",
        label: "Service Orders",
        route: "/admin/service-orders",
        icon: "orders",
        description: "Manage customer Service Orders",
        activePrefixes: ["/admin/service-orders"],
      },
      {
        key: "appointments",
        label: "Consultations",
        route: "/admin/appointments",
        icon: "appointments",
        description: "Manage consultation requests and appointments",
        activePrefixes: ["/admin/appointments"],
      },
      {
        key: "contact-messages",
        label: "Contact Messages",
        route: "/admin/contact-messages",
        icon: "messages",
        description: "Review incoming Contact Messages",
        activePrefixes: ["/admin/contact-messages"],
      },
      {
        key: "leads",
        label: "Leads / CRM",
        route: "/admin/leads",
        icon: "leads",
        description: "Manage CRM Leads and opportunities",
        activePrefixes: ["/admin/leads"],
      },
      {
        key: "subscribers",
        label: "Newsletter Subscribers",
        route: "/admin/subscribers",
        icon: "subscribers",
        description: "Manage newsletter subscribers",
        activePrefixes: ["/admin/subscribers"],
      },
    ],
  },
  {
    key: "people",
    label: "People",
    order: 40,
    items: [
      {
        key: "clients-partners",
        label: "Clients & Partners",
        route: "/admin/clients-partners",
        icon: "companies",
        description: "Manage Clients and Partners",
        activePrefixes: ["/admin/clients-partners"],
      },
      {
        key: "team-members",
        label: "Team",
        route: "/admin/team",
        icon: "team",
        description: "Manage Team Members",
        activePrefixes: ["/admin/team"],
      },
      {
        key: "skills",
        label: "Skills",
        route: "/admin/skills",
        icon: "skills",
        description: "Manage Skills",
        activePrefixes: ["/admin/skills"],
      },
      {
        key: "education",
        label: "Education",
        route: "/admin/education",
        icon: "education",
        description: "Manage Education records",
        activePrefixes: ["/admin/education"],
      },
      {
        key: "experience",
        label: "Experience",
        route: "/admin/experience",
        icon: "experience",
        description: "Manage Experience records",
        activePrefixes: ["/admin/experience"],
      },
      {
        key: "achievements",
        label: "Certifications",
        route: "/admin/achievements",
        icon: "achievements",
        description: "Manage Certifications and Achievements",
        activePrefixes: ["/admin/achievements"],
      },
    ],
  },
  {
    key: "system",
    label: "System",
    order: 50,
    items: [
      {
        key: "site-settings",
        label: "Site Settings",
        route: "/admin/site-settings",
        icon: "settings",
        description: "Manage public Site Settings and Navigation",
        activePrefixes: ["/admin/site-settings"],
      },
      {
        key: "companies",
        label: "Company Menu",
        route: "/admin/companies",
        icon: "companies",
        description: "Manage Companies dropdown links",
        activePrefixes: ["/admin/companies"],
      },
      {
        key: "statistics",
        label: "Statistics",
        route: "/admin/statistics",
        icon: "statistics",
        description: "Manage public Statistics",
        activePrefixes: ["/admin/statistics"],
      },
      {
        key: "audit-log",
        label: "Activity Log",
        route: "/admin/audit-logs",
        icon: "audit",
        description: "Review security and administration activity",
        roles: ["super-admin"],
        activePrefixes: ["/admin/audit-logs"],
      },
    ],
  },
];

function normalizePathname(pathname) {
  if (typeof pathname !== "string" || pathname.length === 0) {
    return "/";
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "");
  }

  return pathname;
}

function matchesPrefix(pathname, prefix) {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedPrefix = normalizePathname(prefix);

  return (
    normalizedPathname === normalizedPrefix ||
    normalizedPathname.startsWith(`${normalizedPrefix}/`)
  );
}

function isAdminNavigationItemVisible(item, role) {
  if (!Array.isArray(item?.roles) || item.roles.length === 0) {
    return true;
  }

  return typeof role === "string" && item.roles.includes(role);
}

function isAdminNavigationItemActive(item, pathname) {
  if (!item || typeof item !== "object") {
    return false;
  }

  const prefixes =
    Array.isArray(item.activePrefixes) && item.activePrefixes.length > 0
      ? item.activePrefixes
      : item.route
        ? [item.route]
        : [];

  return prefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

function hasActiveAdminNavigationDescendant(item, pathname) {
  if (!Array.isArray(item?.children) || item.children.length === 0) {
    return false;
  }

  return item.children.some(
    (child) =>
      isAdminNavigationItemActive(child, pathname) ||
      hasActiveAdminNavigationDescendant(child, pathname),
  );
}

function isAdminNavigationBranchActive(item, pathname) {
  return (
    isAdminNavigationItemActive(item, pathname) ||
    hasActiveAdminNavigationDescendant(item, pathname)
  );
}

function filterAdminNavigationItems(items, role) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => isAdminNavigationItemVisible(item, role))
    .map((item) => ({
      ...item,
      children: Array.isArray(item.children)
        ? filterAdminNavigationItems(item.children, role)
        : undefined,
    }));
}

function getAdminNavigationGroupsForRole(role) {
  return ADMIN_NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: filterAdminNavigationItems(group.items, role),
  }))
    .filter((group) => group.items.length > 0)
    .sort((a, b) => a.order - b.order);
}

export {
  ADMIN_NAVIGATION_GROUPS,
  getAdminNavigationGroupsForRole,
  hasActiveAdminNavigationDescendant,
  isAdminNavigationBranchActive,
  isAdminNavigationItemActive,
  isAdminNavigationItemVisible,
};