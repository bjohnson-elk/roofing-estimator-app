"use client";

import Link from "next/link";
import { useState } from "react";

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "success"; optionCount: number; lineItemCount: number }
  | { status: "error"; message: string };

export default function SaveV2PreviewOptions({
  estimateId,
  optionCount,
  lineItemCount,
}: {
  estimateId: string;
  optionCount: number;
  lineItemCount: number;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const canSave = confirmation === "SAVE V2" && saveState.status !== "saving";

  async function savePreviewOptions() {
    if (!canSave) return;

    setSaveState({ status: "saving" });

    const response = await fetch("/pricing-v2/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        estimateId,
        confirmation,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | {
          optionCount?: number;
          lineItemCount?: number;
          error?: string;
        }
      | null;

    if (!response.ok) {
      setSaveState({
        status: "error",
        message: payload?.error ?? "Could not save v2 preview options.",
      });
      return;
    }

    setSaveState({
      status: "success",
      optionCount: payload?.optionCount ?? 0,
      lineItemCount: payload?.lineItemCount ?? 0,
    });
    setConfirmation("");
  }

  return (
    <section className="mt-8 rounded-lg border border-blue-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-xl font-black text-slate-950">
            Save V2 Preview Options
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-600">
            This replaces only prior v2 preview rows for this estimate. Existing
            non-v2 options, proposal config, selected option, estimate status,
            and catalog data are left unchanged.
          </p>
          <p className="mt-2 text-xs font-bold text-slate-500">
            Preview contains {optionCount} options and {lineItemCount} line
            items.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
            Type SAVE V2 to enable
          </label>
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
            placeholder="SAVE V2"
          />
          <button
            type="button"
            onClick={savePreviewOptions}
            disabled={!canSave}
            className="mt-2 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500"
          >
            {saveState.status === "saving"
              ? "Saving..."
              : "Save V2 Preview Options"}
          </button>
        </div>
      </div>

      {saveState.status === "success" ? (
        <div className="mt-4 rounded-md bg-green-50 p-3 text-sm font-semibold text-green-700">
          Saved {saveState.optionCount} options and {saveState.lineItemCount}{" "}
          line items.{" "}
          <Link
            href={`/estimates/${estimateId}/options`}
            className="font-black underline"
          >
            Open estimate options
          </Link>
        </div>
      ) : null}

      {saveState.status === "error" ? (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">
          {saveState.message}
        </div>
      ) : null}
    </section>
  );
}
