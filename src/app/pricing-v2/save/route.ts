import {
  buildEstimate,
  findMissingCatalogItems,
  hasMissingCatalogItems,
  type EstimateMeasurements,
} from "@/lib/pricing";
import {
  laborItemsFromSupabaseRows,
  pricingItemsFromSupabaseRows,
  toEstimateLineItemInsertRowsByOptionId,
  toEstimateOptionInsertRows,
  type LaborItemSelectRow,
  type PricingItemSelectRow,
} from "@/lib/pricing/supabaseRows";
import { supabase } from "@/lib/supabase";

const targetMarginPercent = 45;
const v2PricingMode = "v2_type_script_engine";
const v2LineSource = "v2_pricing_engine";

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

interface InsertedOptionRow {
  id: string;
  description: string | null;
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

async function buildEstimateForSave(estimateId: string) {
  const [pricingResult, laborResult, estimateMeasurements] = await Promise.all([
    supabase.from("pricing_items").select("*").eq("active", true),
    supabase.from("labor_items").select("*").eq("active", true),
    loadEstimateMeasurements(estimateId),
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
  const missingCatalogItems = findMissingCatalogItems({
    pricingItems,
    laborItems,
  });

  if (hasMissingCatalogItems(missingCatalogItems)) {
    throw new Error(
      "The active Supabase catalog is missing items required by the v2 templates."
    );
  }

  return buildEstimate({
    estimateId,
    targetMarginPercent,
    measurements: estimateMeasurements,
    pricingItems,
    laborItems,
  });
}

function readRequestText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requirePreparedLineRows(params: {
  estimate: Awaited<ReturnType<typeof buildEstimateForSave>>;
  optionIdByTemplateKey: Record<string, string>;
}) {
  const missingTemplateKeys = params.estimate.options
    .map((option) => option.templateKey)
    .filter((templateKey) => !params.optionIdByTemplateKey[templateKey]);

  if (missingTemplateKeys.length > 0) {
    throw new Error(
      `Could not map inserted v2 options for templates: ${missingTemplateKeys.join(
        ", "
      )}.`
    );
  }

  return toEstimateLineItemInsertRowsByOptionId({
    options: params.estimate.options,
    optionIdByTemplateKey: params.optionIdByTemplateKey,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const estimateId = readRequestText(body?.estimateId);
    const confirmation = readRequestText(body?.confirmation);

    if (!estimateId) {
      return Response.json({ error: "estimateId is required." }, { status: 400 });
    }

    if (confirmation !== "SAVE V2") {
      return Response.json(
        { error: "Type SAVE V2 before saving v2 preview options." },
        { status: 400 }
      );
    }

    const estimate = await buildEstimateForSave(estimateId);
    const optionRows = toEstimateOptionInsertRows({
      options: estimate.options,
      targetMarginPercent,
    });
    const expectedLineItemCount = estimate.options.reduce(
      (count, option) => count + option.lineItems.length,
      0
    );

    if (optionRows.length !== estimate.options.length) {
      throw new Error("Prepared v2 option row count does not match preview.");
    }

    if (expectedLineItemCount === 0) {
      throw new Error("Prepared v2 preview has no line items to save.");
    }

    const { error: deleteLineItemsError } = await supabase
      .from("estimate_line_items")
      .delete()
      .eq("estimate_id", estimateId)
      .eq("line_source", v2LineSource);

    if (deleteLineItemsError) {
      throw new Error(
        `Could not replace old v2 line items: ${deleteLineItemsError.message}`
      );
    }

    const { error: deleteOptionsError } = await supabase
      .from("estimate_options")
      .delete()
      .eq("estimate_id", estimateId)
      .eq("pricing_mode", v2PricingMode);

    if (deleteOptionsError) {
      throw new Error(
        `Could not replace old v2 options: ${deleteOptionsError.message}`
      );
    }

    const { data: insertedOptions, error: insertOptionsError } = await supabase
      .from("estimate_options")
      .insert(optionRows)
      .select("id, description");

    if (insertOptionsError) {
      throw new Error(`Could not save v2 options: ${insertOptionsError.message}`);
    }

    const insertedOptionRows = (insertedOptions ?? []) as InsertedOptionRow[];

    if (insertedOptionRows.length !== estimate.options.length) {
      throw new Error(
        `Inserted ${insertedOptionRows.length} v2 options, expected ${estimate.options.length}.`
      );
    }

    const optionIdByTemplateKey = Object.fromEntries(
      insertedOptionRows
        .filter((option) => option.description)
        .map((option) => [String(option.description), option.id])
    );
    const lineRows = requirePreparedLineRows({
      estimate,
      optionIdByTemplateKey,
    });

    if (lineRows.length !== expectedLineItemCount) {
      throw new Error(
        `Prepared ${lineRows.length} v2 line items, expected ${expectedLineItemCount}.`
      );
    }

    const { error: insertLineItemsError } = await supabase
      .from("estimate_line_items")
      .insert(lineRows);

    if (insertLineItemsError) {
      throw new Error(
        `Could not save v2 line items: ${insertLineItemsError.message}`
      );
    }

    return Response.json({
      optionCount: optionRows.length,
      lineItemCount: lineRows.length,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save v2 preview options.",
      },
      { status: 500 }
    );
  }
}
