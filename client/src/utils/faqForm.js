const defaultFaqFormValues = {
  question: "",
  answer: "",
  category: "General",
  order: "0",
  isFeatured: false,
  isVisible: true,
};

function createFaqFormValues(faq = {}) {
  return {
    question: String(faq.question || ""),
    answer: String(faq.answer || ""),
    category: String(faq.category || "General"),
    order: String(faq.order ?? 0),
    isFeatured: Boolean(faq.isFeatured),
    isVisible: faq.isVisible !== false,
  };
}

function createFaqPayload(values) {
  return {
    question: String(values.question || "").trim(),
    answer: String(values.answer || "").trim(),
    category: String(values.category || "").trim(),
    order: Number(values.order),
    isFeatured: Boolean(values.isFeatured),
    isVisible: Boolean(values.isVisible),
  };
}

function validateFaqForm(values) {
  const errors = {};

  const question = String(values.question || "").trim();
  const answer = String(values.answer || "").trim();
  const category = String(values.category || "").trim();
  const orderText = String(values.order ?? "").trim();

  if (question.length < 5 || question.length > 300) {
    errors.question = "Question must contain 5 to 300 characters.";
  }

  if (answer.length < 10 || answer.length > 5000) {
    errors.answer = "Answer must contain 10 to 5000 characters.";
  }

  if (category.length < 2 || category.length > 80) {
    errors.category = "Category must contain 2 to 80 characters.";
  }

  if (!/^\d+$/.test(orderText)) {
    errors.order = "Display order must be a whole number from 0 to 1000000.";
  } else {
    const order = Number(orderText);

    if (
      !Number.isSafeInteger(order) ||
      order < 0 ||
      order > 1000000
    ) {
      errors.order = "Display order must be a whole number from 0 to 1000000.";
    }
  }

  return errors;
}

export {
  createFaqFormValues,
  createFaqPayload,
  defaultFaqFormValues,
  validateFaqForm,
};
