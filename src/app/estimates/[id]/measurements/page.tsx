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
  status: string | null;
  measurement_status: string | null;
  measurement_file_path: string | null;
  measurement_file_name: string | null;
  measurement_file_uploaded_at: string | null;
};

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

function StepPill({
  label,
  state = "upcoming",
}: {
  label: string;
  state?: "complete" | "active" | "upcoming";
}) {
  return (
    <div
      className={`rounded-md border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${
        state === "complete"
          ? "border-green-200 bg-green-50 text-green-700"
          : state === "active"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-white text-slate-400"
      }`}
    >
      {label}
    </div>
  );
}

export default function MeasurementPage() {
  const router = useRouter();
  const params = useParams();

  const estimateId =
    typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadEstimate() {
      if (!estimateId) return;

      const { data, error } = await supabase
        .from("estimates")
        .select(
          "id, customer_name, property_address, status, measurement_status, measurement_file_path, measurement_file_name, measurement_file_uploaded_at"
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

  function getPublicFileUrl(path: string | null) {
    if (!path) return null;

    const { data } = supabase.storage
      .from("measurement-reports")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function saveForLaterAndOpenQuickMeasure() {
    if (!estimate) return;

    setWorking(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("estimates")
      .update({
        status: "Draft - Pending Measurements",
        measurement_status: "Ordered",
      })
      .eq("id", estimate.id);

    setWorking(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    window.location.href = "https://quickmeasure.gaf.com/guest-home-page";
  }

  async function saveMeasurementsAndContinue() {
    if (!estimate) return;

    setWorking(true);
    setErrorMessage("");

    if (!selectedFile && estimate.measurement_file_path) {
      setWorking(false);
      router.push(`/estimates/${estimate.id}/questions`);
      return;
    }

    if (!selectedFile) {
      setWorking(false);
      setErrorMessage(
        "Upload a measurement report or save this estimate for later and order measurements."
      );
      return;
    }

    const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const filePath = `${estimate.id}/${Date.now()}-${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("measurement-reports")
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      setWorking(false);
      setErrorMessage(uploadError.message);
      return;
    }

    const uploadedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("estimates")
      .update({
        status: "Draft - Pending Information",
        measurement_status: "Uploaded",
        measurement_file_path: filePath,
        measurement_file_name: selectedFile.name,
        measurement_file_uploaded_at: uploadedAt,
      })
      .eq("id", estimate.id);

    setWorking(false);

    if (updateError) {
      setErrorMessage(updateError.message);
      return;
    }

    router.push(`/estimates/${estimate.id}/questions`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="rounded-lg bg-white p-4 text-sm font-semibold shadow">
          Loading measurements...
        </div>
      </main>
    );
  }

  if (!estimate) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="rounded-lg bg-white p-5 shadow">
          <h1 className="text-xl font-bold text-red-600">
            Estimate not found
          </h1>
          <Link
            href="/estimates"
            className="mt-5 inline-block rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white"
          >
            Back to Estimates
          </Link>
        </div>
      </main>
    );
  }

  const hasUploadedMeasurements = Boolean(estimate.measurement_file_path);
  const fileUrl = getPublicFileUrl(estimate.measurement_file_path);

  const primaryButtonLabel = hasUploadedMeasurements
    ? selectedFile
      ? "Replace Measurements & Continue"
      : "Continue to Job Questions"
    : selectedFile
    ? "Save Measurements & Continue"
    : "Save for Later & Open QuickMeasure";

  const primaryAction =
    !hasUploadedMeasurements && !selectedFile
      ? saveForLaterAndOpenQuickMeasure
      : saveMeasurementsAndContinue;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <AppSidebar active="Estimates" />

        <section className="min-h-screen min-w-0 flex-1 p-5 lg:ml-[var(--sidebar-width)]">
          <div className="mx-auto max-w-5xl">
            <div className="mb-5 border-b border-slate-300 pb-5">
              <button
                onClick={() => router.push(`/estimates/${estimate.id}`)}
                className="mb-2 text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                ← Back to Estimate
              </button>

              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black text-slate-950">
                      Measurements
                    </h1>
                    <span className={getStatusBadge(estimate.status)}>
                      {estimate.status || "No Status"}
                    </span>
                  </div>

                  <p className="mt-1 max-w-4xl text-sm font-medium text-slate-600">
                    {estimate.customer_name || "Unnamed Customer"} ·{" "}
                    {estimate.property_address || "No address"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StepPill label="Customer" state="complete" />
                  <StepPill label="Measurements" state="active" />
                  <StepPill label="Questions" />
                  <StepPill label="Options" />
                  <StepPill label="Proposal" />
                  <StepPill label="Orders" />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                    Measurement Report
                  </h2>
                </div>

                <div className="space-y-4 p-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="text-[10px] font-black uppercase tracking-wide text-green-700">
                      Current Measurement Status
                    </div>
                    <div className="mt-1 text-sm font-black text-slate-900">
                      {estimate.measurement_status || "Not Set"}
                    </div>
                  </div>

                  {hasUploadedMeasurements && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="text-[10px] font-black uppercase tracking-wide text-green-700">
                        Uploaded File
                      </div>

                      <div className="mt-1 break-words text-sm font-black text-slate-900">
                        {estimate.measurement_file_name || "Measurement Report"}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-slate-600">
                        Uploaded:{" "}
                        {formatDate(estimate.measurement_file_uploaded_at)}
                      </div>

                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          className="mt-3 inline-flex rounded-md border border-green-300 bg-white px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-50"
                        >
                          View Uploaded File
                        </a>
                      )}
                    </div>
                  )}

                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5">
                    <div className="text-sm font-black text-slate-900">
                      {hasUploadedMeasurements
                        ? "Replace measurement report if needed"
                        : "Upload measurement report"}
                    </div>

                    <p className="mt-1 text-xs font-medium text-slate-600">
                      Upload the QuickMeasure PDF, XML, JSON, or CSV report.
                      Extraction and auto-fill can be added later.
                    </p>

                    <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 py-2.5 hover:bg-slate-50">
                      <span className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-black text-white">
                        Choose File
                      </span>

                      <span className="min-w-0 flex-1 truncate text-right text-xs font-bold text-slate-500">
                        {selectedFile
                          ? selectedFile.name
                          : hasUploadedMeasurements
                          ? "Optional replacement file"
                          : "No file selected"}
                      </span>

                      <input
                        type="file"
                        accept=".pdf,.xml,.json,.csv"
                        onChange={(event) =>
                          setSelectedFile(event.target.files?.[0] ?? null)
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Next Step
                    </h2>
                  </div>

                  <div className="space-y-3 p-4">
                    <p className="text-sm font-medium text-slate-600">
                      {!hasUploadedMeasurements && !selectedFile
                        ? "If the report is not ready, save this estimate for later and order measurements through QuickMeasure."
                        : "Save the measurement report and continue to job questions."}
                    </p>

                    <button
                      onClick={primaryAction}
                      disabled={working}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {working ? "Working..." : primaryButtonLabel}
                    </button>
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
