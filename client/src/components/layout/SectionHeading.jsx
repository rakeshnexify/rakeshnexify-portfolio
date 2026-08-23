import PublicSectionHeader from "./PublicSectionHeader";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
  titleClassName = "",
  descriptionClassName = "",
}) {
  return (
    <PublicSectionHeader
      eyebrow={normalizeText(eyebrow)}
      title={normalizeText(title)}
      description={normalizeText(description)}
      align={align}
      className={className}
      titleClassName={`max-w-3xl text-[1.95rem] font-bold tracking-tight text-slate-950 sm:text-[2.35rem] lg:text-[2.75rem] ${titleClassName}`}
      descriptionClassName={`public-section-heading-description mt-4 max-w-2xl text-[0.98rem] leading-7 text-slate-600 sm:text-base ${descriptionClassName}`}
    />
  );
}

export default SectionHeading;
