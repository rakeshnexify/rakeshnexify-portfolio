import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import LeadForm from "../../components/admin/leads/LeadForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  addAdminLeadNote,
  createAdminLead,
  fetchAdminLeadById,
  updateAdminLead,
} from "../../services/adminLeadsApi";
import { fetchAdminServices } from "../../services/adminServicesApi";
import {
  createLeadFormState,
  createLeadPayload,
  initialLeadForm,
  mergeLeadFieldErrors,
  validateLeadForm,
} from "../../utils/leadForm";

function AdminLeadEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: leadId } = useParams();

  const { accessToken, admin, logout } = useAdminAuth();

  const isEditMode = mode === "edit";

  const [lead, setLead] = useState(null);

  const [form, setForm] = useState({
    ...initialLeadForm,
  });

  const [serviceOptions, setServiceOptions] = useState([]);

  const [fieldErrors, setFieldErrors] = useState({});

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadError, setLoadError] = useState("");

  const [submitError, setSubmitError] = useState("");

  const [noteText, setNoteText] = useState("");

  const [noteError, setNoteError] = useState("");

  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadEditorData() {
      try {
        setIsLoading(true);
        setLoadError("");

        const [leadData, servicesResponse] = await Promise.all([
          isEditMode
            ? fetchAdminLeadById(accessToken, leadId, {
                signal: controller.signal,
              })
            : Promise.resolve(null),

          fetchAdminServices(
            accessToken,
            {},
            {
              signal: controller.signal,
            },
          ),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        const services = Array.isArray(servicesResponse?.services)
          ? servicesResponse.services
          : [];

        setServiceOptions(
          [...services].sort((firstService, secondService) =>
            String(firstService?.title || firstService?.slug || "").localeCompare(
              String(secondService?.title || secondService?.slug || ""),
            ),
          ),
        );

        if (isEditMode) {
          setLead(leadData);
          setForm(createLeadFormState(leadData));

          return;
        }

        setLead(null);
        setForm({
          ...initialLeadForm,
        });
      } catch (error) {
        if (
          controller.signal.aborted ||
          error?.name === "AbortError"
        ) {
          return;
        }

        if (error?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: isEditMode
                  ? `/admin/leads/${leadId}/edit`
                  : "/admin/leads/new",
              },
            },
          });

          return;
        }

        console.error("Admin Lead editor loading failed:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Lead editor data could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadEditorData();

    return () => {
      controller.abort();
    };
  }, [accessToken, isEditMode, leadId, logout, navigate]);

  const adminOptions = useMemo(() => {
    const options = [];

    const addAdminOption = (candidate) => {
      if (!candidate || typeof candidate !== "object") {
        return;
      }

      const candidateId = candidate._id || candidate.id;

      if (!candidateId) {
        return;
      }

      if (
        options.some(
          (currentOption) => String(currentOption._id) === String(candidateId),
        )
      ) {
        return;
      }

      options.push({
        _id: String(candidateId),
        name: candidate.name || "",
        email: candidate.email || "",
        role: candidate.role || "",
      });
    };

    addAdminOption(lead?.assignedTo);
    addAdminOption(admin);

    return options;
  }, [admin, lead]);

  function handleFieldChange(fieldName, value) {
    setForm((currentForm) => {
      if (fieldName === "status" && value !== "lost") {
        return {
          ...currentForm,
          status: value,
          lostReason: "",
        };
      }

      if (fieldName === "service") {
        const selectedService = serviceOptions.find(
          (service) => String(service?._id || "") === String(value || ""),
        );

        if (!value) {
          return {
            ...currentForm,
            service: "",
          };
        }

        if (selectedService) {
          return {
            ...currentForm,
            service: value,
            serviceSlug: selectedService.slug || "",
            serviceTitle: selectedService.title || "",
          };
        }
      }

      return {
        ...currentForm,
        [fieldName]: value,
      };
    });

    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = {
        ...currentErrors,
      };

      delete nextErrors[fieldName];

      if (fieldName === "status" && value !== "lost") {
        delete nextErrors.lostReason;
      }

      if (fieldName === "service") {
        delete nextErrors.serviceSlug;
        delete nextErrors.serviceTitle;
      }

      return nextErrors;
    });

    setSubmitError("");
  }

  function handleAuthenticationError(error) {
    if (error?.status !== 401) {
      return false;
    }

    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: isEditMode
            ? `/admin/leads/${leadId}/edit`
            : "/admin/leads/new",
        },
      },
    });

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const clientErrors = validateLeadForm(form);

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setSubmitError(
        "Please correct the highlighted Lead fields before saving.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setSubmitError("");

      const leadPayload = createLeadPayload(form);

      const response = isEditMode
        ? await updateAdminLead(accessToken, leadId, leadPayload)
        : await createAdminLead(accessToken, leadPayload);

      navigate("/admin/leads", {
        replace: true,
        state: {
          successMessage:
            response.message ||
            (isEditMode
              ? "Lead updated successfully."
              : "Lead created successfully."),
        },
      });
    } catch (error) {
      if (handleAuthenticationError(error)) {
        return;
      }

      console.error("Admin Lead save failed:", error);

      setFieldErrors((currentErrors) =>
        mergeLeadFieldErrors(currentErrors, error?.fieldErrors),
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Lead could not be saved.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddNote(event) {
    event.preventDefault();

    if (!isEditMode || !leadId || isAddingNote) {
      return;
    }

    const cleanedNote = noteText.trim();

    if (!cleanedNote) {
      setNoteError("Please enter a private CRM note before saving.");

      return;
    }

    if (cleanedNote.length > 3000) {
      setNoteError("Private CRM note cannot exceed 3000 characters.");

      return;
    }

    try {
      setIsAddingNote(true);
      setNoteError("");

      const response = await addAdminLeadNote(
        accessToken,
        leadId,
        cleanedNote,
      );

      setLead(response.lead);
      setNoteText("");
    } catch (error) {
      if (handleAuthenticationError(error)) {
        return;
      }

      console.error("Admin Lead note save failed:", error);

      setNoteError(
        error?.fieldErrors?.text ||
          (error instanceof Error
            ? error.message
            : "Private CRM note could not be saved."),
      );
    } finally {
      setIsAddingNote(false);
    }
  }

  function handleCancel() {
    navigate("/admin/leads");
  }

  const sortedNotes = useMemo(() => {
    const notes = Array.isArray(lead?.notes) ? lead.notes : [];

    return [...notes].sort((firstNote, secondNote) => {
      const firstTime = new Date(firstNote?.createdAt || 0).getTime();
      const secondTime = new Date(secondNote?.createdAt || 0).getTime();

      return secondTime - firstTime;
    });
  }, [lead?.notes]);

  function formatNoteDate(value) {
    if (!value) {
      return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

          <p className="mt-5 text-sm font-semibold text-slate-600">
            Loading Lead editor...
          </p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Lead Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Lead editor could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">{loadError}</p>

          <Link
            to="/admin/leads"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to Leads
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/leads"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Leads Management
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
            {isEditMode ? "Update Lead" : "Create Lead"}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {isEditMode
              ? `Edit ${lead?.name || "Lead"}`
              : "Add a new Lead"}
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            {isEditMode
              ? "Update the opportunity pipeline, value, follow-up schedule, assignment and CRM details."
              : "Create a sales opportunity manually and track it through the CRM pipeline."}
          </p>
        </div>

        {submitError && (
          <div
            role="alert"
            className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <p className="text-sm font-semibold leading-6 text-red-700">
              {submitError}
            </p>
          </div>
        )}

        {isEditMode && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
                Private CRM Notes
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">
                Lead follow-up history
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Save internal notes for follow-ups, pricing discussions,
                requirements or sales context. These notes are only available
                inside the protected Admin CRM.
              </p>
            </div>

            <form onSubmit={handleAddNote} className="mt-6">
              <label
                htmlFor="lead-private-note"
                className="text-sm font-semibold text-slate-700"
              >
                Add private note
              </label>

              <textarea
                id="lead-private-note"
                value={noteText}
                onChange={(event) => {
                  setNoteText(event.target.value);
                  setNoteError("");
                }}
                rows={4}
                maxLength={3000}
                aria-invalid={Boolean(noteError)}
                aria-describedby={
                  noteError
                    ? "lead-private-note-help lead-private-note-error"
                    : "lead-private-note-help"
                }
                placeholder="Add follow-up details, quote discussion or other internal CRM context..."
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p
                    id="lead-private-note-help"
                    className="text-xs text-slate-400"
                  >
                    Maximum 3000 characters.
                  </p>

                  {noteError && (
                    <p
                      id="lead-private-note-error"
                      role="alert"
                      className="mt-1 text-sm font-semibold text-red-600"
                    >
                      {noteError}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {noteText.length}/3000
                  </span>

                  <button
                    type="submit"
                    disabled={isAddingNote}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAddingNote ? "Saving Note..." : "Add Note"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-slate-950">
                  Saved notes
                </h3>

                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {sortedNotes.length} note(s)
                </span>
              </div>

              {sortedNotes.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  No private CRM notes have been added yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {sortedNotes.map((note, index) => {
                    const noteCreator =
                      note?.createdBy?.name ||
                      note?.createdBy?.email ||
                      "Administrator";

                    return (
                      <article
                        key={note?._id || `${note?.createdAt || "note"}-${index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold text-slate-800">
                            {noteCreator}
                          </p>

                          <time className="text-xs font-medium text-slate-400">
                            {formatNoteDate(note?.createdAt)}
                          </time>
                        </div>

                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                          {note?.text || ""}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="mt-8">
          <LeadForm
            form={form}
            fieldErrors={fieldErrors}
            isSubmitting={isSubmitting}
            isEdit={isEditMode}
            serviceOptions={serviceOptions}
            adminOptions={adminOptions}
            sourceContactMessage={lead?.sourceContactMessage || null}
            onChange={handleFieldChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminLeadEditorPage;
