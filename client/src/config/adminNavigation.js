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
        description: "Admin analytics and operational overview",
        activePrefixes: ["/admin/dashboard"],
      },
    ],
  },
  {
    key: "content",
    label: "Content",
    order: 20,
    items: [
      {
        key: "projects",
        label: "Projects",
        route: "/admin/projects",
        icon: "projects",
        description: "Manage projects and case-study publication",
        activePrefixes: ["/admin/projects"],
      },
      {
        key: "posts",
        label: "Blog & News",
        route: "/admin/posts",
        icon: "posts",
        description: "Manage blog and news posts",
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
        label: "Media",
        route: "/admin/media",
        icon: "media",
        description: "Manage uploaded media",
        activePrefixes: ["/admin/media"],
      },
      {
        key: "skills",
        label: "Skills",
        route: "/admin/skills",
        icon: "skills",
        description: "Manage skills",
        activePrefixes: ["/admin/skills"],
      },
      {
        key: "education",
        label: "Education",
        route: "/admin/education",
        icon: "education",
        description: "Manage education records",
        activePrefixes: ["/admin/education"],
      },
      {
        key: "experience",
        label: "Experience",
        route: "/admin/experience",
        icon: "experience",
        description: "Manage experience records",
        activePrefixes: ["/admin/experience"],
      },
      {
        key: "achievements",
        label: "Certifications & Achievements",
        route: "/admin/achievements",
        icon: "achievements",
        description: "Manage certifications, licenses, awards, and achievements",
        activePrefixes: ["/admin/achievements"],
      },
    ],
  },
  {
    key: "services-sales",
    label: "Services & Sales",
    order: 30,
    items: [
      {
        key: "services",
        label: "Services",
        route: "/admin/services",
        icon: "services",
        description: "Manage services",
        activePrefixes: ["/admin/services"],
      },
      {
        key: "service-packages",
        label: "Service Packages",
        route: "/admin/service-packages",
        icon: "packages",
        description: "Manage service pricing packages",
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
      {
        key: "service-orders",
        label: "Service Orders",
        route: "/admin/service-orders",
        icon: "orders",
        description: "Manage customer service orders",
        activePrefixes: ["/admin/service-orders"],
      },
      {
        key: "appointments",
        label: "Appointments / Consultations",
        route: "/admin/appointments",
        icon: "appointments",
        description: "Manage consultation requests and appointments",
        activePrefixes: ["/admin/appointments"],
      },
    ],
  },
  {
    key: "crm",
    label: "CRM",
    order: 40,
    items: [
      {
        key: "leads",
        label: "Leads / CRM",
        route: "/admin/leads",
        icon: "leads",
        description: "Manage CRM leads and opportunities",
        activePrefixes: ["/admin/leads"],
      },
      {
        key: "contact-messages",
        label: "Contact Messages",
        route: "/admin/contact-messages",
        icon: "messages",
        description: "Review incoming contact enquiries",
        activePrefixes: ["/admin/contact-messages"],
      },
      {
        key: "companies",
        label: "Companies",
        route: "/admin/companies",
        icon: "companies",
        description: "Manage companies, clients, and partners",
        activePrefixes: ["/admin/companies"],
      },
      {
        key: "subscribers",
        label: "Newsletter / Subscribers",
        route: "/admin/subscribers",
        icon: "subscribers",
        description: "Manage newsletter subscribers",
        activePrefixes: ["/admin/subscribers"],
      },
    ],
  },
  {
    key: "team",
    label: "Team",
    order: 50,
    items: [
      {
        key: "team-members",
        label: "Team Members",
        route: "/admin/team",
        icon: "team",
        description: "Manage team members",
        activePrefixes: ["/admin/team"],
      },
    ],
  },
  {
    key: "site",
    label: "Site",
    order: 60,
    items: [
      {
        key: "statistics",
        label: "Statistics",
        route: "/admin/statistics",
        icon: "statistics",
        description: "Manage public statistics",
        activePrefixes: ["/admin/statistics"],
      },
      {
        key: "site-settings",
        label: "Site Settings",
        route: "/admin/site-settings",
        icon: "settings",
        description: "Manage site settings and public menu/navigation",
        activePrefixes: ["/admin/site-settings"],
      },
    ],
  },
  {
    key: "system",
    label: "System",
    order: 70,
    items: [
      {
        key: "audit-log",
        label: "Admin Activity / Audit Log",
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
