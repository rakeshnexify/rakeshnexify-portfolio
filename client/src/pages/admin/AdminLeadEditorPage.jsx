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
      <main className="grid min-h-screen place-items-center bg-[#08111e] px-4 text-slate-300">
        <div className="text-center">
          <div className="mx-auto size-9 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500 motion-reduce:animate-none" />

          <p className="mt-3 text-[11px] font-semibold text-slate-500">
            Loading Lead editor...
          </p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08111e] px-4">
        <div className="w-full max-w-md rounded-xl border border-rose-500/20 bg-[#0c1624] p-5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-rose-300">
            Lead Error
          </p>

          <h1 className="mt-1.5 text-lg font-bold text-slate-100">
            Lead editor could not be opened
          </h1>

          <p className="mt-2 text-[11px] leading-5 text-slate-400">
            {loadError}
          </p>

          <Link
            className="mt-4 inline-flex min-h-9 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 text-[10px] font-bold text-white transition hover:bg-blue-500"
            to="/admin/leads"
          >
            Return to Leads
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08111e] text-slate-200">
      <section className="mx-auto w-full max-w-[1480px] px-3 py-4 sm:px-5 lg:px-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              className="inline-flex min-h-7 items-center gap-1.5 text-[9px] font-bold text-slate-500 transition hover:text-blue-300"
              to="/admin/leads"
            >
              <span aria-hidden="true">←</span>
              Leads / CRM
            </Link>

            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-blue-400">
              {isEditMode ? "Update Lead" : "Create Lead"}
            </p>

            <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
              {isEditMode
                ? `Edit ${lead?.name || "Lead"}`
                : "Add a new Lead"}
            </h1>

            <p className="mt-0.5 hidden max-w-2xl text-[10px] leading-4 text-slate-500 sm:block">
              {isEditMode
                ? "Update pipeline, value, follow-up, assignment and CRM details."
                : "Create a sales opportunity and start tracking it in the CRM."}
            </p>
          </div>

          {isEditMode ? (
            <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
              <span className="rounded-md border border-[#26364b] bg-[#0c1624] px-2 py-1 font-semibold text-slate-400">
                {lead?.status || "Lead"}
              </span>

              <span className="rounded-md border border-[#26364b] bg-[#0c1624] px-2 py-1 font-semibold text-slate-400">
                {sortedNotes.length} note{sortedNotes.length === 1 ? "" : "s"}
              </span>
            </div>
          ) : null}
        </header>

        {submitError ? (
          <div
            className="mt-3 rounded-lg border border-rose-500/20 bg-rose-950/20 px-3 py-2 text-[10px] font-semibold text-rose-300"
            role="alert"
          >
            {submitError}
          </div>
        ) : null}

        {isEditMode ? (
          <details className="mt-3 rounded-xl border border-[#1d2b3d] bg-[#0c1624]">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-[10px] font-bold text-slate-400">
              <span>Private CRM Notes</span>

              <span className="text-[9px] font-semibold text-slate-600">
                {sortedNotes.length} saved
              </span>
            </summary>

            <div className="border-t border-[#1d2b3d] p-3">
              <form
                className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]"
                onSubmit={handleAddNote}
              >
                <div>
                  <label
                    className="sr-only"
                    htmlFor="lead-private-note"
                  >
                    Add private note
                  </label>

                  <textarea
                    aria-describedby={
                      noteError ? "lead-private-note-error" : undefined
                    }
                    aria-invalid={Boolean(noteError)}
                    className="min-h-16 w-full resize-y rounded-lg border border-[#24364d] bg-[#091522] px-3 py-2 text-[10px] leading-4 text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    id="lead-private-note"
                    maxLength={3000}
                    onChange={(event) => {
                      setNoteText(event.target.value);
                      setNoteError("");
                    }}
                    placeholder="Add private follow-up note..."
                    rows={2}
                    value={noteText}
                  />

                  <div className="mt-1 flex items-center justify-between gap-2">
                    {noteError ? (
                      <p
                        className="text-[9px] font-semibold text-rose-300"
                        id="lead-private-note-error"
                        role="alert"
                      >
                        {noteError}
                      </p>
                    ) : (
                      <span className="text-[8px] text-slate-600">
                        Internal CRM only
                      </span>
                    )}

                    <span className="text-[8px] tabular-nums text-slate-600">
                      {noteText.length}/3000
                    </span>
                  </div>
                </div>

                <button
                  className="inline-flex min-h-9 self-start items-center justify-center rounded-lg border border-[#2b405b] bg-[#101c2c] px-3 text-[9px] font-bold text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50 md:mt-0"
                  disabled={isAddingNote}
                  type="submit"
                >
                  {isAddingNote ? "Saving..." : "Add Note"}
                </button>
              </form>

              {sortedNotes.length > 0 ? (
                <div className="mt-2 max-h-60 space-y-1.5 overflow-y-auto pr-1">
                  {sortedNotes.map((note, index) => {
                    const noteCreator =
                      note?.createdBy?.name ||
                      note?.createdBy?.email ||
                      "Administrator";

                    return (
                      <article
                        className="rounded-lg border border-[#1d2b3d] bg-[#09131f] px-2.5 py-2"
                        key={note?._id || `${note?.createdAt || "note"}-${index}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[9px] font-bold text-slate-300">
                            {noteCreator}
                          </p>

                          <time className="text-[8px] text-slate-600">
                            {formatNoteDate(note?.createdAt)}
                          </time>
                        </div>

                        <p className="mt-1 whitespace-pre-wrap break-words text-[9px] leading-4 text-slate-400">
                          {note?.text || ""}
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 rounded-lg border border-dashed border-[#26364b] px-3 py-2 text-[9px] text-slate-600">
                  No private CRM notes yet.
                </p>
              )}
            </div>
          </details>
        ) : null}

        <div className="mt-3">
          <LeadForm
            adminOptions={adminOptions}
            fieldErrors={fieldErrors}
            form={form}
            isEdit={isEditMode}
            isSubmitting={isSubmitting}
            onCancel={handleCancel}
            onChange={handleFieldChange}
            onSubmit={handleSubmit}
            serviceOptions={serviceOptions}
            sourceContactMessage={lead?.sourceContactMessage || null}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminLeadEditorPage;