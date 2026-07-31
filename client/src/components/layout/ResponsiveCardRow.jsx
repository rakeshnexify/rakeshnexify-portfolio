import { Children } from "react";

const desktopColumnClasses = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

function ResponsiveCardRow({
  children,
  desktopColumns = 3,
  ariaLabel = "Scrollable cards",
  className = "",
}) {
  const cards = Children.toArray(children);

  if (cards.length === 0) {
    return null;
  }

  const desktopGridClass =
    desktopColumnClasses[desktopColumns] || desktopColumnClasses[3];

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      tabIndex={cards.length > 1 ? 0 : undefined}
      className={`flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:snap-none lg:overflow-visible lg:pb-0 ${desktopGridClass} ${className}`}
    >
      {cards.map((card, index) => (
        <div
          key={card.key || `responsive-card-${index}`}
          className="h-full min-w-[88%] snap-start sm:min-w-[48%] lg:min-w-0"
        >
          {card}
        </div>
      ))}
    </div>
  );
}

export default ResponsiveCardRow;
