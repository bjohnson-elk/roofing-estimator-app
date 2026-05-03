"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Estimate = {
  id: string;
  customer_name: string | null;
  property_address: string | null;
  customer_phone: string | null;
  customer_email: string | null;

  selected_option_data: Record<string, unknown> | null;

  delivery_date: string | null;
  supplier_notes: string | null;
  created_at: string | null;

  material_po_number: string | null;
  requested_delivery_window: string | null;
  delivery_method: string | null;
  product_placement: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;

  production_contact_name: string | null;
  production_contact_phone: string | null;
  production_contact_email: string | null;

  shingle_color: string | null;
  drip_edge_color: string | null;
  pipe_jack_color: string | null;
  spray_paint_color: string | null;
  box_vent_color: string | null;
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
  sales_unit: string | null;
  quantity: number | null;
  order_quantity: number | null;
  pricing_item_id: string | null;
};

type MaterialLine = {
  description: string;
  salesUnit: string;
  orderQuantity: number | null;
  note: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Date(value).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
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

function buildColorNote(label: string, color: string | null) {
  if (!color?.trim()) return null;
  return `NOTE: ${color.trim()}`;
}

function getMaterialNote(description: string, estimate: Estimate) {
  const normalized = description.toLowerCase();

  if (normalized.includes("timberline") || normalized.includes("shingle")) {
    return buildColorNote("Shingle Color", estimate.shingle_color);
  }

  if (normalized.includes("drip edge")) {
    return buildColorNote("Drip Edge Color", estimate.drip_edge_color);
  }

  if (normalized.includes("pipe jack")) {
    return buildColorNote("Pipe Jack Color", estimate.pipe_jack_color);
  }

  if (normalized.includes("spray paint")) {
    return buildColorNote("Spray Paint Color", estimate.spray_paint_color);
  }

  if (normalized.includes("box vent")) {
    return buildColorNote("Box Vent Color", estimate.box_vent_color);
  }

  return null;
}

function normalizeMaterialLine(line: LineItem, estimate: Estimate): MaterialLine {
  const description = line.description || "Unnamed material item";

  return {
    description,
    salesUnit: line.sales_unit || line.unit || "EA",
    orderQuantity: line.order_quantity ?? line.quantity ?? null,
    note: getMaterialNote(description, estimate),
  };
}

function buildFallbackPoNumber(estimate: Estimate) {
  if (estimate.material_po_number?.trim()) {
    return estimate.material_po_number;
  }

  const namePart =
    estimate.customer_name
      ?.replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(-1)[0] || "Order";

  const addressPart =
    estimate.property_address
      ?.replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .join("-") || estimate.id.slice(0, 6);

  return `${namePart}-${addressPart}-MAT`;
}

function splitAddress(address: string | null) {
  if (!address) {
    return {
      line1: "Not set",
      line2: "",
    };
  }

  const parts = address.split(",").map((part) => part.trim());

  return {
    line1: parts[0] || address,
    line2: parts.slice(1).join(", "),
  };
}

export default function MaterialOrderPage() {
  const router = useRouter();
  const params = useParams();

  const estimateId =
    typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
            "selected_option_data",
            "delivery_date",
            "supplier_notes",
            "created_at",
            "material_po_number",
            "requested_delivery_window",
            "delivery_method",
            "product_placement",
            "primary_contact_name",
            "primary_contact_email",
            "primary_contact_phone",
            "production_contact_name",
            "production_contact_phone",
            "production_contact_email",
            "shingle_color",
            "drip_edge_color",
            "pipe_jack_color",
            "spray_paint_color",
            "box_vent_color",
          ].join(", ")
        )
        .eq("id", estimateId)
        .single();

      if (estimateError) {
        setErrorMessage(estimateError.message);
        setLoading(false);
        return;
      }

      setEstimate(estimateData as Estimate);

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
            "sales_unit",
            "quantity",
            "order_quantity",
            "pricing_item_id",
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

      setLoading(false);
    }

    loadPage();
  }, [estimateId]);

  const selectedOptionId = useMemo(() => {
    return readString(estimate?.selected_option_data ?? null, [
      "estimate_option_id",
      "option_id",
      "id",
    ]);
  }, [estimate]);

  const materialLines = useMemo(() => {
    if (!selectedOptionId || !estimate) return [];

    return lineItems
      .filter((line) => line.estimate_option_id === selectedOptionId)
      .filter(isMaterialLine)
      .map((line) => normalizeMaterialLine(line, estimate))
      .filter(
        (line) =>
          line.orderQuantity !== null &&
          line.orderQuantity !== undefined &&
          !Number.isNaN(line.orderQuantity) &&
          Number(line.orderQuantity) > 0
      );
  }, [lineItems, selectedOptionId, estimate]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          Loading material order...
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-red-600">
            Material order error
          </h1>
          <p className="mt-4 text-slate-700">{errorMessage}</p>
        </div>
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

  const siteAddress = splitAddress(estimate.property_address);
  const poNumber = buildFallbackPoNumber(estimate);

  const primaryName =
    estimate.primary_contact_name ||
    estimate.production_contact_name ||
    "Not set";

  const primaryEmail =
    estimate.primary_contact_email ||
    estimate.production_contact_email ||
    "Not set";

  const primaryPhone =
    estimate.primary_contact_phone ||
    estimate.production_contact_phone ||
    "Not set";

  const requestedDelivery = `${formatDate(estimate.delivery_date)}${
    estimate.requested_delivery_window
      ? ` - ${estimate.requested_delivery_window}`
      : ""
  }`;

  return (
    <main className="min-h-screen bg-slate-100 print:bg-white">
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0.45in;
          }

          html,
          body {
            background: white !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-document {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .print-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[760px] p-6 print:max-w-none print:p-0">
        <div className="no-print mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <button
            onClick={() => router.push(`/estimates/${estimate.id}/orders`)}
            className="text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            ← Back to Orders
          </button>

          <button
            onClick={() => window.print()}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            Print / Save PDF
          </button>
        </div>

        <div className="print-document bg-white p-8 text-[13px] leading-[1.25] text-slate-900 shadow-sm print:shadow-none">
          <section className="print-avoid-break">
            <div className="font-semibold">
              Elkstone Roofing and Construction
            </div>
            <div>859 W South Jordan Parkway</div>
            <div>Suite 101</div>
            <div>South Jordan, UT 84095</div>

            <div className="mt-5 font-semibold">Roofing Order (Material)</div>
            <div className="mt-1">
              <span className="font-semibold">PO #:</span> {poNumber}
            </div>
            <div>
              <span className="font-semibold">Submitted:</span>{" "}
              {formatDate(new Date().toISOString())}
            </div>
            <div>
              <span className="font-semibold">Requested Delivery:</span>{" "}
              {requestedDelivery}
            </div>
          </section>

          <section className="mt-4">
            {materialLines.length === 0 ? (
              <div className="rounded border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                {selectedOptionId
                  ? "No material lines found for this selected option."
                  : "No selected option ID found."}
              </div>
            ) : (
              <table className="w-full border-collapse text-[13px] leading-[1.2]">
                <thead>
                  <tr className="text-left">
                    <th className="w-[54px] pb-1 pr-2 font-semibold">Qty</th>
                    <th className="w-[48px] pb-1 pr-2 font-semibold">U/M</th>
                    <th className="pb-1 font-semibold">Description</th>
                  </tr>
                </thead>

                <tbody>
                  {materialLines.map((line, index) => (
                    <tr
                      key={`${line.description}-${index}`}
                      className="align-top"
                    >
                      <td className="py-[2px] pr-2">
                        {formatNumber(line.orderQuantity)}
                      </td>
                      <td className="py-[2px] pr-2">{line.salesUnit}</td>
                      <td className="py-[2px]">
                        <div>{line.description}</div>
                        {line.note && (
                          <div className="pl-0 text-[12px] leading-[1.15] text-slate-900">
                            {line.note}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="print-avoid-break mt-5">
            <div className="font-semibold">Site Information</div>

            <div className="mt-2 grid grid-cols-2 gap-x-14 gap-y-3">
              <InfoBlock title="Customer Contact">
                <div>{estimate.customer_name || "Not set"}</div>
                <div>{siteAddress.line1}</div>
                {siteAddress.line2 && <div>{siteAddress.line2}</div>}
                {estimate.customer_phone && (
                  <div>{estimate.customer_phone}</div>
                )}
                {estimate.customer_email && (
                  <div>{estimate.customer_email}</div>
                )}
              </InfoBlock>

              <InfoBlock title="Method">
                <div>{estimate.delivery_method || "Not set"}</div>
              </InfoBlock>

              <InfoBlock title="Product Placement">
                <div>{estimate.product_placement || "Not set"}</div>
              </InfoBlock>

              <InfoBlock title="Primary Contact">
                <div>{primaryName}</div>
                <div>{primaryEmail}</div>
                <div>{primaryPhone}</div>
              </InfoBlock>
            </div>
          </section>

          <section className="print-avoid-break mt-4">
            <div>
              <span className="font-semibold">Material Notes:</span>{" "}
              {estimate.supplier_notes || "No material notes entered."}
            </div>
          </section>

          <section className="print-avoid-break mt-4">
            <div className="font-semibold">{poNumber}</div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-semibold">{title}</div>
      <div>{children}</div>
    </div>
  );
}