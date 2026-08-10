import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import { fetchAdminServices } from "../../services/adminServicesApi";
import { fetchAdminServiceOrders } from "../../services/adminServiceOrdersApi";

const statuses = [
  ["", "All statuses"],
  ["new", "New"],
  ["reviewing", "Reviewing"],
  ["confirmed", "Confirmed"],
  ["in-progress", "In Progress"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
  ["rejected", "Rejected"],
];

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

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

  const currency = String(packageSnapshot.currency || "NPR").toUpperCase();

  return `${currency} ${price.toLocaleString("en-US")}`;
}

function statusClasses(status) {
  const map = {
    new: "bg-blue-100 text-blue-700",
    reviewing: "bg-amber-100 text-amber-700",
    confirmed: "bg-violet-100 text-violet-700",
    "in-progress": "bg-cyan-100 text-cyan-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-200 text-slate-600",
    rejected: "bg-red-100 text-red-700",
  };

  return map[status] || "bg-slate-100 text-slate-600";
}

function AdminServiceOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, logout, admin } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({
    search: "",
    status: "",
    group: "",
    service: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "",
    group: "",
    service: "",
  });
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const apiFilters = useMemo(
    () => ({
      ...appliedFilters,
      page,
      limit: 20,
    }),
    [appliedFilters, page],
  );

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadServices() {
      try {
        const response = await fetchAdminServices(
          accessToken,
          {},
          { signal: controller.signal },
        );

        setServices(response.services || []);
      } catch (requestError) {
        if (
          requestError?.name !== "AbortError" &&
          requestError?.status === 401
        ) {
          logout();
          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: "/admin/service-orders",
              },
            },
          });
        }
      }
    }

    loadServices();

    return () => controller.abort();
  }, [accessToken, logout, navigate]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadOrders() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetchAdminServiceOrders(
          accessToken,
          apiFilters,
          { signal: controller.signal },
        );

        setOrders(response.orders);
        setTotal(response.total);
        setPages(response.pages);
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: "/admin/service-orders",
                search: location.search,
              },
            },
          });

          return;
        }

        setOrders([]);
        setTotal(0);
        setPages(1);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Service Orders could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => controller.abort();
  }, [
    accessToken,
    apiFilters,
    location.search,
    logout,
    navigate,
    refreshKey,
  ]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFormFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(formFilters);
  }

  function handleClear() {
    const cleared = {
      search: "",
      status: "",
      group: "",
      service: "",
    };

    setFormFilters(cleared);
    setAppliedFilters(cleared);
    setPage(1);
  }

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-brand-600 font-extrabold text-white">
              RN
            </div>
            <div>
              <p className="font-extrabold text-slate-950">RakeshNexify</p>
              <p className="text-xs text-slate-500">Service Orders</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-500 md:inline">
              {admin?.name}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/dashboard"
          className="text-sm font-semibold text-slate-500 hover:text-brand-600"
        >
          ← Dashboard
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
              Orders
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Service Orders
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600"
          >
            Refresh
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-7 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-[1fr_0.6fr_0.6fr_0.8fr_auto]"
        >
          <input
            name="search"
            value={formFilters.search}
            onChange={handleFilterChange}
            placeholder="Order number, customer, email..."
            className="min-h-11 rounded-xl border border-slate-300 px-4 outline-none focus:border-brand-500"
          />

          <select
            name="status"
            value={formFilters.status}
            onChange={handleFilterChange}
            className="min-h-11 rounded-xl border border-slate-300 px-3 outline-none"
          >
            {statuses.map(([value, label]) => (
              <option key={value || "all"} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            name="group"
            value={formFilters.group}
            onChange={handleFilterChange}
            className="min-h-11 rounded-xl border border-slate-300 px-3 outline-none"
          >
            <option value="">All groups</option>
            <option value="development">Development</option>
            <option value="management">Management</option>
          </select>

          <select
            name="service"
            value={formFilters.service}
            onChange={handleFilterChange}
            className="min-h-11 rounded-xl border border-slate-300 px-3 outline-none"
          >
            <option value="">All Services</option>
            {services.map((service) => (
              <option key={service._id} value={service._id}>
                {service.title}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="min-h-11 flex-1 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-600"
            >
              Clear
            </button>
          </div>
        </form>

        <p className="mt-5 text-sm font-semibold text-slate-500">
          {isLoading ? "Loading..." : `${total} order(s)`}
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && orders.length === 0 && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
            No Service Orders found.
          </div>
        )}

        <div className="mt-5 space-y-4">
          {orders.map((order) => (
            <article
              key={order._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-950">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusClasses(
                        order.status,
                      )}`}
                    >
                      {order.status?.replace("-", " ")}
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-black text-slate-950">
                    {order.customerName}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {order.customerEmail} · {order.customerPhone}
                  </p>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {order.serviceSnapshot?.title} →{" "}
                    {order.packageSnapshot?.name}
                    {order.designSnapshot?.name
                      ? ` → ${order.designSnapshot.name}`
                      : ""}
                  </p>
                </div>

                <div className="grid shrink-0 gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Price
                    </p>
                    <p className="mt-1 font-black text-slate-700">
                      {formatPrice(order.packageSnapshot)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Created
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-700">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <Link
                    to={`/admin/service-orders/${order._id}`}
                    className="flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white"
                  >
                    Open Order
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm font-bold text-slate-500">
              Page {page} of {pages}
            </span>

            <button
              type="button"
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
              disabled={page >= pages}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminServiceOrdersPage;
