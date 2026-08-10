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

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
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
          { signal: controller.signal },
        );

        setOrder(record);
        setStatus(record.status || "new");
        setAdminNotes(record.adminNotes || "");
        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
          logout();
          navigate("/admin/login", { replace: true });
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
        navigate("/admin/login", { replace: true });
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
    if (!["super-admin", "admin"].includes(admin?.role)) {
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
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <p className="font-bold text-slate-500">Loading order...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-red-600">{error || "Order not found."}</p>
          <Link
            to="/admin/service-orders"
            className="mt-5 inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white"
          >
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/service-orders"
          className="text-sm font-semibold text-slate-500 hover:text-brand-600"
        >
          ← Service Orders
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
              Order
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              {order.orderNumber}
            </h1>
          </div>

          <a
            href={order.selectionPath || "/services"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600"
          >
            Open Selection ↗
          </a>
        </div>

        {success && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">
                Customer
              </h2>
              <div className="mt-3">
                <DetailRow label="Name" value={order.customerName} />
                <DetailRow label="Email" value={order.customerEmail} />
                <DetailRow label="Phone / WhatsApp" value={order.customerPhone} />
                <DetailRow label="Company" value={order.company} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">
                Selection
              </h2>
              <div className="mt-3">
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
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">
                Project
              </h2>
              <div className="mt-3">
                <DetailRow
                  label="Requirements"
                  value={order.requirements}
                />
                <DetailRow
                  label="Preferred Start Date"
                  value={order.preferredStartDate}
                />
                <DetailRow label="Customer Notes" value={order.notes} />
              </div>
            </section>
          </div>

          <form
            onSubmit={handleSave}
            className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6"
          >
            <h2 className="text-lg font-black text-slate-950">
              Manage Order
            </h2>

            <div className="mt-5">
              <label className="text-xs font-bold text-slate-700">
                Status
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                disabled={isSaving}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 outline-none"
              >
                {statuses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="text-xs font-bold text-slate-700">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                disabled={isSaving}
                rows={8}
                placeholder="Private notes..."
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-4 min-h-12 w-full rounded-xl bg-brand-600 px-5 font-black text-white disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Order"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={
                isSaving ||
                !["super-admin", "admin"].includes(admin?.role)
              }
              className="mt-3 min-h-11 w-full rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 disabled:opacity-40"
            >
              Delete Order
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default AdminServiceOrderDetailPage;
