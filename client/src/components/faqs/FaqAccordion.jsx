function FaqAccordionItem({
  faq,
  compact = false,
  homePreview = false,
  index = 0,
}) {
  const question = String(faq?.question || "").trim();
  const answer = String(faq?.answer || "").trim();
  const category = String(faq?.category || "").trim();

  if (!question || !answer) {
    return null;
  }

  if (homePreview) {
    return (
      <details
        className="public-faq-item"
        defaultOpen={index === 2}
      >
        <summary className="public-faq-summary">
          <span className="public-faq-question-icon" aria-hidden="true">
            ?
          </span>

          <span className="public-faq-question">{question}</span>

          <span className="public-faq-toggle" aria-hidden="true">
            <span className="public-faq-toggle-plus">+</span>
            <span className="public-faq-toggle-minus">&minus;</span>
          </span>
        </summary>

        <div className="public-faq-answer">
          <p>{answer}</p>
        </div>
      </details>
    );
  }

  return (
    <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm open:border-brand-200 open:shadow-md">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-100 sm:px-6">
        <span className="min-w-0">
          {(category || faq?.isFeatured) && (
            <span className="mb-2 flex flex-wrap gap-2">
              {category && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  {category}
                </span>
              )}

              {faq?.isFeatured && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                  Featured
                </span>
              )}
            </span>
          )}

          <span
            className={`block break-words font-black text-slate-950 ${
              compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"
            }`}
          >
            {question}
          </span>
        </span>

        <span
          aria-hidden="true"
          className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-lg font-black text-brand-600 transition group-open:rotate-45"
        >
          +
        </span>
      </summary>

      <div className="border-t border-slate-100 px-5 py-5 sm:px-6">
        <p
          className={`whitespace-pre-line break-words text-slate-600 ${
            compact ? "text-sm leading-7" : "leading-8"
          }`}
        >
          {answer}
        </p>
      </div>
    </details>
  );
}

function FaqAccordion({
  faqs = [],
  compact = false,
  emptyMessage = "No FAQs available.",
  homePreview = false,
}) {
  const items = Array.isArray(faqs) ? faqs : [];

  if (items.length === 0) {
    return (
      <div
        className={
          homePreview
            ? "public-faq-empty"
            : "rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm"
        }
      >
        <div
          className={
            homePreview
              ? "public-faq-empty-icon"
              : "mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600"
          }
        >
          ?
        </div>

        <p
          className={
            homePreview
              ? "public-faq-empty-copy"
              : "mt-5 font-bold text-slate-950"
          }
        >
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={homePreview ? "public-faq-accordion" : "space-y-4"}>
      {items.map((faq, index) => (
        <FaqAccordionItem
          key={faq?._id || `${faq?.question || "faq"}-${index}`}
          faq={faq}
          compact={compact}
          homePreview={homePreview}
          index={index}
        />
      ))}
    </div>
  );
}

export default FaqAccordion;
