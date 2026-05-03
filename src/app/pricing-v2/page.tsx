import AppSidebar from "@/components/AppSidebar";
import {
  buildEstimate,
  findMissingCatalogItems,
  hasMissingCatalogItems,
  type BuiltEstimate,
  type BuiltEstimateOption,
  type BuiltLineItem,
  type EstimateMeasurements,
  type MissingCatalogItems,
} from "@/lib/pricing";
import {
  laborItemsFromSupabaseRows,
  pricingItemsFromSupabaseRows,
  type LaborItemSelectRow,
  type PricingItemSelectRow,
} from "@/lib/pricing/supabaseRows";
import { supabase } from "@/lib/supabase";
import { connection } from "next/server";

const targetMarginPercent = 45;
const targetMarginDecimal = targetMarginPercent / 100;

const sampleMeasurements: EstimateMeasurements = {
  roofAreaSf: 2200,
  wastePercent: 10,
  eavesLf: 128,
  rakesLf: 96,
  hipsLf: 42,
  ridgesLf: 58,
  iceWaterLf: 164,
};

const estimateMeasurementSelect = [
  "id",
  "roof_area_sf",
  "roof_squares",
  "waste_percent",
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
].join(", ");

interface EstimateMeasurementRow {
  id: string;
  roof_area_sf?: number | null;
  roof_squares?: number | null;
  waste_percent?: number | null;
  eaves_lf?: number | null;
  rakes_lf?: number | null;
  hips_lf?: number | null;
  ridges_lf?: number | null;
  valleys_lf?: number | null;
  flashing_lf?: number | null;
  step_flashing_lf?: number | null;
  drip_edge_lf?: number | null;
  starter_lf?: number | null;
  ridge_cap_lf?: number | null;
  ice_water_lf?: number | null;
}

interface PricingPreviewResult {
  estimate: BuiltEstimate | null;
  errorMessage: string | null;
  missingCatalogItems: MissingCatalogItems | null;
  measurementSource: string;
}

function firstSearchParamValue(
  value: string | string[] | undefined
): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const text = rawValue?.trim();

  return text || null;
}

function isFiniteMeasurement(value: number | null | undefined): boolean {
  return Number.isFinite(value);
}

function estimateMeasurementsFromRow(
  row: EstimateMeasurementRow
): EstimateMeasurements {
  return {
    roofAreaSf: row.roof_area_sf ?? null,
    roofSquares: row.roof_squares ?? null,
    wastePercent: row.waste_percent ?? null,
    eavesLf: row.eaves_lf ?? null,
    rakesLf: row.rakes_lf ?? null,
    hipsLf: row.hips_lf ?? null,
    ridgesLf: row.ridges_lf ?? null,
    valleysLf: row.valleys_lf ?? null,
    flashingLf: row.flashing_lf ?? null,
    stepFlashingLf: row.step_flashing_lf ?? null,
    dripEdgeLf: row.drip_edge_lf ?? null,
    starterLf: row.starter_lf ?? null,
    ridgeCapLf: row.ridge_cap_lf ?? null,
    iceWaterLf: row.ice_water_lf ?? null,
  };
}

function validateEstimateMeasurements(
  estimateId: string,
  row: EstimateMeasurementRow
): void {
  const hasRoofSize =
    (isFiniteMeasurement(row.roof_squares) && Number(row.roof_squares) > 0) ||
    (isFiniteMeasurement(row.roof_area_sf) && Number(row.roof_area_sf) > 0);
  const requiredFields: Array<[string, number | null | undefined]> = [
    ["waste_percent", row.waste_percent],
    ["eaves_lf", row.eaves_lf],
    ["rakes_lf", row.rakes_lf],
    ["hips_lf", row.hips_lf],
    ["ridges_lf", row.ridges_lf],
    ["ice_water_lf", row.ice_water_lf],
  ];
  const missingFields = requiredFields
    .filter(([, value]) => !isFiniteMeasurement(value))
    .map(([field]) => field);

  if (!hasRoofSize) {
    missingFields.unshift("roof_squares or roof_area_sf");
  }

  if (missingFields.length > 0) {
    throw new Error(
      `Estimate ${estimateId} does not have enough measurements for the v2 pricing preview. Missing: ${missingFields.join(
        ", "
      )}.`
    );
  }
}

async function loadEstimateMeasurements(
  estimateId: string
): Promise<EstimateMeasurements> {
  const { data, error } = await supabase
    .from("estimates")
    .select(estimateMeasurementSelect)
    .eq("id", estimateId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load estimate ${estimateId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Estimate ${estimateId} was not found.`);
  }

  const row = data as EstimateMeasurementRow;
  validateEstimateMeasurements(estimateId, row);

  return estimateMeasurementsFromRow(row);
}

async function loadPricingPreview(
  estimateId: string | null
): Promise<PricingPreviewResult> {
  const [pricingResult, laborResult, estimateMeasurements] = await Promise.all([
    supabase.from("pricing_items").select("*").eq("active", true),
    supabase.from("labor_items").select("*").eq("active", true),
    estimateId ? loadEstimateMeasurements(estimateId) : sampleMeasurements,
  ]);

  if (pricingResult.error) {
    throw new Error(`Could not load pricing items: ${pricingResult.error.message}`);
  }

  if (laborResult.error) {
    throw new Error(`Could not load labor items: ${laborResult.error.message}`);
  }

  const pricingItems = pricingItemsFromSupabaseRows(
    (pricingResult.data ?? []) as PricingItemSelectRow[]
  );
  const laborItems = laborItemsFromSupabaseRows(
    (laborResult.data ?? []) as LaborItemSelectRow[]
  );

  if (pricingItems.length === 0) {
    throw new Error("No active pricing items were found.");
  }

  if (laborItems.length === 0) {
    throw new Error("No active labor items were found.");
  }

  const missingCatalogItems = findMissingCatalogItems({
    pricingItems,
    laborItems,
  });

  if (hasMissingCatalogItems(missingCatalogItems)) {
    return {
      estimate: null,
      errorMessage:
        "The active Supabase catalog is missing items required by the v2 templates.",
      missingCatalogItems,
      measurementSource: estimateId ? "Estimate" : "Sample",
    };
  }

  return {
    estimate: buildEstimate({
      estimateId: estimateId ?? "preview-estimate",
      targetMarginPercent,
      measurements: estimateMeasurements,
      pricingItems,
      laborItems,
    }),
    errorMessage: null,
    missingCatalogItems: null,
    measurementSource: estimateId ? "Estimate" : "Sample",
  };
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumLineCosts(lines: BuiltLineItem[]): number {
  return roundCurrency(lines.reduce((sum, line) => sum + line.totalCost, 0));
}

function sumLinePrices(lines: BuiltLineItem[]): number {
  return roundCurrency(lines.reduce((sum, line) => sum + line.totalPrice, 0));
}

function expectedPriceFromMargin(cost: number): number {
  return roundCurrency(cost / (1 - targetMarginDecimal));
}

export default async function PricingV2PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ estimateId?: string | string[] }>;
}) {
  await connection();

  const estimateId = firstSearchParamValue((await searchParams).estimateId);
  const result: PricingPreviewResult = await loadPricingPreview(estimateId).catch(
    (error: unknown) => ({
      estimate: null,
      errorMessage:
        error instanceof Error
          ? error.message
          : "Could not load the v2 pricing preview.",
      missingCatalogItems: null,
      measurementSource: estimateId ? "Estimate" : "Sample",
    })
  );

  const sampleEstimate = result.estimate;
  const firstOption = sampleEstimate?.options[0] ?? null;
  const auditLine = firstOption?.lineItems.find((line) => line.totalCost > 0);

  return (
    <main className="min-h-screen bg-slate-100 pl-[var(--sidebar-width,0px)]">
      <AppSidebar active="Pricing V2" />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <div className="text-sm font-bold uppercase tracking-wide text-blue-700">
            Pricing V2
          </div>
          <h1 className="mt-1 text-3xl font-black text-slate-950">
            Estimate Option Preview
          </h1>
          <p className="mt-2 max-w-3xl break-words text-sm text-slate-600">
            {estimateId
              ? `Using measurements from estimate ${estimateId}.`
              : "Using sample measurements. Add ?estimateId=UUID to preview a saved estimate."}
          </p>
        </div>

        {result.errorMessage || !sampleEstimate || !firstOption ? (
          <section className="rounded-lg border border-red-200 bg-white p-6">
            <h2 className="text-xl font-black text-red-700">
              Pricing preview unavailable
            </h2>
            <p className="mt-2 text-sm text-slate-700">
              {result.errorMessage ??
                "The active pricing data did not produce a preview option."}
            </p>
            {result.missingCatalogItems ? (
              <MissingCatalogChecklist missing={result.missingCatalogItems} />
            ) : null}
          </section>
        ) : (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-6">
              <Metric label="Measurements" value={result.measurementSource} />
              <Metric
                label="Roof squares"
                value={number(sampleEstimate.measurements.roofSquares)}
              />
              <Metric
                label="Waste squares"
                value={number(sampleEstimate.measurements.wasteSquares)}
              />
              <Metric
                label="Waste"
                value={`${number(sampleEstimate.measurements.wastePercent)}%`}
              />
              <Metric label="Target margin" value={`${targetMarginPercent}%`} />
              <Metric
                label="Options"
                value={String(sampleEstimate.options.length)}
              />
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-4 py-3">Option</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Gross Profit</th>
                    <th className="px-4 py-3 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleEstimate.options.map((option) => (
                    <tr
                      key={option.templateKey}
                      className="border-t border-slate-100"
                    >
                      <td className="px-4 py-3 font-bold text-slate-950">
                        {option.optionName}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {money(option.subtotalCost)}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-950">
                        {money(option.subtotalPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {money(option.grossProfit)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {number(option.grossMarginPercent)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mt-8">
              <h2 className="mb-3 text-xl font-black text-slate-950">
                {firstOption.optionName} Line Items
              </h2>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Line</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Measured</th>
                      <th className="px-4 py-3 text-right">Order Qty</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3 text-right">Cost</th>
                      <th className="px-4 py-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firstOption.lineItems.map((line) => (
                      <tr
                        key={`${line.sourceType}-${line.description}`}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-950">
                          {line.description}
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-600">
                          {line.sourceType}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {number(line.measuredQuantity)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-950">
                          {number(line.orderQuantity)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {line.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {money(line.totalCost)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-950">
                          {money(line.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {auditLine ? (
              <EngineAudit option={firstOption} auditLine={auditLine} />
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function EngineAudit({
  option,
  auditLine,
}: {
  option: BuiltEstimateOption;
  auditLine: BuiltLineItem;
}) {
  const materialLines = option.lineItems
    .filter((line) => line.sourceType === "material")
    .slice(0, 3);
  const lineCostSum = sumLineCosts(option.lineItems);
  const linePriceSum = sumLinePrices(option.lineItems);
  const expectedLinePrice = expectedPriceFromMargin(auditLine.totalCost);

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-black text-slate-950">Engine Audit</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
            Margin Formula
          </h3>
          <div className="mt-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-950">
              {auditLine.description}
            </div>
            <div className="mt-2">
              {money(auditLine.totalCost)} / (1 - {number(targetMarginDecimal)}) ={" "}
              <span className="font-bold text-slate-950">
                {money(expectedLinePrice)}
              </span>
            </div>
            <div className="mt-1">
              Rendered line price:{" "}
              <span className="font-bold text-slate-950">
                {money(auditLine.totalPrice)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
            Material Rounding
          </h3>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            {materialLines.map((line) => (
              <div key={`audit-${line.description}`}>
                <div className="font-semibold text-slate-950">
                  {line.description}
                </div>
                <div>
                  ceil({number(line.measuredQuantity)} /{" "}
                  {number(line.coveragePerSalesUnit ?? 1)}) ={" "}
                  <span className="font-bold text-slate-950">
                    {number(line.orderQuantity)}
                  </span>{" "}
                  {line.salesUnit ?? line.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
            Option Totals
          </h3>
          <div className="mt-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-950">
              {option.optionName}
            </div>
            <div className="mt-2">
              Line cost sum:{" "}
              <span className="font-bold text-slate-950">
                {money(lineCostSum)}
              </span>
            </div>
            <div>
              Option cost:{" "}
              <span className="font-bold text-slate-950">
                {money(option.subtotalCost)}
              </span>
            </div>
            <div className="mt-2">
              Line price sum:{" "}
              <span className="font-bold text-slate-950">
                {money(linePriceSum)}
              </span>
            </div>
            <div>
              Option price:{" "}
              <span className="font-bold text-slate-950">
                {money(option.subtotalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MissingCatalogChecklist({ missing }: { missing: MissingCatalogItems }) {
  return (
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      {missing.materials.length > 0 ? (
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">
            Missing material catalog items
          </h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {missing.materials.map((item) => (
              <li key={`${item.category}-${item.productName}`}>
                <span className="font-bold text-slate-950">{item.category}</span>
                {": "}
                {item.productName}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {missing.laborItems.length > 0 ? (
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">
            Missing labor catalog items
          </h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {missing.laborItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
    </div>
  );
}
