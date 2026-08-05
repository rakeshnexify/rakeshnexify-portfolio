const proficiencyDetails = {
  familiar: {
    label: "Familiar",
    level: 1,
    badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
    activeBarClass: "bg-slate-500",
    glowClass: "from-slate-500/15",
  },
  proficient: {
    label: "Proficient",
    level: 2,
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    activeBarClass: "bg-blue-500",
    glowClass: "from-blue-500/15",
  },
  advanced: {
    label: "Advanced",
    level: 3,
    badgeClass: "border-violet-200 bg-violet-50 text-violet-700",
    activeBarClass: "bg-violet-500",
    glowClass: "from-violet-500/15",
  },
  expert: {
    label: "Expert",
    level: 4,
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    activeBarClass: "bg-emerald-500",
    glowClass: "from-emerald-500/15",
  },
};

function createSkillInitials(value) {
  const initials = String(value || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "SK";
}

function normaliseSkill(skill = {}, index = 0) {
  const numericExperience = Number(skill.yearsOfExperience);

  const hasExperience =
    skill.yearsOfExperience !== null &&
    skill.yearsOfExperience !== undefined &&
    skill.yearsOfExperience !== "" &&
    Number.isFinite(numericExperience);

  return {
    id: skill._id || skill.id || skill.slug || `skill-${index + 1}`,
    name: String(skill.name || "").trim() || "Professional Skill",
    shortName: String(skill.shortName || "").trim(),
    description: String(skill.description || "").trim(),
    category: String(skill.category || "").trim() || "Other",
    proficiencyLevel:
      String(skill.proficiencyLevel || "")
        .trim()
        .toLowerCase() || "familiar",
    yearsOfExperience: hasExperience ? numericExperience : null,
    icon: String(skill.icon || "").trim(),
    iconUrl: String(skill.iconUrl || "").trim(),
    featured: Boolean(skill.isFeatured ?? skill.featured),
  };
}

function formatExperience(value) {
  if (value === null) {
    return "Experience not specified";
  }

  const formattedValue = Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(1)));

  return `${formattedValue} ${value === 1 ? "year" : "years"} experience`;
}

function SkillIcon({ skill }) {
  const fallbackText =
    skill.icon && skill.icon.length <= 5
      ? skill.icon
      : createSkillInitials(skill.name);

  return (
    <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-900 shadow-sm ring-4 ring-slate-100">
      <span aria-hidden="true">{fallbackText}</span>

      {skill.iconUrl && (
        <img
          src={skill.iconUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full bg-white object-contain p-3"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
    </div>
  );
}

function ProficiencyScale({ details }) {
  return (
    <div
      className="grid grid-cols-4 gap-1.5"
      aria-label={`${details.label} proficiency level`}
      role="img"
    >
      {[1, 2, 3, 4].map((level) => (
        <span
          key={level}
          className={`h-1.5 rounded-full transition duration-300 ${
            level <= details.level
              ? details.activeBarClass
              : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function SkillCard({ skill, index = 0, compact = false }) {
  const normalisedSkill = normaliseSkill(skill, index);

  const proficiencyDetailsForSkill =
    proficiencyDetails[normalisedSkill.proficiencyLevel] ||
    proficiencyDetails.familiar;

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${proficiencyDetailsForSkill.glowClass} to-transparent opacity-80`}
      />

      <div className="relative flex min-w-0 flex-1 flex-col p-6 sm:p-7">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <SkillIcon skill={normalisedSkill} />

          <div className="flex min-w-0 flex-col items-end gap-2">
            {normalisedSkill.featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="currentColor"
                >
                  <path d="m12 2.75 2.72 5.51 6.08.88-4.4 4.29 1.04 6.05L12 16.62l-5.44 2.86 1.04-6.05-4.4-4.29 6.08-.88L12 2.75Z" />
                </svg>
                Featured
              </span>
            )}

            <span className="max-w-36 truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              {normalisedSkill.category}
            </span>
          </div>
        </div>

        <div className="mt-7 min-w-0">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="break-words text-2xl font-black tracking-tight text-slate-950">
              {normalisedSkill.name}
            </h3>

            {normalisedSkill.shortName && (
              <span className="break-words text-sm font-bold text-brand-600">
                {normalisedSkill.shortName}
              </span>
            )}
          </div>

          {normalisedSkill.description && (
            <p
              className={`mt-4 break-words text-sm leading-7 text-slate-600 ${
                compact ? "line-clamp-3" : "line-clamp-4"
              }`}
            >
              {normalisedSkill.description}
            </p>
          )}
        </div>

        <div className="mt-auto pt-7">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Proficiency
                </p>

                <p className="mt-1 truncate text-sm font-bold text-slate-800">
                  {proficiencyDetailsForSkill.label}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${proficiencyDetailsForSkill.badgeClass}`}
              >
                Level {proficiencyDetailsForSkill.level} of 4
              </span>
            </div>

            <div className="mt-3">
              <ProficiencyScale details={proficiencyDetailsForSkill} />
            </div>
          </div>

          <div className="mt-4 flex min-w-0 items-center gap-3 text-sm font-semibold text-slate-500">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
                <path d="M8 14h.01" />
                <path d="M12 14h.01" />
                <path d="M16 14h.01" />
              </svg>
            </span>

            <span className="min-w-0 break-words">
              {formatExperience(normalisedSkill.yearsOfExperience)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default SkillCard;
