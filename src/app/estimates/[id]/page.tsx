"use client";

import AppSidebar from "@/components/AppSidebar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Estimate = {
  id: string;
  customer_name: string | null;
  property_address: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  sales_rep: string | null;
  status: string | null;
  subtotal_price: number | null;
  job_type: string | null;
  measurement_status: string | null;
  created_at: string | null;
};

const statuses = [
  "Draft - Pending Measurements",
  "Draft - Pending Information",
  "Proposal Created",
  "Proposal Sent",
  "Proposal Signed",
  "Orders Created",
  "Orders Sent",
  "Lost",
  "Archived",
];

function formatMoney(value: number | null) {
  if (!value) return "Not Priced";

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
      return `${base} bg-blue-100 text-blue-700`;
    case "Lost":
      return `${base} bg-slate-200 text-slate-700`;
    case "Archived":
      return `${base} bg-slate-100 text-slate-500`;
    default:
      return `${base} bg-slate-100 text-slate-600`;
  }
}

function getPrimaryAction(status: string | null, estimateId: string) {
  switch (status) {
    case "Draft - Pending Measurements":
      return {
        label: "Upload Measurements",
        href: `/estimates/${estimateId}/measurements`,
      };
    case "Draft - Pending Information":
      return {
        label: "Continue Job Questions",
        href: `/estimates/${estimateId}/questions`,
      };
    case "Proposal Created":
      return {
        label: "Review Proposal",
        href: `/estimates/${estimateId}/proposal`,
      };
    case "Proposal Sent":
      return {
        label: "View Proposal",
        href: `/estimates/${estimateId}/proposal`,
      };
    case "Proposal Signed":
      return {
        label: "Create Orders",
        href: `/estimates/${estimateId}/orders`,
      };
    case "Orders Created":
      return {
        label: "Send Orders",
        href: `/estimates/${estimateId}/orders`,
      };
    case "Orders Sent":
      return {
        label: "View Orders",
        href: `/estimates/${estimateId}/orders`,
      };
    default:
      return {
        label: "Open Estimate",
        href: `/estimates/${estimateId}`,
      };
  }
}

function FieldBlock({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-3">
      <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-bold text-slate-900">
        {value || "Not entered"}
      </div>
    </div>
  );
}

type WorkflowState = "complete" | "current" | "upcoming";

function getWorkflowButtonClass(state: WorkflowState) {
  if (state === "complete") {
    return "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-center text-xs font-bold text-green-700";
  }

  if (state === "current") {
    return "rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-center text-xs font-bold text-blue-700";
  }

  return "rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50";
}

function getWorkflowStates(estimate: Estimate) {
  const status = estimate.status;
  const hasMeasurements =
    !!estimate.measurement_status &&
    estimate.measurement_status.trim() !== "" &&
    estimate.measurement_status !== "Not Set";

  const isPastMeasurements =
    status !== "Draft - Pending Measurements" &&
    status !== null &&
    status !== "";

  const isPastQuestions =
    status === "Proposal Created" ||
    status === "Proposal Sent" ||
    status === "Proposal Signed" ||
    status === "Orders Created" ||
    status === "Orders Sent" ||
    status === "Archived";

  const hasOptions =
    !!estimate.subtotal_price ||
    status === "Proposal Created" ||
    status === "Proposal Sent" ||
    status === "Proposal Signed" ||
    status === "Orders Created" ||
    status === "Orders Sent" ||
    status === "Archived";

  const proposalComplete =
    status === "Proposal Signed" ||
    status === "Orders Created" ||
    status === "Orders Sent" ||
    status === "Archived";

  const ordersComplete = status === "Orders Sent" || status === "Archived";

  let measurements: WorkflowState = "upcoming";
  let questions: WorkflowState = "upcoming";
  let options: WorkflowState = "upcoming";
  let proposal: WorkflowState = "upcoming";
  let orders: WorkflowState = "upcoming";

  if (status === "Draft - Pending Measurements") {
    measurements = "current";
  } else if (hasMeasurements || isPastMeasurements) {
    measurements = "complete";
  }

  if (status === "Draft - Pending Information") {
    questions = "current";
  } else if (isPastQuestions) {
    questions = "complete";
  }

  if (status === "Proposal Created") {
    options = "current";
  } else if (hasOptions && status !== "Draft - Pending Measurements" && status !== "Draft - Pending Information") {
    options = "complete";
  }

  if (status === "Proposal Sent") {
    proposal = "current";
  } else if (proposalComplete) {
    proposal = "complete";
  }

  if (status === "Proposal Signed" || status === "Orders Created") {
    orders = "current";
  } else if (ordersComplete) {
    orders = "complete";
  }

  return {
    measurements,
    questions,
    options,
    proposal,
    orders,
  };
}

export default function EstimateDetailPage() {
  const router = useRouter();
  const params = useParams();

  const estimateId =
    typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadEstimate() {
      if (!estimateId) return;

      const { data, error } = await supabase
        .from("estimates")
        .select(
          "id, customer_name, property_address, customer_phone, customer_email, sales_rep, status, subtotal_price, job_type, measurement_status, created_at"
        )
        .eq("id", estimateId)
        .single();

      if (error) {
        setErrorMessage(error.message);
      } else {
        setEstimate(data as Estimate);
      }

      setLoading(false);
    }

    loadEstimate();
  }, [estimateId]);

  async function updateStatus(newStatus: string) {
    if (!estimate) return;

    setSavingStatus(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("estimates")
      .update({ status: newStatus })
      .eq("id", estimate.id);

    setSavingStatus(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setEstimate({
      ...estimate,
      status: newStatus,
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="rounded-lg bg-white p-4 text-sm shadow">
          Loading estimate...
        </div>
      </main>
    );
  }

  if (errorMessage && !estimate) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="rounded-lg bg-white p-5 shadow">
          <h1 className="text-xl font-bold text-red-600">
            Estimate connection error
          </h1>
          <p className="mt-3 text-sm text-slate-700">{errorMessage}</p>
          <button
            onClick={() => router.push("/estimates")}
            className="mt-5 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white"
          >
            Back to Estimates
          </button>
        </div>
      </main>
    );
  }

  if (!estimate) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="rounded-lg bg-white p-4 text-sm shadow">
          Estimate not found.
        </div>
      </main>
    );
  }

  const primaryAction = getPrimaryAction(estimate.status, estimate.id);
  const workflowStates = getWorkflowStates(estimate);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <AppSidebar active="Estimates" />

        <section className="min-h-screen min-w-0 flex-1 p-5 lg:ml-[var(--sidebar-width)]">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-300 pb-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <button
                onClick={() => router.push("/estimates")}
                className="mb-2 text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                ← Back to Estimates
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900">
                  {estimate.customer_name || "Unnamed Customer"}
                </h1>
                <span className={getStatusBadge(estimate.status)}>
                  {estimate.status || "No Status"}
                </span>
              </div>

              <p className="mt-1 max-w-4xl text-sm font-medium text-slate-600">
                {estimate.property_address || "No address"}
              </p>
            </div>

            <Link
              href={primaryAction.href}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              {primaryAction.label}
            </Link>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                    Estimate Summary
                  </h2>
                </div>

                <div className="grid gap-3 p-4 md:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3 md:col-span-1">
                    <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Total Price
                    </div>
                    <div className="mt-1 text-2xl font-black text-slate-900">
                      {formatMoney(estimate.subtotal_price)}
                    </div>
                  </div>

                  <FieldBlock label="Job Type" value={estimate.job_type || "Not Set"} />
                  <FieldBlock
                    label="Measurements"
                    value={estimate.measurement_status || "Not Set"}
                  />
                  <FieldBlock label="Sales Rep" value={estimate.sales_rep || "Unassigned"} />
                  <FieldBlock label="Created" value={formatDate(estimate.created_at)} />

                  <div className="min-w-0 rounded-lg bg-slate-50 p-3">
                    <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Status
                    </div>
                    <div className="mt-1">
                      <span className={getStatusBadge(estimate.status)}>
                        {estimate.status || "No Status"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                    Customer Information
                  </h2>
                </div>

                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
                  <FieldBlock label="Customer" value={estimate.customer_name} />
                  <FieldBlock label="Phone" value={estimate.customer_phone} />
                  <FieldBlock label="Email" value={estimate.customer_email} />
                  <FieldBlock label="Address" value={estimate.property_address} />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                    Workflow
                  </h2>
                </div>

                <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-5">
                  <Link
                    href={`/estimates/${estimate.id}/measurements`}
                    className={getWorkflowButtonClass(workflowStates.measurements)}
                  >
                    Measurements
                  </Link>

                  <Link
                    href={`/estimates/${estimate.id}/questions`}
                    className={getWorkflowButtonClass(workflowStates.questions)}
                  >
                    Questions
                  </Link>

                  <Link
                    href={`/estimates/${estimate.id}/options`}
                    className={getWorkflowButtonClass(workflowStates.options)}
                  >
                    Options
                  </Link>

                  <Link
                    href={`/estimates/${estimate.id}/proposal`}
                    className={getWorkflowButtonClass(workflowStates.proposal)}
                  >
                    Proposal
                  </Link>

                  <Link
                    href={`/estimates/${estimate.id}/orders`}
                    className={getWorkflowButtonClass(workflowStates.orders)}
                  >
                    Orders
                  </Link>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Edit / Jump To
                    </h2>
                  </div>

                  <div className="space-y-2 p-4">
                    <Link
                      href={`/estimates/${estimate.id}/edit`}
                      className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Review / Edit Initial Info
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}/measurements`}
                      className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Measurements
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}/questions`}
                      className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Job Questions
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}/options`}
                      className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Options
                    </Link>

                    <Link
                      href={`/pricing-v2?estimateId=${estimate.id}`}
                      className="block rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-center text-xs font-bold text-blue-700 hover:bg-blue-100"
                    >
                      V2 Pricing Preview
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}/proposal`}
                      className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Proposal
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}/orders`}
                      className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Orders
                    </Link>
                  </div>
                </div>
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                    Next Action
                  </h2>
                </div>

                <div className="p-4">
                  <Link
                    href={primaryAction.href}
                    className="block rounded-md bg-blue-600 px-4 py-2 text-center text-xs font-bold text-white hover:bg-blue-700"
                  >
                    {primaryAction.label}
                  </Link>

                  <Link
                    href={`/estimates/${estimate.id}/edit`}
                    className="mt-2 block rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Review / Edit Info
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                    Update Status
                  </h2>
                </div>

                <div className="space-y-2 p-4">
                  <select
                    value={estimate.status || ""}
                    onChange={(event) => updateStatus(event.target.value)}
                    disabled={savingStatus}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="" disabled>
                      Select status
                    </option>

                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {savingStatus && (
                    <p className="text-xs font-semibold text-slate-500">
                      Saving status...
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                    Quick Links
                  </h2>
                </div>

                <div className="space-y-2 p-4">
                  <Link
                    href="/dashboard"
                    className="block rounded-md border border-slate-300 px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/estimates"
                    className="block rounded-md border border-slate-300 px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    All Estimates
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
