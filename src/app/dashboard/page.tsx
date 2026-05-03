"use client";

import AppSidebar from "@/components/AppSidebar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Estimate = {
  id: string;
  customer_name: string | null;
  property_address: string | null;
  sales_rep: string | null;
  status: string | null;
  subtotal_price: number | null;
  created_at: string | null;
};

const activeStatuses = [
  {
    label: "Measurements",
    status: "Draft - Pending Measurements",
    color: "border-amber-300 bg-amber-50 text-amber-700",
  },
  {
    label: "Information",
    status: "Draft - Pending Information",
    color: "border-orange-300 bg-orange-50 text-orange-700",
  },
  {
    label: "Created",
    status: "Proposal Created",
    color: "border-blue-300 bg-blue-50 text-blue-700",
  },
  {
    label: "Sent",
    status: "Proposal Sent",
    color: "border-violet-300 bg-violet-50 text-violet-700",
  },
  {
    label: "Signed",
    status: "Proposal Signed",
    color: "border-green-300 bg-green-50 text-green-700",
  },
  {
    label: "Orders Created",
    status: "Orders Created",
    color: "border-cyan-300 bg-cyan-50 text-cyan-700",
  },
  {
    label: "Orders Sent",
    status: "Orders Sent",
    color: "border-slate-300 bg-slate-50 text-slate-700",
  },
];

const inactiveStatuses = ["Archived", "Lost"];

function formatMoney(value: number | null) {
  if (!value) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadge(status: string | null) {
  const base =
    "inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-0.5 text-[11px] font-bold";

  switch (status) {
    case "Draft - Pending Measurements":
      return `${base} bg-amber-100 text-amber-700`;
    case "Draft - Pending Information":
      return `${base} bg-orange-100 text-orange-700`;
    case "Proposal Created":
      return `${base} bg-blue-100 text-blue-700`;
    case "Proposal Sent":
      return `${base} bg-violet-100 text-violet-700`;
    case "Proposal Signed":
      return `${base} bg-green-100 text-green-700`;
    case "Orders Created":
      return `${base} bg-cyan-100 text-cyan-700`;
    case "Orders Sent":
      return `${base} bg-slate-100 text-slate-700`;
    case "Lost":
      return `${base} bg-slate-200 text-slate-700`;
    case "Archived":
      return `${base} bg-slate-900 text-white`;
    default:
      return `${base} bg-slate-100 text-slate-600`;
  }
}

function getCurrentStep(status: string | null) {
  switch (status) {
    case "Draft - Pending Measurements":
      return "Measurements";
    case "Draft - Pending Information":
      return "Job Questions";
    case "Proposal Created":
      return "Proposal Review";
    case "Proposal Sent":
      return "Waiting on Signature";
    case "Proposal Signed":
      return "Create Orders";
    case "Orders Created":
      return "Send Orders";
    case "Orders Sent":
      return "Orders Sent";
    default:
      return "Estimate";
  }
}

export default function DashboardPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    async function loadEstimates() {
      const { data, error } = await supabase
        .from("estimates")
        .select(
          "id, customer_name, property_address, sales_rep, status, subtotal_price, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setEstimates((data ?? []) as Estimate[]);
      }

      setLoading(false);
    }

    loadEstimates();
  }, []);

  const activeEstimates = useMemo(() => {
    return estimates.filter(
      (estimate) => !inactiveStatuses.includes(estimate.status || "")
    );
  }, [estimates]);

  const filteredActiveEstimates = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    if (!text) return activeEstimates;

    return activeEstimates.filter((estimate) =>
      `${estimate.customer_name ?? ""} ${estimate.property_address ?? ""} ${
        estimate.sales_rep ?? ""
      } ${estimate.status ?? ""}`
        .toLowerCase()
        .includes(text)
    );
  }, [activeEstimates, searchText]);

  const totalActiveValue = useMemo(() => {
    return activeEstimates.reduce(
      (sum, estimate) => sum + (estimate.subtotal_price || 0),
      0
    );
  }, [activeEstimates]);

  const averageActiveValue =
    activeEstimates.length > 0 ? totalActiveValue / activeEstimates.length : 0;

  const missingMeasurements = estimates.filter(
    (estimate) => estimate.status === "Draft - Pending Measurements"
  ).length;

  const pendingInformation = estimates.filter(
    (estimate) => estimate.status === "Draft - Pending Information"
  ).length;

  const proposalsNotSent = estimates.filter(
    (estimate) => estimate.status === "Proposal Created"
  ).length;

  const signedNeedOrders = estimates.filter(
    (estimate) => estimate.status === "Proposal Signed"
  ).length;

  const attentionTotal =
    missingMeasurements + pendingInformation + proposalsNotSent + signedNeedOrders;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="rounded-lg bg-white p-4 text-sm font-semibold shadow">
          Loading dashboard...
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="rounded-lg bg-white p-5 shadow">
          <h1 className="text-xl font-bold text-red-600">
            Dashboard connection error
          </h1>
          <p className="mt-3 text-sm text-slate-700">{errorMessage}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <AppSidebar active="Dashboard" />

        <section className="min-h-screen min-w-0 flex-1 p-5 lg:ml-[var(--sidebar-width)]">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex flex-col gap-4 border-b border-slate-300 pb-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  In-Progress Overview
                </div>
                <h1 className="mt-2 text-3xl font-black text-slate-950">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  Active jobs, current workflow stages, and items needing attention.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search active jobs..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm sm:w-[340px]"
                />

                <Link
                  href="/estimates/new"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-black text-white shadow-sm hover:bg-blue-700"
                >
                  New Estimate
                </Link>
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-4">
              <Link
                href="/estimates"
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50"
              >
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Active Jobs
                </div>
                <div className="mt-1 text-2xl font-black text-slate-950">
                  {activeEstimates.length}
                </div>
              </Link>

              <Link
                href="/estimates"
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50"
              >
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Active Value
                </div>
                <div className="mt-1 text-2xl font-black text-slate-950">
                  {formatMoney(totalActiveValue)}
                </div>
              </Link>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Average Value
                </div>
                <div className="mt-1 text-2xl font-black text-slate-950">
                  {formatMoney(averageActiveValue)}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Attention Needed
                </div>
                <div className="mt-1 text-2xl font-black text-slate-950">
                  {attentionTotal}
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Jobs by Stage
                    </h2>
                  </div>

                  <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                    {activeStatuses.map((stage) => {
                      const matching = estimates.filter(
                        (estimate) => estimate.status === stage.status
                      );

                      const value = matching.reduce(
                        (sum, estimate) => sum + (estimate.subtotal_price || 0),
                        0
                      );

                      return (
                        <Link
                          key={stage.status}
                          href={`/estimates?status=${encodeURIComponent(
                            stage.status
                          )}`}
                          className={`rounded-lg border p-3 hover:shadow-sm ${stage.color}`}
                        >
                          <div className="text-[10px] font-black uppercase tracking-wide">
                            {stage.label}
                          </div>
                          <div className="mt-2 text-2xl font-black">
                            {matching.length}
                          </div>
                          <div className="mt-1 truncate text-xs font-bold">
                            {formatMoney(value)}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Active Jobs
                    </h2>

                    <Link
                      href="/estimates"
                      className="text-xs font-black text-blue-600 hover:text-blue-700"
                    >
                      View All
                    </Link>
                  </div>

                  {filteredActiveEstimates.length === 0 ? (
                    <div className="p-8 text-center">
                      <h3 className="text-lg font-black text-slate-900">
                        No active jobs found
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Adjust the search or create a new estimate.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      <div className="hidden grid-cols-[1.1fr_1.5fr_140px_150px_110px] gap-3 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500 md:grid">
                        <div>Customer</div>
                        <div>Address</div>
                        <div>Step</div>
                        <div>Status</div>
                        <div className="text-right">Value</div>
                      </div>

                      {filteredActiveEstimates.map((estimate) => (
                        <Link
                          key={estimate.id}
                          href={`/estimates/${estimate.id}`}
                          className="grid gap-2 px-4 py-3 hover:bg-slate-50 md:grid-cols-[1.1fr_1.5fr_140px_150px_110px] md:gap-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-slate-900">
                              {estimate.customer_name || "Unnamed Customer"}
                            </div>
                            <div className="mt-0.5 text-[11px] font-semibold text-slate-500">
                              {formatDate(estimate.created_at)}
                            </div>
                          </div>

                          <div className="min-w-0 text-sm font-medium text-slate-600">
                            <div className="truncate">
                              {estimate.property_address || "No address"}
                            </div>
                            <div className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                              {estimate.sales_rep || "Unassigned"}
                            </div>
                          </div>

                          <div className="text-xs font-black text-slate-700">
                            {getCurrentStep(estimate.status)}
                          </div>

                          <div>
                            <span className={getStatusBadge(estimate.status)}>
                              {estimate.status || "No Status"}
                            </span>
                          </div>

                          <div className="text-right text-sm font-black text-slate-900">
                            {formatMoney(estimate.subtotal_price)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Needs Attention
                    </h2>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <Link
                      href={`/estimates?status=${encodeURIComponent(
                        "Draft - Pending Measurements"
                      )}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                    >
                      <span className="text-xs font-bold text-slate-700">
                        Missing Measurements
                      </span>
                      <span className="text-lg font-black text-slate-950">
                        {missingMeasurements}
                      </span>
                    </Link>

                    <Link
                      href={`/estimates?status=${encodeURIComponent(
                        "Draft - Pending Information"
                      )}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                    >
                      <span className="text-xs font-bold text-slate-700">
                        Pending Information
                      </span>
                      <span className="text-lg font-black text-slate-950">
                        {pendingInformation}
                      </span>
                    </Link>

                    <Link
                      href={`/estimates?status=${encodeURIComponent(
                        "Proposal Created"
                      )}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                    >
                      <span className="text-xs font-bold text-slate-700">
                        Proposals Not Sent
                      </span>
                      <span className="text-lg font-black text-slate-950">
                        {proposalsNotSent}
                      </span>
                    </Link>

                    <Link
                      href={`/estimates?status=${encodeURIComponent(
                        "Proposal Signed"
                      )}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                    >
                      <span className="text-xs font-bold text-slate-700">
                        Signed Need Orders
                      </span>
                      <span className="text-lg font-black text-slate-950">
                        {signedNeedOrders}
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Workflow
                    </h2>
                  </div>

                  <div className="space-y-2 p-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <span>Measurements</span>
                      <span className="text-slate-400">1</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Job Questions</span>
                      <span className="text-slate-400">2</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Options</span>
                      <span className="text-slate-400">3</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Proposal</span>
                      <span className="text-slate-400">4</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Orders</span>
                      <span className="text-slate-400">5</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
