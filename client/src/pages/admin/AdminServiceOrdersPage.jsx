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
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="uppercase tracking-[0.14em] text-brand-700">
                Sales
              </span>

              <span aria-hidden="true" className="text-slate-300">
                /
              </span>

              <span className="text-slate-500">
                Order management
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Service Orders
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review customer orders, selected Services, packages,
              designs, pricing snapshots and current order status.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div>
            <h2 className="text-base font-black text-slate-950">
              Filters
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Narrow orders by customer details, workflow status,
              package group or Service.
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2">
              <label
                htmlFor="service-order-search"
                className={labelClassName}
              >
                Search
              </label>

              <input
                id="service-order-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Order number, customer or email"
                className={`${inputClassName} px-4 placeholder:text-slate-400`}
              />
            </div>

            <div>
              <label
                htmlFor="service-order-status"
                className={labelClassName}
              >
                Status
              </label>

              <select
                id="service-order-status"
                name="status"
                value={formFilters.status}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                {statuses.map(([value, label]) => (
                  <option key={value || "all"} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="service-order-group"
                className={labelClassName}
              >
                Group
              </label>

              <select
                id="service-order-group"
                name="group"
                value={formFilters.group}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All groups</option>
                <option value="development">Development</option>
                <option value="management">Management</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="service-order-service"
                className={labelClassName}
              >
                Service
              </label>

              <select
                id="service-order-service"
                name="service"
                value={formFilters.service}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All Services</option>

                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Clear
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-4">
          <p className="text-sm font-bold text-slate-700">
            {isLoading
              ? "Loading Service Orders..."
              : `${total} order${total === 1 ? "" : "s"}`}
          </p>

          {!isLoading ? (
            <p className="mt-0.5 text-xs text-slate-500">
              Page {page} of {Math.max(1, pages)}
            </p>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm font-semibold leading-6 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 min-h-10 text-sm font-bold text-red-700 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4].map((placeholder) => (
              <div
                key={placeholder}
                className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && orders.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-base font-black text-slate-950">
              No Service Orders found
            </p>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Change the filters to view a different set of orders.
            </p>
          </div>
        ) : null}

        {!isLoading && orders.length > 0 ? (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <article
                key={order._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all text-sm font-black text-slate-950">
                        {order.orderNumber}
                      </span>

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize ${statusClasses(
                          order.status,
                        )}`}
                      >
                        {order.status?.replace("-", " ") || "Order"}
                      </span>
                    </div>

                    <h2 className="mt-3 break-words text-lg font-black tracking-tight text-slate-950">
                      {order.customerName}
                    </h2>

                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                      <span className="break-all">
                        {order.customerEmail || "Email not provided"}
                      </span>

                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>

                      <span className="break-all">
                        {order.customerPhone || "Phone not provided"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
                      <span>
                        {order.serviceSnapshot?.title ||
                          "Service not available"}
                      </span>

                      <span aria-hidden="true" className="text-slate-300">
                        →
                      </span>

                      <span>
                        {order.packageSnapshot?.name ||
                          "Package not available"}
                      </span>

                      {order.designSnapshot?.name ? (
                        <>
                          <span
                            aria-hidden="true"
                            className="text-slate-300"
                          >
                            →
                          </span>

                          <span>{order.designSnapshot.name}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid shrink-0 gap-2 sm:grid-cols-3 lg:min-w-[31rem]">
                    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
                      <p className={labelClassName}>Price</p>

                      <p className="mt-1.5 break-words text-sm font-black text-slate-800">
                        {formatPrice(order.packageSnapshot)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
                      <p className={labelClassName}>Created</p>

                      <p className="mt-1.5 text-xs font-bold leading-5 text-slate-700">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <Link
                      to={`/admin/service-orders/${order._id}`}
                      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
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
            className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-bold text-slate-700">
                Page {page} of {pages}
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                {total} total order{total === 1 ? "" : "s"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={() =>
                  setPage((currentPage) =>
                    Math.max(1, currentPage - 1),
                  )
                }
                disabled={page <= 1}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((currentPage) =>
                    Math.min(pages, currentPage + 1),
                  )
                }
                disabled={page >= pages}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </nav>
        ) : null}
      </section>
    </main>
  );
}

export default AdminServiceOrdersPage;