"use client";

import AppSidebar from "@/components/AppSidebar";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  job_type: string | null;

  roof_squares: number | null;
  waste_percent: number | null;
  waste_squares: number | null;
  pitch: string | null;
  stories: string | null;

  selected_option_name: string | null;
  selected_option_price: number | null;
  selected_option_data: Record<string, unknown> | null;

  orders_created_at: string | null;
  orders_sent_at: string | null;
  orders_notes: string | null;
  orders_notes_es: string | null;

  archived_at: string | null;
  archive_reason: string | null;

  material_order_data: Record<string, unknown>[] | null;
  labor_order_data: Record<string, unknown>[] | null;
  material_order_generated_at: string | null;
  labor_order_generated_at: string | null;

  production_contact_name: string | null;
  production_contact_phone: string | null;
  production_contact_email: string | null;
  delivery_date: string | null;
  install_start_date: string | null;
  install_end_date: string | null;
  supplier_notes: string | null;
  crew_notes: string | null;
  crew_notes_es: string | null;

  material_po_number: string | null;
  requested_delivery_window: string | null;
  delivery_method: string | null;
  product_placement: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;

  shingle_color: string | null;
  drip_edge_color: string | null;
  pipe_jack_color: string | null;
  spray_paint_color: string | null;
  box_vent_color: string | null;

  created_at: string | null;
};

type LineItem = {
  id: string;
  estimate_id: string | null;
  estimate_option_id: string | null;
  description: string | null;
  item_type: string | null;
  line_type: string | null;
  line_source: string | null;
  unit: string | null;
  measured_quantity: number | null;
  quantity: number | null;
  order_quantity: number | null;
  unit_cost: number | null;
  total_cost: number | null;
  sell_price: number | null;
  total_price: number | null;
  pricing_item_id: string | null;
  labor_item_id: string | null;
};

type OrderLine = {
  description: string;
  type: string;
  unit: string;
  quantity: number | null;
  orderQuantity: number | null;
  unitCost: number | null;
  totalCost: number | null;
};

const HDZ_SHINGLE_COLORS = [
  "Charcoal",
  "Shakewood",
  "Weathered Wood",
  "Hickory",
  "Pewter Gray",
  "Slate",
  "Barkwood",
  "Copper Canyon",
  "Birchwood",
  "Hunter Green",
  "Golden Amber",
  "Mission Brown",
  "Sierra Sand",
  "Midnight Mesa",
  "Cliffside",
  "Chestnut Valley",
];

const NATURAL_SHADOW_COLORS = [
  "Charcoal",
  "Shakewood",
  "Weathered Wood",
  "Hickory",
  "Pewter Gray",
  "Slate",
  "Barkwood",
];

const UHDZ_COLORS = [
  "Charcoal",
  "Shakewood",
  "Weathered Wood",
  "Pewter Gray",
  "Slate",
  "Barkwood",
];

const DRIP_EDGE_COLORS = [
  "Gray",
  "Terratone",
  "Black",
  "Sand",
  "White",
  "Bronze",
  "Tan",
  "Musket Brown",
  "Green",
  "Pebblestone",
  "Please match existing",
];

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not Priced";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getOrderSquares(estimate: {
  roof_squares: number | null;
  waste_squares: number | null;
}) {
  const roofSquares = Number(estimate.roof_squares || 0);
  const wasteSquares = Number(estimate.waste_squares || 0);

  if (!roofSquares && !wasteSquares) return null;

  return roofSquares + wasteSquares;
}

function getShingleColorOptions(estimate: Estimate | null) {
  const selectedText = `${estimate?.selected_option_name || ""} ${JSON.stringify(
    estimate?.selected_option_data || {}
  )}`.toLowerCase();

  if (selectedText.includes("natural shadow") || selectedText.includes("ns")) {
    return NATURAL_SHADOW_COLORS;
  }

  if (selectedText.includes("uhdz")) {
    return UHDZ_COLORS;
  }

  if (selectedText.includes("hdz")) {
    return HDZ_SHINGLE_COLORS;
  }

  return HDZ_SHINGLE_COLORS;
}

function getStatusBadge(status: string | null) {
  const base = "rounded-md px-3 py-1 text-xs font-semibold";

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
    case "Archived":
      return `${base} bg-slate-900 text-white`;
    case "Lost":
      return `${base} bg-slate-200 text-slate-700`;
    default:
      return `${base} bg-slate-100 text-slate-600`;
  }
}

function readString(data: Record<string, unknown> | null, keys: string[]) {
  if (!data) return null;

  for (const key of keys) {
    const value = data[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

function readNumber(data: Record<string, unknown> | null, keys: string[]) {
  if (!data) return null;

  for (const key of keys) {
    const value = data[key];

    if (typeof value === "number") return value;

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return null;
}

function normalizeOrderLine(line: LineItem): OrderLine {
  return {
    description: line.description || "Unnamed line item",
    type: line.item_type || line.line_type || "Other",
    unit: line.unit || "EA",
    quantity: line.quantity ?? line.measured_quantity ?? null,
    orderQuantity:
      line.order_quantity ?? line.quantity ?? line.measured_quantity ?? null,
    unitCost: line.unit_cost ?? null,
    totalCost: line.total_cost ?? null,
  };
}

function isLaborLine(line: LineItem) {
  const type = `${line.item_type || ""} ${line.line_type || ""} ${
    line.line_source || ""
  }`.toLowerCase();

  return Boolean(line.labor_item_id) || type.includes("labor");
}

function isMaterialLine(line: LineItem) {
  const type = `${line.item_type || ""} ${line.line_type || ""} ${
    line.line_source || ""
  }`.toLowerCase();

  return (
    Boolean(line.pricing_item_id) ||
    type.includes("material") ||
    type.includes("product") ||
    type.includes("pricing")
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const params = useParams();

  const estimateId =
    typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [generatingOrders, setGeneratingOrders] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [hasLoadedInitialForm, setHasLoadedInitialForm] = useState(false);

  const [productionContactName, setProductionContactName] = useState("");
  const [productionContactPhone, setProductionContactPhone] = useState("");
  const [productionContactEmail, setProductionContactEmail] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [installStartDate, setInstallStartDate] = useState("");
  const [installEndDate, setInstallEndDate] = useState("");

  const [supplierNotes, setSupplierNotes] = useState("");
  const [crewNotes, setCrewNotes] = useState("");
  const [crewNotesEs, setCrewNotesEs] = useState("");
  const [ordersNotes, setOrdersNotes] = useState("");
  const [ordersNotesEs, setOrdersNotesEs] = useState("");
  const [archiveReason, setArchiveReason] = useState("");

  const [materialPoNumber, setMaterialPoNumber] = useState("");
  const [requestedDeliveryWindow, setRequestedDeliveryWindow] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [productPlacement, setProductPlacement] = useState("");
  const [primaryContactName, setPrimaryContactName] = useState("");
  const [primaryContactEmail, setPrimaryContactEmail] = useState("");
  const [primaryContactPhone, setPrimaryContactPhone] = useState("");

  const [shingleColor, setShingleColor] = useState("");
  const [dripEdgeColor, setDripEdgeColor] = useState("");
  const [pipeJackColor, setPipeJackColor] = useState("");
  const [sprayPaintColor, setSprayPaintColor] = useState("");
  const [boxVentColor, setBoxVentColor] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadPage() {
      if (!estimateId) return;

      const { data: estimateData, error: estimateError } = await supabase
        .from("estimates")
        .select(
          [
            "id",
            "customer_name",
            "property_address",
            "customer_phone",
            "customer_email",
            "sales_rep",
            "status",
            "job_type",
            "roof_squares",
            "waste_percent",
            "waste_squares",
            "pitch",
            "stories",
            "selected_option_name",
            "selected_option_price",
            "selected_option_data",
            "orders_created_at",
            "orders_sent_at",
            "orders_notes",
            "orders_notes_es",
            "archived_at",
            "archive_reason",
            "material_order_data",
            "labor_order_data",
            "material_order_generated_at",
            "labor_order_generated_at",
            "production_contact_name",
            "production_contact_phone",
            "production_contact_email",
            "delivery_date",
            "install_start_date",
            "install_end_date",
            "supplier_notes",
            "crew_notes",
            "crew_notes_es",
            "material_po_number",
            "requested_delivery_window",
            "delivery_method",
            "product_placement",
            "primary_contact_name",
            "primary_contact_email",
            "primary_contact_phone",
            "shingle_color",
            "drip_edge_color",
            "pipe_jack_color",
            "spray_paint_color",
            "box_vent_color",
            "created_at",
          ].join(", ")
        )
        .eq("id", estimateId)
        .single();

      if (estimateError) {
        setErrorMessage(estimateError.message);
        setLoading(false);
        return;
      }

      const loadedEstimate = estimateData as Estimate;
      setEstimate(loadedEstimate);

      setProductionContactName(loadedEstimate.production_contact_name ?? "");
      setProductionContactPhone(loadedEstimate.production_contact_phone ?? "");
      setProductionContactEmail(loadedEstimate.production_contact_email ?? "");
      setDeliveryDate(loadedEstimate.delivery_date ?? "");
      setInstallStartDate(loadedEstimate.install_start_date ?? "");
      setInstallEndDate(loadedEstimate.install_end_date ?? "");

      setSupplierNotes(loadedEstimate.supplier_notes ?? "");
      setCrewNotes(loadedEstimate.crew_notes ?? "");
      setCrewNotesEs(loadedEstimate.crew_notes_es ?? "");
      setOrdersNotes(loadedEstimate.orders_notes ?? "");
      setOrdersNotesEs(loadedEstimate.orders_notes_es ?? "");
      setArchiveReason(loadedEstimate.archive_reason ?? "");

      setMaterialPoNumber(loadedEstimate.material_po_number ?? "");
      setRequestedDeliveryWindow(
        loadedEstimate.requested_delivery_window ?? ""
      );
      setDeliveryMethod(loadedEstimate.delivery_method ?? "");
      setProductPlacement(loadedEstimate.product_placement ?? "");
      setPrimaryContactName(loadedEstimate.primary_contact_name ?? "");
      setPrimaryContactEmail(loadedEstimate.primary_contact_email ?? "");
      setPrimaryContactPhone(loadedEstimate.primary_contact_phone ?? "");

      setShingleColor(loadedEstimate.shingle_color ?? "");
      setDripEdgeColor(loadedEstimate.drip_edge_color ?? "");
      setPipeJackColor(loadedEstimate.pipe_jack_color ?? "");
      setSprayPaintColor(loadedEstimate.spray_paint_color ?? "");
      setBoxVentColor(loadedEstimate.box_vent_color ?? "");

      const { data: lineData, error: lineError } = await supabase
        .from("estimate_line_items")
        .select(
          [
            "id",
            "estimate_id",
            "estimate_option_id",
            "description",
            "item_type",
            "line_type",
            "line_source",
            "unit",
            "measured_quantity",
            "quantity",
            "order_quantity",
            "unit_cost",
            "total_cost",
            "sell_price",
            "total_price",
            "pricing_item_id",
            "labor_item_id",
          ].join(", ")
        )
        .eq("estimate_id", estimateId)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("description", { ascending: true });

      if (lineError) {
        setErrorMessage(lineError.message);
      } else {
        setLineItems((lineData ?? []) as LineItem[]);
      }

      setHasLoadedInitialForm(true);
      setLoading(false);
    }

    loadPage();
  }, [estimateId]);

  useEffect(() => {
    if (!estimate?.id || !hasLoadedInitialForm) return;

    setAutosaveStatus("saving");

    const timeout = window.setTimeout(async () => {
      const updateData = {
        production_contact_name: productionContactName.trim() || null,
        production_contact_phone: productionContactPhone.trim() || null,
        production_contact_email: productionContactEmail.trim() || null,
        delivery_date: deliveryDate || null,
        install_start_date: installStartDate || null,
        install_end_date: installEndDate || null,

        supplier_notes: supplierNotes.trim() || null,
        crew_notes: crewNotes.trim() || null,
        crew_notes_es: crewNotesEs.trim() || null,
        orders_notes: ordersNotes.trim() || null,
        orders_notes_es: ordersNotesEs.trim() || null,
        archive_reason: archiveReason.trim() || null,

        material_po_number: materialPoNumber.trim() || null,
        requested_delivery_window: requestedDeliveryWindow.trim() || null,
        delivery_method: deliveryMethod.trim() || null,
        product_placement: productPlacement.trim() || null,
        primary_contact_name: primaryContactName.trim() || null,
        primary_contact_email: primaryContactEmail.trim() || null,
        primary_contact_phone: primaryContactPhone.trim() || null,

        shingle_color: shingleColor.trim() || null,
        drip_edge_color: dripEdgeColor.trim() || null,
        pipe_jack_color: pipeJackColor.trim() || null,
        spray_paint_color: sprayPaintColor.trim() || null,
        box_vent_color: boxVentColor.trim() || null,
      };

      const { error } = await supabase
        .from("estimates")
        .update(updateData)
        .eq("id", estimate.id);

      if (error) {
        setAutosaveStatus("error");
        setErrorMessage(error.message);
        return;
      }

      setEstimate((current) =>
        current
          ? {
              ...current,
              ...updateData,
            }
          : current
      );

      setAutosaveStatus("saved");
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [
    estimate?.id,
    hasLoadedInitialForm,
    productionContactName,
    productionContactPhone,
    productionContactEmail,
    deliveryDate,
    installStartDate,
    installEndDate,
    supplierNotes,
    crewNotes,
    crewNotesEs,
    ordersNotes,
    ordersNotesEs,
    archiveReason,
    materialPoNumber,
    requestedDeliveryWindow,
    deliveryMethod,
    productPlacement,
    primaryContactName,
    primaryContactEmail,
    primaryContactPhone,
    shingleColor,
    dripEdgeColor,
    pipeJackColor,
    sprayPaintColor,
    boxVentColor,
  ]);

  const selectedOptionId = useMemo(() => {
    return readString(estimate?.selected_option_data ?? null, [
      "estimate_option_id",
      "option_id",
      "id",
    ]);
  }, [estimate]);

  const selectedOptionLineItems = useMemo(() => {
    if (!selectedOptionId) {
      return [];
    }

    return lineItems.filter(
      (line) => line.estimate_option_id === selectedOptionId
    );
  }, [lineItems, selectedOptionId]);

  const materialLines = useMemo(() => {
    return selectedOptionLineItems
      .filter(isMaterialLine)
      .map(normalizeOrderLine);
  }, [selectedOptionLineItems]);

  const laborLines = useMemo(() => {
    return selectedOptionLineItems.filter(isLaborLine).map(normalizeOrderLine);
  }, [selectedOptionLineItems]);

  const otherLines = useMemo(() => {
    return selectedOptionLineItems
      .filter((line) => !isMaterialLine(line) && !isLaborLine(line))
      .map(normalizeOrderLine);
  }, [selectedOptionLineItems]);

  const materialCost = materialLines.reduce(
    (sum, line) => sum + (line.totalCost || 0),
    0
  );

  const laborCost = laborLines.reduce(
    (sum, line) => sum + (line.totalCost || 0),
    0
  );

  const orderSquares = estimate ? getOrderSquares(estimate) : null;

  const ordersAlreadyGenerated = Boolean(
    estimate?.material_order_generated_at && estimate?.labor_order_generated_at
  );

  const shingleColorOptions = getShingleColorOptions(estimate);

  async function updateOrderStatus(newStatus: string) {
    if (!estimate) return;

    setSavingStatus(true);
    setErrorMessage("");
    setSuccessMessage("");

    const updateData: Record<string, string | null> = {
      status: newStatus,
    };

    if (newStatus === "Orders Created") {
      updateData.orders_created_at =
        estimate.orders_created_at ?? new Date().toISOString();
    }

    if (newStatus === "Orders Sent") {
      updateData.orders_created_at =
        estimate.orders_created_at ?? new Date().toISOString();
      updateData.orders_sent_at =
        estimate.orders_sent_at ?? new Date().toISOString();
      updateData.archived_at = null;
    }

    if (newStatus === "Archived") {
      updateData.archived_at = new Date().toISOString();
      updateData.archive_reason = archiveReason.trim() || null;
    }

    if (newStatus === "Proposal Signed") {
      updateData.orders_created_at = null;
      updateData.orders_sent_at = null;
      updateData.archived_at = null;
    }

    const { error } = await supabase
      .from("estimates")
      .update(updateData)
      .eq("id", estimate.id);

    setSavingStatus(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setEstimate({
      ...estimate,
      status: newStatus,
      orders_created_at:
        newStatus === "Orders Created" || newStatus === "Orders Sent"
          ? updateData.orders_created_at
          : newStatus === "Proposal Signed"
          ? null
          : estimate.orders_created_at,
      orders_sent_at:
        newStatus === "Orders Sent"
          ? updateData.orders_sent_at
          : newStatus === "Proposal Signed"
          ? null
          : estimate.orders_sent_at,
      archived_at:
        newStatus === "Archived"
          ? updateData.archived_at
          : newStatus === "Orders Sent" || newStatus === "Proposal Signed"
          ? null
          : estimate.archived_at,
      archive_reason:
        newStatus === "Archived"
          ? updateData.archive_reason
          : estimate.archive_reason,
    });

    setSuccessMessage(`Status updated to ${newStatus}.`);
  }

  async function generateOrderSnapshots() {
    if (!estimate) return;

    setGeneratingOrders(true);
    setErrorMessage("");
    setSuccessMessage("");

    const generatedAt = new Date().toISOString();

    const { error } = await supabase
      .from("estimates")
      .update({
        material_order_data: materialLines,
        labor_order_data: laborLines,
        material_order_generated_at: generatedAt,
        labor_order_generated_at: generatedAt,
        status:
          estimate.status === "Proposal Signed"
            ? "Orders Created"
            : estimate.status,
        orders_created_at: estimate.orders_created_at ?? generatedAt,
      })
      .eq("id", estimate.id);

    setGeneratingOrders(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setEstimate({
      ...estimate,
      material_order_data: materialLines as unknown as Record<string, unknown>[],
      labor_order_data: laborLines as unknown as Record<string, unknown>[],
      material_order_generated_at: generatedAt,
      labor_order_generated_at: generatedAt,
      status:
        estimate.status === "Proposal Signed"
          ? "Orders Created"
          : estimate.status,
      orders_created_at: estimate.orders_created_at ?? generatedAt,
    });

    setSuccessMessage("Material and labor order snapshots generated.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="rounded-xl bg-white p-6 shadow">Loading orders...</div>
      </main>
    );
  }

  if (!estimate) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          Estimate not found.
        </div>
      </main>
    );
  }

  const selectedData = estimate.selected_option_data;

  const optionCost = readNumber(selectedData, [
    "total_cost",
    "subtotal_cost",
    "cost",
    "option_cost",
  ]);

  const canCreateOrders =
    estimate.status === "Proposal Signed" ||
    estimate.status === "Orders Created" ||
    estimate.status === "Orders Sent" ||
    estimate.status === "Archived";

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <AppSidebar active="Estimates" />

        <section className="min-h-screen flex-1 p-6 lg:ml-[var(--sidebar-width)]">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <button
                onClick={() => router.push(`/estimates/${estimate.id}`)}
                className="mb-3 text-sm font-bold text-slate-600 hover:text-slate-900"
              >
                ← Back to Estimate
              </button>

              <h1 className="text-4xl font-bold text-slate-900">Orders</h1>

              <p className="mt-1 text-lg text-slate-600">
                {estimate.customer_name || "Unnamed Customer"} ·{" "}
                {estimate.property_address || "No address"}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 xl:items-end">
              <span className={getStatusBadge(estimate.status)}>
                {estimate.status || "No Status"}
              </span>

              <div className="rounded-lg bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200">
                <div className="font-bold text-slate-900">
                  Autosave:{" "}
                  {autosaveStatus === "saving"
                    ? "Saving..."
                    : autosaveStatus === "saved"
                    ? "Saved"
                    : autosaveStatus === "error"
                    ? "Error"
                    : "Ready"}
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-700">
              {successMessage}
            </div>
          )}

          {estimate.selected_option_name && !selectedOptionId && (
            <div className="mb-6 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              Selected option is saved, but no estimate_option_id was found in
              selected_option_data. Orders cannot be filtered to the selected
              package yet.
            </div>
          )}

          {!estimate.selected_option_name ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                No selected option
              </h2>
              <p className="mt-2 text-slate-600">
                Select an option before creating orders.
              </p>

              <Link
                href={`/estimates/${estimate.id}/options`}
                className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                Go to Estimate Options
              </Link>
            </div>
          ) : !canCreateOrders ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                Proposal must be signed first
              </h2>
              <p className="mt-2 text-slate-600">
                Orders can only be created after the proposal is marked signed.
              </p>

              <Link
                href={`/estimates/${estimate.id}/proposal`}
                className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                Go to Proposal
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      Order Summary
                    </h2>
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-4">
                    <SummaryMetric
                      label="Selected Package"
                      value={estimate.selected_option_name || "Not selected"}
                    />

                    <SummaryMetric
                      label="Customer Price"
                      value={formatMoney(estimate.selected_option_price)}
                    />

                    <SummaryMetric
                      label="Estimated Cost"
                      value={formatMoney(optionCost)}
                    />

                    <SummaryMetric
                      label="Job Type"
                      value={estimate.job_type || "Not set"}
                    />

                    <SummaryMetric
                      label="Roof Squares"
                      value={
                        estimate.roof_squares
                          ? `${formatNumber(estimate.roof_squares)} SQ`
                          : "Not entered"
                      }
                    />

                    <SummaryMetric
                      label="Waste Squares"
                      value={
                        estimate.waste_squares
                          ? `${formatNumber(estimate.waste_squares)} SQ`
                          : "Not entered"
                      }
                    />

                    <SummaryMetric
                      label="Order Squares"
                      value={
                        orderSquares
                          ? `${formatNumber(orderSquares)} SQ`
                          : "Not entered"
                      }
                    />

                    <SummaryMetric
                      label="Waste Percent"
                      value={
                        estimate.waste_percent
                          ? `${formatNumber(estimate.waste_percent)}%`
                          : "Not entered"
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      Material Order Details
                    </h2>
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-3">
                    <TextField
                      label="Material PO Number"
                      value={materialPoNumber}
                      onChange={setMaterialPoNumber}
                      placeholder="Example: Rhoades-949-MAT"
                    />

                    <TextField
                      label="Requested Delivery Window"
                      value={requestedDeliveryWindow}
                      onChange={setRequestedDeliveryWindow}
                      placeholder="Example: Anytime, AM, PM"
                    />

                    <TextField
                      label="Delivery Method"
                      value={deliveryMethod}
                      onChange={setDeliveryMethod}
                      placeholder="Example: Roof Load"
                    />

                    <TextField
                      label="Product Placement"
                      value={productPlacement}
                      onChange={setProductPlacement}
                      placeholder="Example: Roof load"
                    />

                    <TextField
                      label="Primary Contact Name"
                      value={primaryContactName}
                      onChange={setPrimaryContactName}
                      placeholder="Example: Brandon Johnson"
                    />

                    <TextField
                      label="Primary Contact Phone"
                      value={primaryContactPhone}
                      onChange={setPrimaryContactPhone}
                      placeholder="850-503-6720"
                    />

                    <TextField
                      label="Primary Contact Email"
                      value={primaryContactEmail}
                      onChange={setPrimaryContactEmail}
                      placeholder="bjohnson@elkstonegc.com"
                    />
                  </div>

                  <div className="grid gap-4 border-t border-slate-200 p-5 md:grid-cols-3">
                    <SelectField
                      label="Shingle / Hip / Ridge Color"
                      value={shingleColor}
                      onChange={setShingleColor}
                      options={shingleColorOptions}
                      placeholder="Select shingle color"
                    />

                    <SelectField
                      label="Drip Edge Color"
                      value={dripEdgeColor}
                      onChange={setDripEdgeColor}
                      options={DRIP_EDGE_COLORS}
                      placeholder="Select drip edge color"
                    />

                    <TextField
                      label="Pipe Jack Color"
                      value={pipeJackColor}
                      onChange={setPipeJackColor}
                      placeholder="Example: Black"
                    />

                    <TextField
                      label="Spray Paint Color"
                      value={sprayPaintColor}
                      onChange={setSprayPaintColor}
                      placeholder="Example: Black"
                    />

                    <TextField
                      label="Box Vent Color"
                      value={boxVentColor}
                      onChange={setBoxVentColor}
                      placeholder="Example: Black"
                    />
                  </div>

                  <div className="border-t border-slate-200 p-5">
                    <TextAreaField
                      label="Supplier / Material Notes"
                      value={supplierNotes}
                      onChange={setSupplierNotes}
                      placeholder="Confirm colors, delivery details, ridge vent, intake vent, lower porch full ice and water, etc."
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      Production & Install Information
                    </h2>
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-3">
                    <TextField
                      label="Production Contact"
                      value={productionContactName}
                      onChange={setProductionContactName}
                      placeholder="Example: Devin Ross"
                    />

                    <TextField
                      label="Production Phone"
                      value={productionContactPhone}
                      onChange={setProductionContactPhone}
                      placeholder="801-000-0000"
                    />

                    <TextField
                      label="Production Email"
                      value={productionContactEmail}
                      onChange={setProductionContactEmail}
                      placeholder="name@company.com"
                    />

                    <DateField
                      label="Delivery Date"
                      value={deliveryDate}
                      onChange={setDeliveryDate}
                    />

                    <DateField
                      label="Install Start Date"
                      value={installStartDate}
                      onChange={setInstallStartDate}
                    />

                    <DateField
                      label="Install End Date"
                      value={installEndDate}
                      onChange={setInstallEndDate}
                    />
                  </div>

                  <div className="grid gap-4 border-t border-slate-200 p-5 md:grid-cols-2">
                    <TextAreaField
                      label="Crew Notes - English"
                      value={crewNotes}
                      onChange={setCrewNotes}
                      placeholder="Install notes, access notes, crew instructions..."
                    />

                    <TextAreaField
                      label="Crew Notes - Spanish"
                      value={crewNotesEs}
                      onChange={setCrewNotesEs}
                      placeholder="Notas de instalación, acceso o instrucciones para la cuadrilla..."
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      Material Order Preview
                    </h2>
                  </div>

                  <OrderTable
                    lines={materialLines}
                    emptyMessage={
                      selectedOptionId
                        ? "No material lines found for the selected option."
                        : "No selected option ID found."
                    }
                  />

                  <div className="border-t border-slate-200 px-5 py-4 text-right text-sm font-bold text-slate-900">
                    Material Cost: {formatMoney(materialCost)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      Labor Order Preview
                    </h2>
                  </div>

                  <OrderTable
                    lines={laborLines}
                    emptyMessage={
                      selectedOptionId
                        ? "No labor lines found for the selected option."
                        : "No selected option ID found."
                    }
                  />

                  <div className="border-t border-slate-200 px-5 py-4 text-right text-sm font-bold text-slate-900">
                    Labor Cost: {formatMoney(laborCost)}
                  </div>
                </div>

                {otherLines.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                        Other / Custom Lines
                      </h2>
                    </div>

                    <OrderTable
                      lines={otherLines}
                      emptyMessage="No other lines found."
                    />
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      General Order Notes
                    </h2>
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    <TextAreaField
                      label="General Order Notes - English"
                      value={ordersNotes}
                      onChange={setOrdersNotes}
                      placeholder="General order notes..."
                    />

                    <TextAreaField
                      label="General Order Notes - Spanish"
                      value={ordersNotesEs}
                      onChange={setOrdersNotesEs}
                      placeholder="Notas generales de la orden en español..."
                    />
                  </div>
                </div>
              </div>

              <aside className="space-y-6">
                {!ordersAlreadyGenerated && estimate.status !== "Archived" && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                        Generate Orders
                      </h2>
                    </div>

                    <div className="space-y-3 p-5">
                      <button
                        onClick={generateOrderSnapshots}
                        disabled={generatingOrders || !selectedOptionId}
                        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {generatingOrders
                          ? "Generating..."
                          : "Generate Material & Labor Orders"}
                      </button>

                      <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Generate snapshots before sending orders.
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      Quick Links
                    </h2>
                  </div>

                  <div className="space-y-3 p-5">
                    <Link
                      href={`/estimates/${estimate.id}/orders/material`}
                      className="block rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white hover:bg-slate-800"
                    >
                      View Material Order
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}/orders/labor`}
                      className="block rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-blue-700"
                    >
                      View Labor Order
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}/proposal`}
                      className="block rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Proposal
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}/options`}
                      className="block rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Estimate Options
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}`}
                      className="block rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Estimate Detail
                    </Link>

                    <Link
                      href="/estimates"
                      className="block rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      All Estimates
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      Order Actions
                    </h2>
                  </div>

                  <div className="space-y-3 p-5">
                    {estimate.status === "Proposal Signed" && (
                      <button
                        onClick={() => updateOrderStatus("Orders Created")}
                        disabled={savingStatus}
                        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Mark Orders Created
                      </button>
                    )}

                    {estimate.status === "Orders Created" && (
                      <>
                        <button
                          onClick={() => updateOrderStatus("Orders Sent")}
                          disabled={savingStatus}
                          className="w-full rounded-lg bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Mark Orders Sent
                        </button>

                        <button
                          onClick={() => updateOrderStatus("Proposal Signed")}
                          disabled={savingStatus}
                          className="w-full rounded-lg border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                        >
                          Revert to Proposal Signed
                        </button>
                      </>
                    )}

                    {estimate.status === "Orders Sent" && (
                      <>
                        <TextAreaField
                          label="Archive Reason"
                          value={archiveReason}
                          onChange={setArchiveReason}
                          placeholder="Example: Job completed and closed out."
                        />

                        <button
                          onClick={() => updateOrderStatus("Archived")}
                          disabled={savingStatus}
                          className="w-full rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          Archive Job
                        </button>

                        <button
                          onClick={() => updateOrderStatus("Orders Created")}
                          disabled={savingStatus}
                          className="w-full rounded-lg border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                        >
                          Revert to Orders Created
                        </button>
                      </>
                    )}

                    {estimate.status === "Archived" && (
                      <>
                        <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                          This job is archived.
                        </div>

                        <button
                          onClick={() => updateOrderStatus("Orders Sent")}
                          disabled={savingStatus}
                          className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Reopen to Orders Sent
                        </button>
                      </>
                    )}

                    {savingStatus && (
                      <p className="text-center text-sm font-semibold text-slate-500">
                        Saving status...
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      Material Order Summary
                    </h2>
                  </div>

                  <div className="space-y-3 p-5 text-sm">
                    <InfoRow label="PO #" value={estimate.material_po_number} />
                    <InfoRow
                      label="Delivery Window"
                      value={estimate.requested_delivery_window}
                    />
                    <InfoRow
                      label="Delivery Method"
                      value={estimate.delivery_method}
                    />
                    <InfoRow
                      label="Product Placement"
                      value={estimate.product_placement}
                    />
                    <InfoRow
                      label="Primary Contact"
                      value={estimate.primary_contact_name}
                    />
                    <InfoRow
                      label="Primary Phone"
                      value={estimate.primary_contact_phone}
                    />
                    <InfoRow
                      label="Primary Email"
                      value={estimate.primary_contact_email}
                    />
                    <InfoRow
                      label="Shingle Color"
                      value={estimate.shingle_color}
                    />
                    <InfoRow
                      label="Drip Edge Color"
                      value={estimate.drip_edge_color}
                    />
                    <InfoRow
                      label="Pipe Jack Color"
                      value={estimate.pipe_jack_color}
                    />
                    <InfoRow
                      label="Spray Paint Color"
                      value={estimate.spray_paint_color}
                    />
                    <InfoRow
                      label="Box Vent Color"
                      value={estimate.box_vent_color}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      Production Summary
                    </h2>
                  </div>

                  <div className="space-y-3 p-5 text-sm">
                    <InfoRow
                      label="Contact"
                      value={estimate.production_contact_name}
                    />
                    <InfoRow
                      label="Phone"
                      value={estimate.production_contact_phone}
                    />
                    <InfoRow
                      label="Email"
                      value={estimate.production_contact_email}
                    />
                    <InfoRow
                      label="Delivery"
                      value={formatDate(estimate.delivery_date)}
                    />
                    <InfoRow
                      label="Install"
                      value={`${formatDate(
                        estimate.install_start_date
                      )} - ${formatDate(estimate.install_end_date)}`}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      Order Timeline
                    </h2>
                  </div>

                  <div className="space-y-4 p-5 text-sm">
                    <div>
                      <div className="font-bold text-slate-900">
                        Material Generated
                      </div>
                      <div className="text-slate-500">
                        {formatDate(estimate.material_order_generated_at)}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900">
                        Labor Generated
                      </div>
                      <div className="text-slate-500">
                        {formatDate(estimate.labor_order_generated_at)}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900">
                        Orders Created
                      </div>
                      <div className="text-slate-500">
                        {formatDate(estimate.orders_created_at)}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900">
                        Orders Sent
                      </div>
                      <div className="text-slate-500">
                        {formatDate(estimate.orders_sent_at)}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900">Archived</div>
                      <div className="text-slate-500">
                        {formatDate(estimate.archived_at)}
                      </div>
                    </div>

                    {estimate.archive_reason && (
                      <div>
                        <div className="font-bold text-slate-900">
                          Archive Reason
                        </div>
                        <div className="text-slate-500">
                          {estimate.archive_reason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-base font-black text-slate-900">{value}</div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-900">
        {value || "Not set"}
      </span>
    </div>
  );
}

function OrderTable({
  lines,
  emptyMessage,
}: {
  lines: OrderLine[];
  emptyMessage: string;
}) {
  if (lines.length === 0) {
    return (
      <div className="p-5">
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3">Description</th>
            <th className="px-5 py-3">Type</th>
            <th className="px-5 py-3">Unit</th>
            <th className="px-5 py-3">Qty</th>
            <th className="px-5 py-3">Order Qty</th>
            <th className="px-5 py-3">Unit Cost</th>
            <th className="px-5 py-3">Total Cost</th>
          </tr>
        </thead>

        <tbody>
          {lines.map((line, index) => (
            <tr
              key={`${line.description}-${index}`}
              className="border-b border-slate-100"
            >
              <td className="px-5 py-3 font-semibold text-slate-900">
                {line.description}
              </td>
              <td className="px-5 py-3 text-slate-600">{line.type}</td>
              <td className="px-5 py-3 text-slate-600">{line.unit}</td>
              <td className="px-5 py-3 text-slate-600">
                {formatNumber(line.quantity)}
              </td>
              <td className="px-5 py-3 font-bold text-slate-900">
                {formatNumber(line.orderQuantity)}
              </td>
              <td className="px-5 py-3 text-slate-600">
                {formatMoney(line.unitCost)}
              </td>
              <td className="px-5 py-3 font-bold text-slate-900">
                {formatMoney(line.totalCost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}