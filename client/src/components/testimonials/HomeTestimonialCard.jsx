function cleanText(value) {
  return String(value ?? "").trim();
}

function getSafeHttpUrl(value) {
  const url = cleanText(value);

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

function createInitials(value) {
  const initials = cleanText(value)
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CL";
}

function normalizeRating(value) {
  const rating = Number(value);

  if (!Number.isInteger(rating)) {
    return 0;
  }

  return Math.max(0, Math.min(5, rating));
}

function QuoteIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      fill="none"
    >
      <path
        d="M13.1 7.1c-4.9 2.2-7.4 5.6-7.4 10.3 0 4.2 2.2 7.2 5.8 7.2 3.1 0 5.3-2.1 5.3-5.1 0-2.8-1.9-4.7-4.5-4.7-.8 0-1.5.1-2 .4.5-2.1 2-4 4.6-5.6l-1.8-2.5Zm13.4 0c-4.9 2.2-7.4 5.6-7.4 10.3 0 4.2 2.2 7.2 5.8 7.2 3.1 0 5.3-2.1 5.3-5.1 0-2.8-1.9-4.7-4.5-4.7-.8 0-1.5.1-2 .4.5-2.1 2-4 4.6-5.6l-1.8-2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HomeTestimonialCard({ testimonial }) {
  const clientName = cleanText(testimonial?.clientName) || "Client";
  const clientRole = cleanText(testimonial?.clientRole);
  const companyName = cleanText(testimonial?.companyName);
  const reviewText = cleanText(testimonial?.reviewText);
  const rating = normalizeRating(testimonial?.rating);
  const profileImageUrl = getSafeHttpUrl(testimonial?.profileImageUrl);
  const profileImageAlt =
    cleanText(testimonial?.profileImageAlt) || `${clientName} profile`;
  const companyWebsiteUrl = getSafeHttpUrl(
    testimonial?.companyWebsiteUrl,
  );

  return (
    <article
      className="rnx-home-testimonial-card"
      data-featured={testimonial?.isFeatured ? "true" : "false"}
    >
      <div className="rnx-home-testimonial-card-topline">
        <span
          className="rnx-home-testimonial-quote"
          aria-hidden="true"
        >
          <QuoteIcon />
        </span>

        {rating > 0 && (
          <span
            className="rnx-home-testimonial-rating"
            aria-label={`${rating} out of 5 stars`}
          >
            <span aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <span
                  key={index}
                  data-filled={index < rating ? "true" : "false"}
                >
                  ★
                </span>
              ))}
            </span>
          </span>
        )}
      </div>

      {reviewText && (
        <blockquote className="rnx-home-testimonial-review">
          {reviewText}
        </blockquote>
      )}

      <div className="rnx-home-testimonial-divider" aria-hidden="true" />

      <footer className="rnx-home-testimonial-client">
        <div className="rnx-home-testimonial-avatar">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={profileImageAlt}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          ) : (
            <span>{createInitials(clientName)}</span>
          )}
        </div>

        <div className="rnx-home-testimonial-client-copy">
          <p className="rnx-home-testimonial-name">{clientName}</p>

          {(clientRole || companyName) && (
            <p className="rnx-home-testimonial-meta">
              {clientRole && <span>{clientRole}</span>}
              {clientRole && companyName && (
                <span aria-hidden="true">, </span>
              )}
              {companyName && companyWebsiteUrl ? (
                <a
                  href={companyWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {companyName}
                  <span className="sr-only"> opens in a new tab</span>
                </a>
              ) : (
                companyName && <span>{companyName}</span>
              )}
            </p>
          )}
        </div>
      </footer>
    </article>
  );
}

export default HomeTestimonialCard;
