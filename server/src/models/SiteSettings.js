import mongoose from "mongoose";
import { homepageSectionDefinitions } from "../config/homepageSections.js";

const buttonSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },
    url: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "RakeshNexify",
    },
    shortName: {
      type: String,
      trim: true,
      maxlength: 10,
      default: "RN",
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "Developer · Creator · Entrepreneur",
    },
    logoUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    faviconUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const ownerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Rakesh Pandit",
    },
    professionalTitle: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "MERN Stack Developer",
    },
    location: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "Kathmandu, Nepal",
    },
    profileImageUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    resumeUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const heroSchema = new mongoose.Schema(
  {
    eyebrow: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "MERN Stack Developer",
    },
    heading: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "I build modern digital experiences that help businesses grow.",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default:
        "I create responsive websites, MERN applications, e-commerce platforms and scalable digital solutions.",
    },
    primaryButton: {
      type: buttonSchema,
      default: () => ({
        label: "View Projects",
        url: "#projects",
      }),
    },
    secondaryButton: {
      type: buttonSchema,
      default: () => ({
        label: "Contact Me",
        url: "#contact",
      }),
    },
  },
  {
    _id: false,
  },
);

const aboutSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "About Me",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default:
        "I am a developer, creator and entrepreneur focused on building useful digital products and professional online experiences.",
    },
    highlights: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const listingSectionContentSchema = new mongoose.Schema(
  {
    eyebrow: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    heading: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: "",
    },

    ctaButton: {
      type: buttonSchema,
      default: () => ({}),
    },
  },
  {
    _id: false,
  },
);

const contactSectionContentSchema = new mongoose.Schema(
  {
    eyebrow: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    heading: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: "",
    },

    enquiryEyebrow: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    enquiryHeading: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    enquiryDescription: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const legalLinkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Legal link label is required."],
      trim: true,
      maxlength: [100, "Legal link label cannot exceed 100 characters."],
    },

    url: {
      type: String,
      trim: true,
      maxlength: [500, "Legal link URL cannot exceed 500 characters."],
      default: "",
    },

    isVisible: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      min: [0, "Legal link order cannot be negative."],
      default: 0,
    },
  },
  {
    _id: false,
  },
);

const footerSchema = new mongoose.Schema(
  {
    introduction: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    quickLinksHeading: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Quick Links",
    },

    servicesHeading: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Services",
    },

    platformsHeading: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "Platforms",
    },

    platformNote: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "Profiles without official URLs remain disabled.",
    },

    projectButton: {
      type: buttonSchema,
      default: () => ({
        label: "Start a project with me",
        url: "#contact",
      }),
    },

    legalLinks: {
      type: [legalLinkSchema],

      default: () => [
        {
          label: "Privacy Policy",
          url: "#privacy",
          isVisible: true,
          order: 1,
        },
        {
          label: "Terms",
          url: "#terms",
          isVisible: true,
          order: 2,
        },
      ],
    },

    copyrightText: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "All rights reserved.",
    },
  },
  {
    _id: false,
  },
);

const contactSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 150,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
    whatsapp: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "Kathmandu, Nepal",
    },
    availability: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "Available for freelance and business projects",
    },
  },
  {
    _id: false,
  },
);

const seoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 70,
      default: "RakeshNexify | MERN Stack Developer",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 180,
      default:
        "Official portfolio of RakeshNexify, showcasing MERN development, WordPress, e-commerce and business website services.",
    },
    keywords: {
      type: [String],
      default: [],
    },
    ogImageUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const sectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 50,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    /*
     * Homepage par section visible hoga ya nahi.
     */
    isVisible: {
      type: Boolean,
      default: true,
    },

    /*
     * Desktop aur mobile Navbar mein
     * menu item visible hoga ya nahi.
     */
    isNavigationVisible: {
      type: Boolean,
      default: true,
    },

    /*
     * Dedicated public page accessible
     * hogi ya nahi.
     *
     * Hero, About aur Contact jaise
     * section-only items mein ye field
     * ignore ki jayegi.
     */
    isPageVisible: {
      type: Boolean,
      default: true,
    },

    /*
     * Homepage section ka display order.
     */
    order: {
      type: Number,
      min: [0, "Section display order cannot be negative."],
      default: 0,
    },

    /*
     * Navbar menu ka independent order.
     */
    navigationOrder: {
      type: Number,
      min: [0, "Navigation order cannot be negative."],
      default: 0,
    },
  },
  {
    _id: false,
  },
);

const platformSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Platform name is required."],
      trim: true,
      maxlength: [80, "Platform name cannot exceed 80 characters."],
    },

    username: {
      type: String,
      trim: true,
      maxlength: [150, "Platform username cannot exceed 150 characters."],
      default: "",
    },

    url: {
      type: String,
      trim: true,
      maxlength: [500, "Platform URL cannot exceed 500 characters."],
      default: "",
    },

    isVisible: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      min: [0, "Platform display order cannot be negative."],
      default: 0,
    },
  },
  {
    _id: false,
  },
);

const defaultSocialPlatforms = [
  {
    name: "YouTube",
    username: "RakeshNexify",
    url: "",
    isVisible: true,
    order: 1,
  },
  {
    name: "LinkedIn",
    username: "Rakesh Pandit",
    url: "",
    isVisible: true,
    order: 2,
  },
  {
    name: "Instagram",
    username: "RakeshNexify",
    url: "",
    isVisible: true,
    order: 3,
  },
  {
    name: "Facebook",
    username: "RakeshNexify",
    url: "",
    isVisible: true,
    order: 4,
  },
  {
    name: "Threads",
    username: "RakeshNexify",
    url: "",
    isVisible: true,
    order: 5,
  },
  {
    name: "TikTok",
    username: "RakeshNexify",
    url: "",
    isVisible: true,
    order: 6,
  },
];

const defaultDeveloperPlatforms = [
  {
    name: "GitHub",
    username: "Rakesh-Pandit-Developer",
    url: "",
    isVisible: true,
    order: 1,
  },
  {
    name: "GitLab",
    username: "",
    url: "",
    isVisible: true,
    order: 2,
  },
  {
    name: "StackBlitz",
    username: "",
    url: "",
    isVisible: true,
    order: 3,
  },
  {
    name: "CodePen",
    username: "",
    url: "",
    isVisible: true,
    order: 4,
  },
];

const defaultFreelancerPlatforms = [
  {
    name: "Upwork",
    username: "",
    url: "",
    isVisible: true,
    order: 1,
  },
  {
    name: "Fiverr",
    username: "",
    url: "",
    isVisible: true,
    order: 2,
  },
  {
    name: "Freelancer",
    username: "",
    url: "",
    isVisible: true,
    order: 3,
  },
  {
    name: "PeoplePerHour",
    username: "",
    url: "",
    isVisible: true,
    order: 4,
  },
  {
    name: "Contra",
    username: "",
    url: "",
    isVisible: true,
    order: 5,
  },
];

function clonePlatformDefaults(platforms) {
  return platforms.map((platform) => ({
    ...platform,
  }));
}

const siteSettingsSchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
      lowercase: true,
      default: "main",
    },

    brand: {
      type: brandSchema,
      default: () => ({}),
    },

    owner: {
      type: ownerSchema,
      default: () => ({}),
    },

    hero: {
      type: heroSchema,
      default: () => ({}),
    },

    about: {
      type: aboutSchema,
      default: () => ({}),
    },

    statisticsSection: {
      type: listingSectionContentSchema,
      default: () => ({}),
    },

    skillsSection: {
      type: listingSectionContentSchema,
      default: () => ({}),
    },

    servicesSection: {
      type: listingSectionContentSchema,
      default: () => ({}),
    },

    projectsSection: {
      type: listingSectionContentSchema,
      default: () => ({}),
    },

    educationSection: {
      type: listingSectionContentSchema,
      default: () => ({}),
    },

    experienceSection: {
      type: listingSectionContentSchema,
      default: () => ({}),
    },

    achievementsSection: {
      type: listingSectionContentSchema,
      default: () => ({}),
    },

    teamSection: {
      type: listingSectionContentSchema,
      default: () => ({}),
    },

    companiesSection: {
      type: listingSectionContentSchema,
      default: () => ({}),
    },

    testimonialsSection: {
      type: listingSectionContentSchema,
      default: () => ({}),
    },

    faqSection: {
      type: listingSectionContentSchema,
      default: () => ({
        eyebrow: "Frequently Asked Questions",
        heading: "Answers to common questions",
        description:
          "Find quick answers about development, pricing, timelines, support and working together.",
        ctaButton: {
          label: "View All FAQs",
          url: "/faq",
        },
      }),
    },

    postsSection: {
      type: listingSectionContentSchema,
      default: () => ({}),
    },

    contactSection: {
      type: contactSectionContentSchema,
      default: () => ({}),
    },

    contact: {
      type: contactSchema,
      default: () => ({}),
    },

    seo: {
      type: seoSchema,
      default: () => ({}),
    },

    footer: {
      type: footerSchema,
      default: () => ({}),
    },

    socialPlatforms: {
      type: [platformSchema],

      default: () => clonePlatformDefaults(defaultSocialPlatforms),
    },

    developerPlatforms: {
      type: [platformSchema],

      default: () => clonePlatformDefaults(defaultDeveloperPlatforms),
    },

    freelancerPlatforms: {
      type: [platformSchema],

      default: () => clonePlatformDefaults(defaultFreelancerPlatforms),
    },

    sections: {
      type: [sectionSchema],

      default: () =>
        homepageSectionDefinitions.map((section) => ({
          ...section,
        })),
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "site_settings",
  },
);

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);

export default SiteSettings;
