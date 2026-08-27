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

const initialFilters = {
  search: "",
  status: "",
  group: "",
  service: "",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition-colors duration-150 motion-reduce:transition-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-slate-500";

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

  const currency = String(
    packageSnapshot.currency || "NPR",
  ).toUpperCase();

  return `${currency} ${price.toLocaleString("en-US")}`;
}

function statusClasses(status) {
  const map = {
    new: "bg-blue-50 text-blue-700",
    reviewing: "bg-amber-50 text-amber-700",
    confirmed: "bg-violet-50 text-violet-700",
    "in-progress": "bg-cyan-50 text-cyan-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-600",
    rejected: "bg-red-50 text-red-700",
  };

  return map[status] || "bg-slate-100 text-slate-600";
}

function AdminServiceOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { accessToken, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({
    ...initialFilters,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...initialFilters,
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
          {
            signal: controller.signal,
          },
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

    return () => {
      controller.abort();
    };
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
          {
            signal: controller.signal,
          },
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

    return () => {
      controller.abort();
    };
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

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    setPage(1);

    setAppliedFilters({
      ...formFilters,
    });
  }

  function handleClear() {
    setFormFilters({
      ...initialFilters,
    });

    setAppliedFilters({
      ...initialFilters,
    });

    setPage(1);
  }

  function handleRefresh() {
    setRefreshKey((currentKey) => currentKey + 1);
  }

  return (
    <main className="min-h-screen bg-[#08111e] text-slate-200">
      <section className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">
              Sales
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">
              Service Orders
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
              Review customer orders, packages, pricing and workflow status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-[#1d2b3d] bg-[#0c1624] px-3 py-2 text-[11px] font-semibold text-slate-300">
              {isLoading
                ? "Loading..."
                : `${total} Order${total === 1 ? "" : "s"}`}
            </span>

            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#27384e] bg-[#101c2c] px-3 text-xs font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              onClick={handleRefresh}
              type="button"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        <form
          className="mt-4 rounded-xl border border-[#1d2b3d] bg-[#0c1624] p-3"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_170px_220px_auto]">
            <div>
              <label className="sr-only" htmlFor="service-order-search">
                Search
              </label>

              <input
                className={`${inputClassName} !mt-0 !min-h-10 !rounded-lg`}
                id="service-order-search"
                name="search"
                onChange={handleFilterChange}
                placeholder="Order number, customer or email..."
                type="search"
                value={formFilters.search}
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="service-order-status">
                Status
              </label>

              <select
                className={`${inputClassName} !mt-0 !min-h-10 !rounded-lg`}
                id="service-order-status"
                name="status"
                onChange={handleFilterChange}
                value={formFilters.status}
              >
                {statuses.map(([value, label]) => (
                  <option key={value || "all"} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="sr-only" htmlFor="service-order-service">
                Service
              </label>

              <select
                className={`${inputClassName} !mt-0 !min-h-10 !rounded-lg`}
                id="service-order-service"
                name="service"
                onChange={handleFilterChange}
                value={formFilters.service}
              >
                <option value="">All Services</option>

                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                type="submit"
              >
                Apply
              </button>

              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#27384e] bg-[#101c2c] px-3 text-xs font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                onClick={handleClear}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          <details className="mt-2 rounded-lg border border-[#1d2b3d] bg-[#0a1422]">
            <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold text-slate-400">
              More Filters
            </summary>

            <div className="border-t border-[#1d2b3d] px-3 py-3 sm:max-w-xs">
              <label
                className={`${labelClassName} !text-[10px]`}
                htmlFor="service-order-group"
              >
                Package Group
              </label>

              <select
                className={`${inputClassName} !mt-1.5 !min-h-10 !rounded-lg`}
                id="service-order-group"
                name="group"
                onChange={handleFilterChange}
                value={formFilters.group}
              >
                <option value="">All groups</option>
                <option value="development">Development</option>
                <option value="management">Management</option>
              </select>
            </div>
          </details>
        </form>

        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-400">
            {isLoading
              ? "Loading Service Orders..."
              : `${total} result${total === 1 ? "" : "s"} · Page ${page}/${Math.max(1, pages)}`}
          </p>
        </div>

        {error ? (
          <div
            className="mt-3 rounded-lg border border-rose-500/20 bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-300"
            role="alert"
          >
            {error}

            <button
              className="ml-2 font-bold underline underline-offset-2"
              onClick={handleRefresh}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div
            aria-live="polite"
            className="mt-3 space-y-2"
            role="status"
          >
            <span className="sr-only">Loading Service Orders...</span>

            {[1, 2, 3, 4, 5].map((placeholder) => (
              <div
                className="h-[86px] animate-pulse rounded-xl border border-[#1d2b3d] bg-[#0c1624] motion-reduce:animate-none"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && orders.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-[#26384f] bg-[#0a1422] px-5 py-9 text-center">
            <h2 className="text-base font-bold text-slate-50">
              No Service Orders found
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Change the filters to view a different set of orders.
            </p>
          </div>
        ) : null}

        {!isLoading && orders.length > 0 ? (
          <div className="mt-3 space-y-2">
            {orders.map((order) => (
              <article
                className="min-w-0 rounded-xl border border-[#1d2b3d] bg-[#0c1624] shadow-sm transition hover:border-[#2c405b]"
                key={order._id}
              >
                <div className="grid min-w-0 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className="break-all text-[10px] font-bold text-blue-300">
                        {order.orderNumber}
                      </span>

                      <span
                        className={`rounded-md px-2 py-1 text-[9px] font-bold capitalize ${statusClasses(
                          order.status,
                        )}`}
                      >
                        {order.status?.replace("-", " ") || "Order"}
                      </span>

                      <span className="text-[9px] text-slate-500">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h2 className="truncate text-sm font-bold text-slate-50">
                        {order.customerName}
                      </h2>

                      <span className="max-w-64 truncate text-[10px] text-slate-400">
                        {order.customerEmail || "Email not provided"}
                      </span>

                      <span className="max-w-48 truncate text-[10px] text-slate-400">
                        {order.customerPhone || "Phone not provided"}
                      </span>
                    </div>

                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400">
                      <span className="max-w-52 truncate font-semibold text-slate-300">
                        {order.serviceSnapshot?.title ||
                          "Service not available"}
                      </span>

                      <span aria-hidden="true">→</span>

                      <span className="max-w-52 truncate font-semibold text-slate-300">
                        {order.packageSnapshot?.name ||
                          "Package not available"}
                      </span>

                      {order.designSnapshot?.name ? (
                        <>
                          <span aria-hidden="true">→</span>

                          <span className="max-w-48 truncate font-semibold text-slate-300">
                            {order.designSnapshot.name}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <div className="rounded-lg border border-[#23364e] bg-[#0a1422] px-3 py-2">
                      <span className="block text-[9px] font-semibold text-slate-500">
                        Price
                      </span>

                      <span className="mt-0.5 block text-xs font-bold text-slate-100">
                        {formatPrice(order.packageSnapshot)}
                      </span>
                    </div>

                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-500"
                      to={`/admin/service-orders/${order._id}`}
                    >
                      Open Order
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!isLoading && !error && pages > 1 ? (
          <nav
            aria-label="Service Order pagination"
            className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#1d2b3d] bg-[#0c1624] p-2.5"
          >
            <button
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#27384e] bg-[#101c2c] px-3 text-xs font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1}
              onClick={() =>
                setPage((currentPage) =>
                  Math.max(1, currentPage - 1),
                )
              }
              type="button"
            >
              Previous
            </button>

            <span className="text-[11px] font-semibold text-slate-400">
              {page} / {pages} · {total} total
            </span>

            <button
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= pages}
              onClick={() =>
                setPage((currentPage) =>
                  Math.min(pages, currentPage + 1),
                )
              }
              type="button"
            >
              Next
            </button>
          </nav>
        ) : null}
      </section>
    </main>
  );
}

export default AdminServiceOrdersPage;
