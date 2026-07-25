function Section({
  children,
  className = "",
  id,
  as: Component = "section",
}) {
  return (
    <Component
      id={id}
      className={`py-16 sm:py-20 lg:py-24 ${className}`}
    >
      {children}
    </Component>
  );
}

export default Section;