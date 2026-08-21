const publicPageCtas = {
  blog: {
    eyebrow: "RakeshNexify",
    title: "Need help with a website or MERN application?",
    buttonLabel: "Contact Me",
    url: "/#contact",
  },
  certificationAchievements: {
    eyebrow: "Verified Growth",
    title: "Need a developer focused on practical, proven capability?",
    buttonLabel: "Start a Conversation",
    url: "/#contact",
  },
  clientsPartners: {
    eyebrow: "Work Together",
    title: "Looking for a development partner for your next digital project?",
    buttonLabel: "Start a Conversation",
    url: "/#contact",
  },
  companies: {
    eyebrow: "Business Collaboration",
    title: "Need a website, e-commerce platform or development partnership?",
    buttonLabel: "Start a Conversation",
    url: "/#contact",
  },
  companyDetails: {
    eyebrow: "Business Collaboration",
    title: "Need a professional digital solution for your business?",
    buttonLabel: "Discuss Your Business",
    url: "/#contact",
  },
  education: {
    eyebrow: "Knowledge Into Practice",
    title: "Looking for practical development skills backed by continuous learning?",
    buttonLabel: "Start a Conversation",
    url: "/#contact",
  },
  experience: {
    eyebrow: "Practical Experience",
    title: "Looking for practical project and business experience?",
    buttonLabel: "Start a Conversation",
    url: "/#contact",
  },
  postDetails: {
    eyebrow: "Need Development Help?",
    title: "Discuss your next website or application.",
    buttonLabel: "Contact Me",
    url: "/#contact",
  },
  projectDetails: {
    eyebrow: "Start Your Project",
    title: "Need a professional website or web application?",
    buttonLabel: "Discuss Your Project",
    url: "/#contact",
  },
  projects: {
    eyebrow: "Custom Development",
    title: "Need a professional website or web application?",
    buttonLabel: "Start Your Project",
    url: "/#contact",
  },
  services: {
    eyebrow: "Custom Requirements",
    title: "Need a customised package for your business?",
    buttonLabel: "Start Your Project",
    url: "/#contact",
  },
  skills: {
    eyebrow: "Build With the Right Technology",
    title: "Need a website or application using a specific technology?",
    buttonLabel: "Start a Conversation",
    url: "/#contact",
  },
  teamMemberDetails: {
    eyebrow: "Work With Our Team",
    title: "Need the right skills for your website or application?",
    buttonLabel: "Discuss Your Project",
    url: "/#contact",
  },
  team: {
    eyebrow: "Work With Our Team",
    title: "Need a professional team for your website or application?",
    buttonLabel: "Start a Conversation",
    url: "/#contact",
  },
  testimonials: {
    eyebrow: "Start Your Project",
    title: "Ready to build something valuable together?",
    buttonLabel: "Start a Project",
    url: "/#contact",
  },
};

export function getPublicPageCta(ctaKey) {
  return publicPageCtas[ctaKey] || null;
}

export default publicPageCtas;
