const siteSettingsPageDefinitions = [
  {
    key: "brand",
    title: "Brand Identity",
    shortTitle: "Brand",
    description:
      "Manage the website name, short logo text, tagline, logo and favicon.",
    path: "/admin/site-settings/brand",
  },
  {
    key: "owner",
    title: "Owner Profile",
    shortTitle: "Owner",
    description:
      "Manage the portfolio owner name, professional title, location, image and resume.",
    path: "/admin/site-settings/owner",
  },
  {
    key: "hero",
    title: "Hero Section",
    shortTitle: "Hero",
    description:
      "Manage the homepage Hero heading, introduction and action buttons.",
    path: "/admin/site-settings/hero",
  },
  {
    key: "about",
    title: "About Section",
    shortTitle: "About",
    description:
      "Manage the About heading, description and professional highlights.",
    path: "/admin/site-settings/about",
  },
  {
    key: "listing-sections",
    title: "Listing Sections",
    shortTitle: "Section Content",
    description:
      "Manage Statistics, Skills, Services, Projects, Case Studies, Education, Experience, Certifications & Achievements, Team, Clients & Partners, Testimonials, FAQ and article section headings and buttons.",
    path: "/admin/site-settings/listing-sections",
  },
  {
    key: "contact",
    title: "Contact Settings",
    shortTitle: "Contact",
    description:
      "Manage Contact section content, email, phone, WhatsApp and availability.",
    path: "/admin/site-settings/contact",
  },
  {
    key: "platforms",
    title: "Platform Profiles",
    shortTitle: "Platforms",
    description:
      "Manage social media, developer and freelancer platform profiles.",
    path: "/admin/site-settings/platforms",
  },
  {
    key: "navigation",
    title: "Navigation & Public Pages",
    shortTitle: "Navigation",
    description:
      "Control homepage sections, Navbar labels, visibility, order and public pages.",
    path: "/admin/site-settings/navigation",
  },
  {
    key: "footer",
    title: "Footer Settings",
    shortTitle: "Footer",
    description:
      "Manage Footer content, column headings, project button and legal links.",
    path: "/admin/site-settings/footer",
  },
  {
    key: "seo",
    title: "SEO Settings",
    shortTitle: "SEO",
    description:
      "Manage search-engine title, description, keywords and sharing image.",
    path: "/admin/site-settings/seo",
  },
  {
    key: "publication",
    title: "Publication Status",
    shortTitle: "Publication",
    description:
      "Publish or temporarily disable the complete public portfolio website.",
    path: "/admin/site-settings/publication",
  },
];

const siteSettingsPageByKey = Object.fromEntries(
  siteSettingsPageDefinitions.map((page) => [page.key, page]),
);

function getSiteSettingsPage(pageKey) {
  const normalizedKey = String(pageKey || "")
    .trim()
    .toLowerCase();

  return siteSettingsPageByKey[normalizedKey] || null;
}

export {
  getSiteSettingsPage,
  siteSettingsPageByKey,
  siteSettingsPageDefinitions,
};

export default siteSettingsPageDefinitions;
