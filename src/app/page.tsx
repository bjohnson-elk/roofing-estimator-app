"use client";

import AppSidebar from "@/components/AppSidebar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Estimate = {
  id: string;
  customer_name: string | null;
  property_address: string | null;
  status: string | null;
  subtotal_price: number | null;
  created_at: string | null;
};

const activeStatuses = [
  "Draft - Pending Measurements",
  "Draft - Pending Information",
  "Proposal Created",
  "Proposal Sent",
  "Proposal Signed",
  "Orders Created",
  "Orders Sent",
];

function formatMoney(value: number | null) {
  if (!value) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getCurrentStep(status: string | null) {
  switch (status) {
    case "Draft - Pending Measurements":
      return "Measurements";
    case "Draft - Pending Information":
      return "Job Questions";
    case "Proposal Created":
      return "Options / Proposal";
    case "Proposal Sent":
      return "Proposal Sent";
    case "Proposal Signed":
      return "Orders";
    case "Orders Created":
      return "Send Orders";
    case "Orders Sent":
      return "Orders Sent";
    default:
      return "Estimate";
  }
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
      return `${base} bg-blue-100 text-blue-700`;
    default:
      return `${base} bg-slate-100 text-slate-600`;
  }
}

export default function StartPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadEstimates() {
      const { data, error } = await supabase
        .from("estimates")
        .select("id, customer_name, property_address, status, subtotal_price, created_at")
        .in("status", activeStatuses)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) {
        setErrorMessage(error.message);
      } else {
        setEstimates((data ?? []) as Estimate[]);
      }

      setLoading(false);
    }

    loadEstimates();
  }, []);

  const totalActiveValue = useMemo(() => {
    return estimates.reduce(
      (sum, estimate) => sum + (estimate.subtotal_price || 0),
      0
    );
  }, [estimates]);

  const stageCounts = useMemo(() => {
    return activeStatuses.map((status) => ({
      status,
      count: estimates.filter((estimate) => estimate.status === status).length,
    }));
  }, [estimates]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <AppSidebar active="Start" />

        <section className="min-h-screen min-w-0 flex-1 p-5 lg:ml-[var(--sidebar-width)]">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 border-b border-slate-300 pb-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Elkstone Roofing & Construction
              </div>

              <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h1 className="text-3xl font-black text-slate-950">
                    Estimate Workspace
                  </h1>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Start a new estimate or continue an in-progress job.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/estimates/new"
                    className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-700"
                  >
                    Create New Estimate
                  </Link>

                  <Link
                    href="/dashboard"
                    className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
                  >
                    View In-Progress Jobs
                  </Link>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                    Recent In-Progress Jobs
                  </h2>

                  <Link
                    href="/estimates"
                    className="text-xs font-black text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </Link>
                </div>

                {loading ? (
                  <div className="p-5 text-sm font-semibold text-slate-500">
                    Loading jobs...
                  </div>
                ) : estimates.length === 0 ? (
                  <div className="p-8 text-center">
                    <h3 className="text-lg font-black text-slate-900">
                      No in-progress jobs yet
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Create a new estimate to start the workflow.
                    </p>
                    <Link
                      href="/estimates/new"
                      className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
                    >
                      Create New Estimate
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {estimates.map((estimate) => (
                      <Link
                        key={estimate.id}
                        href={`/estimates/${estimate.id}`}
                        className="grid gap-3 px-4 py-3 hover:bg-slate-50 md:grid-cols-[1.2fr_1.5fr_150px_120px]"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-slate-900">
                            {estimate.customer_name || "Unnamed Customer"}
                          </div>
                          <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Current Step: {getCurrentStep(estimate.status)}
                          </div>
                        </div>

                        <div className="min-w-0 text-sm font-medium text-slate-600">
                          <div className="truncate">
                            {estimate.property_address || "No address"}
                          </div>
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

              <aside className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Active Snapshot
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                        Active Jobs
                      </div>
                      <div className="mt-1 text-2xl font-black text-slate-950">
                        {estimates.length}
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                        Active Value
                      </div>
                      <div className="mt-1 text-2xl font-black text-slate-950">
                        {formatMoney(totalActiveValue)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Jobs by Stage
                    </h2>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {stageCounts.map((stage) => (
                      <Link
                        key={stage.status}
                        href={`/estimates?status=${encodeURIComponent(stage.status)}`}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50"
                      >
                        <span className="text-xs font-bold text-slate-700">
                          {stage.status}
                        </span>
                        <span className="text-sm font-black text-slate-950">
                          {stage.count}
                        </span>
                      </Link>
                    ))}
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
