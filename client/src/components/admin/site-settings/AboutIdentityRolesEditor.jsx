import { createEmptyAboutIdentityRole } from "../../../utils/siteSettingsForm";
// rnx-site-settings-roles-v482

const MAX_IDENTITY_ROLES = 30;

function getFieldError(fieldErrors, fieldName) {
  return fieldErrors?.[fieldName] || "";
}

function AboutIdentityRolesEditor({
  roles = [],
  fieldErrors = {},
  disabled = false,
  onChange,
}) {
  const roleItems = Array.isArray(roles) ? roles : [];

  function emitChange(nextRoles) {
    onChange(
      nextRoles.map((role, index) => ({
        ...role,
        order: index + 1,
      })),
    );
  }

  function updateRole(index, propertyName, value) {
    emitChange(
      roleItems.map((role, roleIndex) =>
        roleIndex === index
          ? {
              ...role,
              [propertyName]: value,
            }
          : role,
      ),
    );
  }

  function addRole() {
    if (roleItems.length >= MAX_IDENTITY_ROLES) {
      return;
    }

    emitChange([
      ...roleItems,
      createEmptyAboutIdentityRole(roleItems.length + 1),
    ]);
  }

  function removeRole(index) {
    emitChange(
      roleItems.filter((_, roleIndex) => roleIndex !== index),
    );
  }

  function moveRole(index, direction) {
    const destinationIndex = index + direction;

    if (destinationIndex < 0 || destinationIndex >= roleItems.length) {
      return;
    }

    const nextRoles = [...roleItems];

    [nextRoles[index], nextRoles[destinationIndex]] = [
      nextRoles[destinationIndex],
      nextRoles[index],
    ];

    emitChange(nextRoles);
  }

  const groupError = getFieldError(fieldErrors, "about.identityRoles");

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-950/60 sm:p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-900">
            Animated Identity Roles
          </h3>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
            Add roles such as Developer, YouTuber, Freelancer or Entrepreneur.
            Public About rotates visible roles one at a time. Order here is the
            public rotation order.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
            {roleItems.length}/{MAX_IDENTITY_ROLES}
          </span>

          <button
            type="button"
            disabled={disabled || roleItems.length >= MAX_IDENTITY_ROLES}
            onClick={addRole}
            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-3 text-xs font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            + Add Role
          </button>
        </div>
      </div>

      {groupError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {groupError}
        </p>
      )}

      {roleItems.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No identity roles added
          </p>

          <p className="mt-1 text-xs text-slate-500">
            The animated identity line stays hidden until you add a role.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {roleItems.map((role, index) => {
            const labelField = `about.identityRoles.${index}.label`;
            const visibilityField =
              `about.identityRoles.${index}.isVisible`;
            const labelError = getFieldError(fieldErrors, labelField);

            return (
              <article
                key={`about-role-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-black text-brand-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="min-w-0 flex-1">
                    <label htmlFor={labelField} className="sr-only">
                      Identity role {index + 1}
                    </label>

                    <input
                      id={labelField}
                      name={labelField}
                      type="text"
                      value={role.label || ""}
                      disabled={disabled}
                      maxLength={80}
                      placeholder="Developer"
                      onChange={(event) =>
                        updateRole(index, "label", event.target.value)
                      }
                      className={`min-h-10 w-full rounded-lg border bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                        labelError
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-300 focus:border-brand-500"
                      }`}
                    />

                    {labelError && (
                      <p
                        role="alert"
                        className="mt-1.5 text-xs font-semibold text-red-600"
                      >
                        {labelError}
                      </p>
                    )}
                  </div>

                  <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      name={visibilityField}
                      checked={role.isVisible !== false}
                      disabled={disabled}
                      onChange={(event) =>
                        updateRole(
                          index,
                          "isVisible",
                          event.target.checked,
                        )
                      }
                      className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Public
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Move ${role.label || "role"} up`}
                      title="Move up"
                      disabled={disabled || index === 0}
                      onClick={() => moveRole(index, -1)}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      aria-label={`Move ${role.label || "role"} down`}
                      title="Move down"
                      disabled={disabled || index === roleItems.length - 1}
                      onClick={() => moveRole(index, 1)}
                      className="grid size-9 place-items-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeRole(index)}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AboutIdentityRolesEditor;
