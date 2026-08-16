import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  deleteAdminServiceOrder,
  fetchAdminServiceOrderById,
  updateAdminServiceOrder,
} from "../../services/adminServiceOrdersApi";

const statuses = [
  ["new", "New"],
  ["reviewing", "Reviewing"],
  ["confirmed", "Confirmed"],
  ["in-progress", "In Progress"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
  ["rejected", "Rejected"],
];

const DELETE_ROLES = ["super-admin", "admin"];

function formatPrice(packageSnapshot) {
  if (!packageSnapshot) {
    return "—";
  }

  if (packageSnapshot.pricingMode === "custom") {
    return packageSnapshot.priceLabel || "Custom pricing";
  }

  const price = Number(packageSnapshot.price);

  if (!Number.isFinite(price)) {
    return packageSnapshot.priceLabel || "—";
  }

  return `${String(packageSnapshot.currency || "NPR").toUpperCase()} ${price.toLocaleString(
    "en-US",
  )}`;
}

function formatStatusLabel(value) {
  return (
    statuses.find(([statusValue]) => statusValue === value)?.[1] ||
    value ||
    "—"
  );
}

function DetailRow({ label, value, children }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </dt>

      <dd className="mt-1.5 min-w-0">
        {children || (
          <span className="block break-words text-sm font-semibold leading-6 text-slate-800">
            {value || "—"}
          </span>
        )}
      </dd>
    </div>
  );
}

function AdminServiceOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, logout, admin } = useAdminAuth();

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("new");
  const [adminNotes, setAdminNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canDelete = DELETE_ROLES.includes(admin?.role);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadOrder() {
      try {
        setIsLoading(true);

        const record = await fetchAdminServiceOrderById(
          accessToken,
          id,
          {
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) {
          return;
        }

        setOrder(record);
        setStatus(record.status || "new");
        setAdminNotes(record.adminNotes || "");
        setError("");
      } catch (requestError) {
        if (
          controller.signal.aborted ||
          requestError?.name === "AbortError"
        ) {
          return;
        }

        if (requestError?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
          });

          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Service Order could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadOrder();

    return () => controller.abort();
  }, [accessToken, id, logout, navigate]);

  async function handleSave(event) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const response = await updateAdminServiceOrder(
        accessToken,
        id,
        {
          status,
          adminNotes,
        },
      );

      setOrder(response.order);
      setSuccess(response.message || "Order updated.");
    } catch (requestError) {
      if (requestError?.status === 401) {
        logout();

        navigate("/admin/login", {
          replace: true,
        });

        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Order could not be updated.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete order "${order?.orderNumber}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAdminServiceOrder(accessToken, id);

      navigate("/admin/service-orders", {
        replace: true,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Order could not be deleted.",
      );
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="space-y-4"
          >
            <span className="sr-only">
              Loading service order...
            </span>

            <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
              <div className="space-y-4">
                {[1, 2, 3].map((placeholder) => (
                  <div
                    key={placeholder}
                    className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
                  />
                ))}
              </div>

              <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Link
            to="/admin/service-orders"
            className="inline-flex min-h-10 items-center text-sm font-bold text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            ← Service Orders
          </Link>

          <div
            role="alert"
            className="mt-5 max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <h1 className="text-lg font-bold text-red-900">
              Unable to open Service Order
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {error || "Order not found."}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              to="/admin/service-orders"
              className="inline-flex min-h-10 items-center text-sm font-bold text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              ← Service Orders
            </Link>

            <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Service Order
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <h1 className="break-all text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {order.orderNumber}
              </h1>

              <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                {formatStatusLabel(order.status)}
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review the submitted customer request and immutable
              commercial selection, then manage the internal order
              status and private Admin notes.
            </p>
          </div>

          <a
            href={order.selectionPath || "/services"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Open Selection ↗
          </a>
        </header>

        <div aria-live="polite">
          {success && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700"
            >
              {success}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)] lg:items-start">
          <div className="min-w-0 space-y-5">
            <section
              aria-labelledby="service-order-customer-heading"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <h2
                id="service-order-customer-heading"
                className="text-lg font-bold text-slate-950"
              >
                Customer
              </h2>

              <dl className="mt-2">
                <DetailRow
                  label="Name"
                  value={order.customerName}
                />

                <DetailRow label="Email">
                  {order.customerEmail ? (
                    <a
                      href={`mailto:${order.customerEmail}`}
                      className="inline-block break-all text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                      {order.customerEmail}
                    </a>
                  ) : (
                    <span className="text-sm font-semibold text-slate-800">
                      —
                    </span>
                  )}
                </DetailRow>

                <DetailRow label="Phone / WhatsApp">
                  {order.customerPhone ? (
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="inline-block break-all text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                      {order.customerPhone}
                    </a>
                  ) : (
                    <span className="text-sm font-semibold text-slate-800">
                      —
                    </span>
                  )}
                </DetailRow>

                <DetailRow
                  label="Company"
                  value={order.company}
                />
              </dl>
            </section>

            <section
              aria-labelledby="service-order-selection-heading"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2
                    id="service-order-selection-heading"
                    className="text-lg font-bold text-slate-950"
                  >
                    Commercial Selection
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Historical Service, package and design values are
                    preserved from the order submission.
                  </p>
                </div>

                <span className="w-fit rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                  Read only
                </span>
              </div>

              <dl className="mt-3">
                <DetailRow
                  label="Service"
                  value={order.serviceSnapshot?.title}
                />

                <DetailRow
                  label="Package"
                  value={order.packageSnapshot?.name}
                />

                <DetailRow
                  label="Type"
                  value={order.packageSnapshot?.group}
                />

                <DetailRow
                  label="Price"
                  value={formatPrice(order.packageSnapshot)}
                />

                <DetailRow
                  label="Billing"
                  value={
                    order.packageSnapshot?.billingLabel ||
                    order.packageSnapshot?.billingCycle
                  }
                />

                <DetailRow
                  label="Design"
                  value={order.designSnapshot?.name}
                />
              </dl>
            </section>

            <section
              aria-labelledby="service-order-project-heading"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <h2
                id="service-order-project-heading"
                className="text-lg font-bold text-slate-950"
              >
                Project Request
              </h2>

              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Requirements
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {order.requirements || "—"}
                </p>
              </div>

              <dl className="mt-4 border-t border-slate-100 pt-1">
                <DetailRow
                  label="Preferred Start Date"
                  value={order.preferredStartDate}
                />
              </dl>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Customer Notes
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {order.notes || "—"}
                </p>
              </div>
            </section>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-6">
            <form
              onSubmit={handleSave}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
                Internal Workflow
              </p>

              <h2 className="mt-2 text-lg font-bold text-slate-950">
                Manage Order
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                Status and private Admin notes are the editable
                maintenance fields for this order.
              </p>

              <div className="mt-5">
                <label
                  htmlFor="service-order-status"
                  className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                >
                  Status
                </label>

                <select
                  id="service-order-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  disabled={isSaving}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition-colors focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                >
                  {statuses.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="service-order-admin-notes"
                  className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                >
                  Admin Notes
                </label>

                <textarea
                  id="service-order-admin-notes"
                  value={adminNotes}
                  onChange={(event) =>
                    setAdminNotes(event.target.value)
                  }
                  disabled={isSaving}
                  rows={8}
                  placeholder="Private notes..."
                  className="mt-2 min-h-44 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Internal only. These notes are not customer-editable
                  order details.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
              >
                {isSaving ? "Saving..." : "Save Order"}
              </button>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-600">
                  Destructive Action
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Permanent deletion is restricted to Admin and
                  Super-admin roles.
                </p>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving || !canDelete}
                  title={
                    canDelete
                      ? "Permanently delete this Service Order"
                      : "Your role cannot permanently delete Service Orders"
                  }
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                >
                  Delete Order
                </button>
              </div>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default AdminServiceOrderDetailPage;