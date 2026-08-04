import { Link } from "react-router";

const availabilityLabels = {
  available: "Available",
  limited: "Limited Availability",
  unavailable: "Unavailable",
  "on-leave": "On Leave",
};

const availabilityClasses = {
  available: "bg-emerald-100 text-emerald-700",
  limited: "bg-amber-100 text-amber-700",
  unavailable: "bg-slate-200 text-slate-700",
  "on-leave": "bg-violet-100 text-violet-700",
};

const statusLabels = {
  active: "Active Member",
  inactive: "Inactive",
  former: "Former Member",
  archived: "Archived",
};

const statusClasses = {
  active: "bg-blue-100 text-blue-700",
  inactive: "bg-slate-200 text-slate-700",
  former: "bg-amber-100 text-amber-700",
  archived: "bg-red-100 text-red-700",
};

const socialDefinitions = [
  {
    key: "github",
    label: "GitHub",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
  },
  {
    key: "facebook",
    label: "Facebook",
  },
  {
    key: "instagram",
    label: "Instagram",
  },
  {
    key: "youtube",
    label: "YouTube",
  },
  {
    key: "x",
    label: "X",
  },
];

function createInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "TM";
}

function getSafeExternalUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return url;
    }
  } catch {
    return "";
  }

  return "";
}

function normaliseTeamMember(teamMember = {}, index = 0) {
  const skills = Array.isArray(teamMember.skills) ? teamMember.skills : [];

  const tools = Array.isArray(teamMember.tools) ? teamMember.tools : [];

  const socialLinks =
    teamMember.socialLinks &&
    typeof teamMember.socialLinks === "object" &&
    !Array.isArray(teamMember.socialLinks)
      ? teamMember.socialLinks
      : {};

  const safeSocialLinks = socialDefinitions
    .map(({ key, label }) => ({
      key,
      label,
      url: getSafeExternalUrl(socialLinks[key]),
    }))
    .filter((socialLink) => socialLink.url);

  const numericOrder = Number(teamMember.order);

  return {
    id:
      teamMember._id ||
      teamMember.id ||
      teamMember.slug ||
      `team-member-${index + 1}`,

    name: teamMember.name || "Team Member",

    slug: teamMember.slug || "",

    professionalRole: teamMember.professionalRole || "Professional Team Member",

    teamPosition: teamMember.teamPosition || "",

    shortIntroduction: teamMember.shortIntroduction || "",

    profileImageUrl: teamMember.profileImageUrl || "",

    profileImageAlt:
      teamMember.profileImageAlt ||
      `${teamMember.name || "Team member"} profile photo`,

    coverImageUrl: teamMember.coverImageUrl || "",

    skills,

    tools,

    status: teamMember.status || "active",

    availabilityStatus: teamMember.availabilityStatus || "available",

    portfolioUrl: getSafeExternalUrl(teamMember.portfolioUrl),

    websiteUrl: getSafeExternalUrl(teamMember.websiteUrl),

    socialLinks: safeSocialLinks,

    featured: Boolean(teamMember.isFeatured ?? teamMember.featured),

    order: Number.isFinite(numericOrder) ? numericOrder : index,
  };
}

function ExternalAction({ href, children }) {
  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
    >
      {children}

      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="ml-2 size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 5h5v5" />
        <path d="M10 14 19 5" />
        <path d="M19 13v6H5V5h6" />
      </svg>
    </a>
  );
}

function TeamMemberCard({ teamMember, index = 0, compact = false }) {
  const normalisedTeamMember = normaliseTeamMember(teamMember, index);

  const availabilityLabel =
    availabilityLabels[normalisedTeamMember.availabilityStatus] ||
    normalisedTeamMember.availabilityStatus ||
    "Availability Unknown";

  const statusLabel =
    statusLabels[normalisedTeamMember.status] ||
    normalisedTeamMember.status ||
    "Team Member";

  const visibleSkills = compact
    ? normalisedTeamMember.skills.slice(0, 5)
    : normalisedTeamMember.skills.slice(0, 8);

  const visibleTools = compact
    ? normalisedTeamMember.tools.slice(0, 4)
    : normalisedTeamMember.tools.slice(0, 6);

  const visibleSocialLinks = compact
    ? normalisedTeamMember.socialLinks.slice(0, 4)
    : normalisedTeamMember.socialLinks;

  const externalProfileUrl =
    normalisedTeamMember.portfolioUrl || normalisedTeamMember.websiteUrl;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative min-w-0 overflow-hidden bg-slate-950 px-6 py-8 sm:px-8">
        {normalisedTeamMember.coverImageUrl && (
          <img
            src={normalisedTeamMember.coverImageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-30 transition duration-500 group-hover:scale-105"
          />
        )}

        {normalisedTeamMember.coverImageUrl && (
          <div className="absolute inset-0 bg-slate-950/75" />
        )}

        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="absolute -bottom-16 left-10 size-40 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex min-w-0 items-start justify-between gap-5">
          {normalisedTeamMember.profileImageUrl ? (
            <div className="size-20 shrink-0 overflow-hidden rounded-3xl border-2 border-white/20 bg-white shadow-lg">
              <img
                src={normalisedTeamMember.profileImageUrl}
                alt={normalisedTeamMember.profileImageAlt}
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="grid size-20 shrink-0 place-items-center rounded-3xl border border-white/10 bg-white/10 text-2xl font-extrabold text-white">
              {createInitials(normalisedTeamMember.name)}
            </div>
          )}

          <div className="flex shrink-0 flex-col items-end gap-3">
            <span className="text-4xl font-black tracking-tight text-white/10">
              {String(index + 1).padStart(2, "0")}
            </span>

            {normalisedTeamMember.featured && (
              <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                Featured
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-8 min-w-0">
          <p className="break-words text-sm font-semibold text-cyan-300">
            {normalisedTeamMember.professionalRole}
          </p>

          <h3 className="mt-2 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {normalisedTeamMember.name}
          </h3>

          {normalisedTeamMember.teamPosition && (
            <p className="mt-3 break-words text-sm font-medium text-slate-300">
              {normalisedTeamMember.teamPosition}
            </p>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-8">
        <div className="flex min-w-0 flex-wrap gap-2">
          <span
            className={`max-w-full break-words rounded-full px-3 py-1.5 text-xs font-semibold ${
              availabilityClasses[normalisedTeamMember.availabilityStatus] ||
              "bg-slate-200 text-slate-700"
            }`}
          >
            {availabilityLabel}
          </span>

          <span
            className={`max-w-full break-words rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusClasses[normalisedTeamMember.status] ||
              "bg-slate-200 text-slate-700"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {normalisedTeamMember.shortIntroduction && (
          <p className="mt-5 break-words leading-7 text-slate-600">
            {normalisedTeamMember.shortIntroduction}
          </p>
        )}

        {visibleSkills.length > 0 && (
          <div className="mt-6 min-w-0">
            <p className="text-sm font-bold text-slate-950">Main skills</p>

            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
              {visibleSkills.map((skill, skillIndex) => (
                <span
                  key={`${normalisedTeamMember.id}-${skill}-${skillIndex}`}
                  className="max-w-full break-words rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {!compact && visibleTools.length > 0 && (
          <div className="mt-6 min-w-0 border-t border-slate-200 pt-6">
            <p className="text-sm font-bold text-slate-950">
              Tools and technologies
            </p>

            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
              {visibleTools.map((tool, toolIndex) => (
                <span
                  key={`${normalisedTeamMember.id}-${tool}-${toolIndex}`}
                  className="max-w-full break-words rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {visibleSocialLinks.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-sm font-bold text-slate-950">
              Professional profiles
            </p>

            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
              {visibleSocialLinks.map((socialLink) => (
                <a
                  key={`${normalisedTeamMember.id}-${socialLink.key}`}
                  href={socialLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${normalisedTeamMember.name}'s ${socialLink.label} profile`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
                >
                  {socialLink.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex min-w-0 flex-col gap-3 pt-8 sm:flex-row sm:flex-wrap">
          {normalisedTeamMember.slug && (
            <Link
              to={`/team/${encodeURIComponent(normalisedTeamMember.slug)}`}
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-brand-600 bg-white px-4 py-2.5 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              View Team Profile
            </Link>
          )}

          <ExternalAction href={externalProfileUrl}>
            Visit Portfolio
          </ExternalAction>
        </div>
      </div>
    </article>
  );
}

export default TeamMemberCard;
