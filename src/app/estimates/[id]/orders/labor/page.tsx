"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Language = "en" | "es";

type Estimate = {
  id: string;
  customer_name: string | null;
  property_address: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  sales_rep: string | null;
  status: string | null;
  job_type: string | null;

  roof_area_sf: number | null;
  roof_squares: number | null;
  waste_percent: number | null;
  waste_squares: number | null;
  pitch: string | null;
  stories: string | null;

  eaves_lf: number | null;
  rakes_lf: number | null;
  hips_lf: number | null;
  ridges_lf: number | null;
  valleys_lf: number | null;
  flashing_lf: number | null;
  step_flashing_lf: number | null;
  drip_edge_lf: number | null;
  starter_lf: number | null;
  ridge_cap_lf: number | null;
  ice_water_lf: number | null;
  l_flashing_lf: number | null;
  counter_flashing_lf: number | null;
  ice_water_covered_squares: number | null;

  two_story_squares: number | null;
  three_story_squares: number | null;
  low_slope_squares: number | null;
  steep_slope_squares: number | null;
  pitch_9_10_squares: number | null;
  pitch_11_12_squares: number | null;
  pitch_13_14_squares: number | null;
  pitch_15_16_squares: number | null;

  report_snowcountry_vent_lf: number | null;
  report_ridge_runner_vent_lf: number | null;
  report_intake_vent_lf: number | null;

  selected_option_name: string | null;

  production_contact_name: string | null;
  production_contact_phone: string | null;
  production_contact_email: string | null;
  delivery_date: string | null;
  install_start_date: string | null;
  install_end_date: string | null;

  crew_notes: string | null;
  crew_notes_es: string | null;
  orders_notes: string | null;
  orders_notes_es: string | null;

  selected_option_data: Record<string, unknown> | null;
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
  labor_item_id: string | null;
};

type LaborLine = {
  description: string;
  unit: string;
  quantity: number | null;
  orderQuantity: number | null;
};

type MeasurementItem = {
  labelEn: string;
  labelEs: string;
  value: number | null;
  unit: string;
};

const documentLabels = {
  en: {
    title: "Labor Work Order",
    subtitle: "Crew-facing install instructions",
    projectInfo: "Project Information",
    customer: "Customer",
    propertyAddress: "Property Address",
    customerPhone: "Customer Phone",
    salesRep: "Sales Rep",
    productionContact: "Production Contact",
    productionPhone: "Production Phone",
    productionEmail: "Production Email",
    schedule: "Schedule",
    deliveryDate: "Delivery Date",
    installStart: "Install Start",
    installEnd: "Install End",
    roofInfo: "Roof Information",
    measurementSummary: "Labor Measurement Summary",
    selectedPackage: "Selected Package",
    roofSquares: "Roof Squares",
    orderSquares: "Order Squares",
    roofArea: "Roof Area",
    waste: "Waste",
    pitch: "Pitch",
    stories: "Stories",
    crewNotes: "Crew Notes",
    generalNotes: "General Order Notes",
    laborScope: "Labor Scope",
    description: "Description",
    quantity: "Quantity",
    orderQuantity: "Order Qty",
    unit: "Unit",
    noLaborLines: "No labor lines found for this selected option.",
    notSet: "Not set",
    importantNotes: "Important Notes",
    note1:
      "Review the full scope before starting work. Contact the production contact if anything does not match site conditions.",
    note2:
      "Do not perform extra work without approval from the company contact.",
    note3:
      "Take required photos before, during, and after installation as directed.",
    signature: "Crew Acknowledgment",
    signatureLine: "Crew Lead Signature",
    dateLine: "Date",
  },
  es: {
    title: "Orden de Trabajo de Mano de Obra",
    subtitle: "Instrucciones de instalación para la cuadrilla",
    projectInfo: "Información del Proyecto",
    customer: "Cliente",
    propertyAddress: "Dirección de la Propiedad",
    customerPhone: "Teléfono del Cliente",
    salesRep: "Vendedor",
    productionContact: "Contacto de Producción",
    productionPhone: "Teléfono de Producción",
    productionEmail: "Correo de Producción",
    schedule: "Calendario",
    deliveryDate: "Fecha de Entrega",
    installStart: "Inicio de Instalación",
    installEnd: "Fin de Instalación",
    roofInfo: "Información del Techo",
    measurementSummary: "Resumen de Medidas para Mano de Obra",
    selectedPackage: "Paquete Seleccionado",
    roofSquares: "Escuadras del Techo",
    orderSquares: "Escuadras con Desperdicio",
    roofArea: "Área del Techo",
    waste: "Desperdicio",
    pitch: "Inclinación",
    stories: "Pisos",
    crewNotes: "Notas para la Cuadrilla",
    generalNotes: "Notas Generales de la Orden",
    laborScope: "Alcance de Mano de Obra",
    description: "Descripción",
    quantity: "Cantidad",
    orderQuantity: "Cantidad de Orden",
    unit: "Unidad",
    noLaborLines: "No se encontraron líneas de mano de obra para esta opción.",
    notSet: "No establecido",
    importantNotes: "Notas Importantes",
    note1:
      "Revise todo el alcance antes de comenzar el trabajo. Comuníquese con el contacto de producción si algo no coincide con las condiciones del sitio.",
    note2:
      "No realice trabajo adicional sin aprobación del contacto de la compañía.",
    note3:
      "Tome las fotos requeridas antes, durante y después de la instalación según las instrucciones.",
    signature: "Confirmación de la Cuadrilla",
    signatureLine: "Firma del Líder de Cuadrilla",
    dateLine: "Fecha",
  },
};

function formatDate(value: string | null, language: Language) {
  if (!value) return documentLabels[language].notSet;

  return new Date(value).toLocaleDateString(
    language === "es" ? "es-US" : "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMeasurement(value: number | null, unit: string) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return `${formatNumber(value)} ${unit}`;
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

function isLaborLine(line: LineItem) {
  const type = `${line.item_type || ""} ${line.line_type || ""} ${
    line.line_source || ""
  }`.toLowerCase();

  return Boolean(line.labor_item_id) || type.includes("labor");
}

function normalizeLaborLine(line: LineItem): LaborLine {
  return {
    description: line.description || "Unnamed labor item",
    unit: line.unit || "EA",
    quantity: line.quantity ?? line.measured_quantity ?? null,
    orderQuantity:
      line.order_quantity ?? line.quantity ?? line.measured_quantity ?? null,
  };
}

function translateLaborDescription(description: string, language: Language) {
  if (language === "en") return description;

  const normalized = description.toLowerCase();

  if (normalized.includes("install shingles")) return "Instalar shingles";
  if (normalized.includes("tear off shingles")) return "Quitar shingles";
  if (normalized.includes("extra layer")) return "Capa adicional";
  if (normalized.includes("install ridge vent"))
    return "Instalar ventilación de cumbrera";
  if (normalized.includes("install intake vent"))
    return "Instalar ventilación de entrada";
  if (normalized.includes("install valley metal"))
    return "Instalar metal de valle";
  if (normalized.includes("install plywood")) return "Instalar plywood";
  if (normalized.includes("dump trailer")) return "Tráiler de basura";
  if (normalized.includes("two story")) return "Dos pisos";
  if (normalized.includes("three story")) return "Tres pisos";
  if (normalized.includes("build cricket")) return "Construir cricket";
  if (normalized.includes("counterflashing")) return "Instalar contra flashing";
  if (normalized.includes("standing seam")) return "Instalar standing seam";
  if (normalized.includes("tpo")) return "Instalar TPO";
  if (normalized.includes("wood shake")) return "Instalar wood shake";
  if (normalized.includes("davinci")) return "Instalar DaVinci";
  if (normalized.includes("designer")) return "Instalar shingle de diseñador";
  if (normalized.includes("manually load bundles"))
    return "Subir bundles manualmente";
  if (normalized.includes("solar")) return "Remover y reinstalar paneles solares";
  if (normalized.includes("gutters")) return "Quitar gutters";
  if (normalized.includes("downspout")) return "Quitar downspout";
  if (normalized.includes("swamp cooler")) return "Quitar swamp cooler";

  return description;
}

function getCrewNotes(estimate: Estimate, language: Language) {
  if (language === "en") {
    return estimate.crew_notes || documentLabels.en.notSet;
  }

  return estimate.crew_notes_es || "No Spanish crew notes entered.";
}

function getGeneralNotes(estimate: Estimate, language: Language) {
  if (language === "en") {
    return estimate.orders_notes || documentLabels.en.notSet;
  }

  return estimate.orders_notes_es || "No Spanish general notes entered.";
}

function getMeasurementItems(estimate: Estimate): MeasurementItem[] {
  return [
    {
      labelEn: "Eaves",
      labelEs: "Aleros",
      value: estimate.eaves_lf,
      unit: "LF",
    },
    {
      labelEn: "Rakes",
      labelEs: "Rakes / Bordes inclinados",
      value: estimate.rakes_lf,
      unit: "LF",
    },
    {
      labelEn: "Ridges",
      labelEs: "Cumbreras",
      value: estimate.ridges_lf,
      unit: "LF",
    },
    {
      labelEn: "Hips",
      labelEs: "Hips / Limatesas",
      value: estimate.hips_lf,
      unit: "LF",
    },
    {
      labelEn: "Valleys",
      labelEs: "Valles",
      value: estimate.valleys_lf,
      unit: "LF",
    },
    {
      labelEn: "Drip Edge",
      labelEs: "Drip Edge",
      value: estimate.drip_edge_lf,
      unit: "LF",
    },
    {
      labelEn: "Starter",
      labelEs: "Starter",
      value: estimate.starter_lf,
      unit: "LF",
    },
    {
      labelEn: "Ridge Cap",
      labelEs: "Ridge Cap",
      value: estimate.ridge_cap_lf,
      unit: "LF",
    },
    {
      labelEn: "Step Flashing",
      labelEs: "Step Flashing",
      value: estimate.step_flashing_lf,
      unit: "LF",
    },
    {
      labelEn: "Flashing",
      labelEs: "Flashing",
      value: estimate.flashing_lf,
      unit: "LF",
    },
    {
      labelEn: "L-Flashing",
      labelEs: "L-Flashing",
      value: estimate.l_flashing_lf,
      unit: "LF",
    },
    {
      labelEn: "Counter Flashing",
      labelEs: "Counter Flashing",
      value: estimate.counter_flashing_lf,
      unit: "LF",
    },
    {
      labelEn: "Ice & Water",
      labelEs: "Ice & Water",
      value: estimate.ice_water_lf,
      unit: "LF",
    },
    {
      labelEn: "Ice & Water Covered Area",
      labelEs: "Área cubierta con Ice & Water",
      value: estimate.ice_water_covered_squares,
      unit: "SQ",
    },
    {
      labelEn: "Two Story Area",
      labelEs: "Área de dos pisos",
      value: estimate.two_story_squares,
      unit: "SQ",
    },
    {
      labelEn: "Three Story Area",
      labelEs: "Área de tres pisos",
      value: estimate.three_story_squares,
      unit: "SQ",
    },
    {
      labelEn: "Low Slope Area",
      labelEs: "Área de baja inclinación",
      value: estimate.low_slope_squares,
      unit: "SQ",
    },
    {
      labelEn: "Steep Slope Area",
      labelEs: "Área inclinada",
      value: estimate.steep_slope_squares,
      unit: "SQ",
    },
    {
      labelEn: "9/12 - 10/12 Pitch Area",
      labelEs: "Área 9/12 - 10/12",
      value: estimate.pitch_9_10_squares,
      unit: "SQ",
    },
    {
      labelEn: "11/12 - 12/12 Pitch Area",
      labelEs: "Área 11/12 - 12/12",
      value: estimate.pitch_11_12_squares,
      unit: "SQ",
    },
    {
      labelEn: "13/12 - 14/12 Pitch Area",
      labelEs: "Área 13/12 - 14/12",
      value: estimate.pitch_13_14_squares,
      unit: "SQ",
    },
    {
      labelEn: "15/12 - 16/12 Pitch Area",
      labelEs: "Área 15/12 - 16/12",
      value: estimate.pitch_15_16_squares,
      unit: "SQ",
    },
    {
      labelEn: "SnowCountry Vent",
      labelEs: "Ventilación SnowCountry",
      value: estimate.report_snowcountry_vent_lf,
      unit: "LF",
    },
    {
      labelEn: "Ridge Runner Vent",
      labelEs: "Ventilación Ridge Runner",
      value: estimate.report_ridge_runner_vent_lf,
      unit: "LF",
    },
    {
      labelEn: "Intake Vent",
      labelEs: "Ventilación de entrada",
      value: estimate.report_intake_vent_lf,
      unit: "LF",
    },
  ].filter(
    (item) =>
      item.value !== null &&
      item.value !== undefined &&
      !Number.isNaN(item.value) &&
      Number(item.value) > 0
  );
}

export default function LaborOrderPage() {
  const router = useRouter();
  const params = useParams();

  const estimateId =
    typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [language, setLanguage] = useState<Language>("en");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const t = documentLabels[language];

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
            "roof_area_sf",
            "roof_squares",
            "waste_percent",
            "waste_squares",
            "pitch",
            "stories",
            "eaves_lf",
            "rakes_lf",
            "hips_lf",
            "ridges_lf",
            "valleys_lf",
            "flashing_lf",
            "step_flashing_lf",
            "drip_edge_lf",
            "starter_lf",
            "ridge_cap_lf",
            "ice_water_lf",
            "l_flashing_lf",
            "counter_flashing_lf",
            "ice_water_covered_squares",
            "two_story_squares",
            "three_story_squares",
            "low_slope_squares",
            "steep_slope_squares",
            "pitch_9_10_squares",
            "pitch_11_12_squares",
            "pitch_13_14_squares",
            "pitch_15_16_squares",
            "report_snowcountry_vent_lf",
            "report_ridge_runner_vent_lf",
            "report_intake_vent_lf",
            "selected_option_name",
            "selected_option_data",
            "production_contact_name",
            "production_contact_phone",
            "production_contact_email",
            "delivery_date",
            "install_start_date",
            "install_end_date",
            "crew_notes",
            "crew_notes_es",
            "orders_notes",
            "orders_notes_es",
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
            "measured_quantity",
            "quantity",
            "order_quantity",
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

  const laborLines = useMemo(() => {
    if (!selectedOptionId) return [];

    return lineItems
      .filter((line) => line.estimate_option_id === selectedOptionId)
      .filter(isLaborLine)
      .map(normalizeLaborLine);
  }, [lineItems, selectedOptionId]);

  const measurementItems = useMemo(() => {
    if (!estimate) return [];
    return getMeasurementItems(estimate);
  }, [estimate]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          Loading labor order...
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-red-600">
            Labor order error
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
            color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-document {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }

          .print-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-table {
            break-inside: auto;
          }

          .print-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-page-break {
            break-before: page;
            page-break-before: always;
          }
        }
      `}</style>

      <div className="mx-auto max-w-5xl p-6 print:max-w-none print:p-0">
        <div className="mb-6 flex flex-col gap-4 print:hidden md:flex-row md:items-center md:justify-between">
          <button
            onClick={() => router.push(`/estimates/${estimate.id}/orders`)}
            className="text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            ← Back to Orders
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex rounded-lg border border-slate-300 bg-white p-1 shadow-sm">
              <button
                onClick={() => setLanguage("en")}
                className={`rounded-md px-4 py-2 text-sm font-bold ${
                  language === "en"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                English
              </button>

              <button
                onClick={() => setLanguage("es")}
                className={`rounded-md px-4 py-2 text-sm font-bold ${
                  language === "es"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Spanish
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        <div className="print-document rounded-2xl bg-white p-8 shadow-sm print:shadow-none">
          <div className="print-section border-b border-slate-200 pb-5">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-sm font-black uppercase tracking-widest text-slate-500">
                  Elkstone Roofing & Construction
                </div>

                <h1 className="mt-3 text-4xl font-black text-slate-900 print:text-3xl">
                  {t.title}
                </h1>

                <p className="mt-2 text-slate-600">{t.subtitle}</p>
              </div>

              <div className="min-w-[220px] rounded-xl bg-slate-900 p-5 text-white print:p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {t.selectedPackage}
                </div>
                <div className="mt-1 text-lg font-black">
                  {estimate.selected_option_name || t.notSet}
                </div>
              </div>
            </div>
          </div>

          <div className="print-section">
            <SectionTitle title={t.projectInfo} />

            <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-3">
              <InfoBox
                label={t.customer}
                value={estimate.customer_name || t.notSet}
              />
              <InfoBox
                label={t.propertyAddress}
                value={estimate.property_address || t.notSet}
              />
              <InfoBox
                label={t.customerPhone}
                value={estimate.customer_phone || t.notSet}
              />
              <InfoBox
                label={t.salesRep}
                value={estimate.sales_rep || t.notSet}
              />
            </div>
          </div>

          <div className="print-section">
            <SectionTitle title={t.schedule} />

            <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3 print:gap-3">
              <InfoBox
                label={t.deliveryDate}
                value={formatDate(estimate.delivery_date, language)}
              />
              <InfoBox
                label={t.installStart}
                value={formatDate(estimate.install_start_date, language)}
              />
              <InfoBox
                label={t.installEnd}
                value={formatDate(estimate.install_end_date, language)}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3 print:grid-cols-3 print:gap-3">
              <InfoBox
                label={t.productionContact}
                value={estimate.production_contact_name || t.notSet}
              />
              <InfoBox
                label={t.productionPhone}
                value={estimate.production_contact_phone || t.notSet}
              />
              <InfoBox
                label={t.productionEmail}
                value={estimate.production_contact_email || t.notSet}
              />
            </div>
          </div>

          <div className="print-section">
            <SectionTitle title={t.roofInfo} />

            <div className="grid gap-4 md:grid-cols-5 print:grid-cols-5 print:gap-3">
              <InfoBox
                label={t.roofArea}
                value={
                  estimate.roof_area_sf
                    ? `${formatNumber(estimate.roof_area_sf)} SF`
                    : t.notSet
                }
              />
              <InfoBox
                label={t.roofSquares}
                value={
                  estimate.roof_squares
                    ? `${formatNumber(estimate.roof_squares)} SQ`
                    : t.notSet
                }
              />
              <InfoBox
                label={t.orderSquares}
                value={
                  estimate.waste_squares
                    ? `${formatNumber(estimate.waste_squares)} SQ`
                    : t.notSet
                }
              />
              <InfoBox
                label={t.waste}
                value={
                  estimate.waste_percent
                    ? `${formatNumber(estimate.waste_percent)}%`
                    : t.notSet
                }
              />
              <InfoBox label={t.pitch} value={estimate.pitch || t.notSet} />
            </div>
          </div>

          <div className="print-section">
            <SectionTitle title={t.measurementSummary} />

            {measurementItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                {language === "en"
                  ? "No detailed measurements entered."
                  : "No se ingresaron medidas detalladas."}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-4 print:grid-cols-4 print:gap-2">
                {measurementItems.map((item) => (
                  <MeasurementBox
                    key={`${item.labelEn}-${item.unit}`}
                    label={language === "en" ? item.labelEn : item.labelEs}
                    value={formatMeasurement(item.value, item.unit)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="print-section">
            <SectionTitle title={t.laborScope} />

            {laborLines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                {t.noLaborLines}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="print-table w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3 print:px-3 print:py-2">
                        {t.description}
                      </th>
                      <th className="px-5 py-3 print:px-3 print:py-2">
                        {t.quantity}
                      </th>
                      <th className="px-5 py-3 print:px-3 print:py-2">
                        {t.orderQuantity}
                      </th>
                      <th className="px-5 py-3 print:px-3 print:py-2">
                        {t.unit}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {laborLines.map((line, index) => (
                      <tr
                        key={`${line.description}-${index}`}
                        className="border-b border-slate-100"
                      >
                        <td className="px-5 py-3 font-semibold text-slate-900 print:px-3 print:py-2">
                          {translateLaborDescription(
                            line.description,
                            language
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-700 print:px-3 print:py-2">
                          {formatNumber(line.quantity)}
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-900 print:px-3 print:py-2">
                          {formatNumber(line.orderQuantity)}
                        </td>
                        <td className="px-5 py-3 text-slate-700 print:px-3 print:py-2">
                          {line.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="print-section">
            <SectionTitle title={t.crewNotes} />

            <div className="rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-700 print:p-4">
              {getCrewNotes(estimate, language)}
            </div>
          </div>

          <div className="print-section">
            <SectionTitle title={t.generalNotes} />

            <div className="rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-700 print:p-4">
              {getGeneralNotes(estimate, language)}
            </div>
          </div>

          <div className="print-section">
            <SectionTitle title={t.importantNotes} />

            <div className="space-y-3 rounded-xl border border-slate-200 p-5 text-sm leading-6 text-slate-700 print:p-4">
              <p>1. {t.note1}</p>
              <p>2. {t.note2}</p>
              <p>3. {t.note3}</p>
            </div>
          </div>

          <div className="print-section mt-10 grid gap-8 md:grid-cols-2 print:grid-cols-2">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
                {t.signature}
              </h2>

              <div className="mt-10 border-t border-slate-400 pt-2 text-sm font-semibold text-slate-600">
                {t.signatureLine}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-transparent">
                Date
              </h2>

              <div className="mt-10 border-t border-slate-400 pt-2 text-sm font-semibold text-slate-600">
                {t.dateLine}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="mb-4 mt-8 border-b border-slate-200 pb-2 text-sm font-black uppercase tracking-wide text-slate-800 print:mb-3 print:mt-5">
      {title}
    </h2>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 print:p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-black text-slate-900 print:text-sm">
        {value}
      </div>
    </div>
  );
}

function MeasurementBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}