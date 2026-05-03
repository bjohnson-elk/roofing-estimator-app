import type { BuiltEstimateOption, BuiltLineItem } from "./types";

export interface EstimateOptionInsertRow {
  estimate_id: string;
  option_name: string;
  description: string | null;
  target_margin_percent: number;
  subtotal_cost: number;
  subtotal_price: number;
  gross_profit: number;
  gross_margin_percent: number;
  active: boolean;
  is_primary: boolean;
  include_in_comparison: boolean;
  comparison_sort_order: number;
  pricing_mode: string;
  base_pricing_method: string;
}

export interface EstimateLineItemInsertRow {
  estimate_id: string;
  estimate_option_id: string;
  pricing_item_id: string | null;
  labor_item_id: string | null;
  line_type: string;
  item_type: string;
  line_source: string;
  description: string;
  measured_quantity: number;
  quantity: number;
  order_quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  sell_price: number;
  total_price: number;
  sort_order: number;
  coverage_per_sales_unit: number | null;
  sales_unit: string | null;
  pricing_basis: string | null;
}

function requireEstimateId(option: BuiltEstimateOption): string {
  if (!option.estimateId) {
    throw new Error("estimateId is required before mapping Supabase rows.");
  }

  return option.estimateId;
}

function mapLineType(line: BuiltLineItem): string {
  if (line.sourceType === "material") return "material";
  if (line.sourceType === "labor") return "labor";
  return line.sourceType;
}

export function toEstimateOptionInsertRows(params: {
  options: BuiltEstimateOption[];
  targetMarginPercent: number;
}): EstimateOptionInsertRow[] {
  return params.options.map((option, index) => ({
    estimate_id: requireEstimateId(option),
    option_name: option.optionName,
    description: option.templateKey,
    target_margin_percent: params.targetMarginPercent,
    subtotal_cost: option.subtotalCost,
    subtotal_price: option.subtotalPrice,
    gross_profit: option.grossProfit,
    gross_margin_percent: option.grossMarginPercent,
    active: true,
    is_primary: false,
    include_in_comparison: true,
    comparison_sort_order: index + 1,
    pricing_mode: "v2_type_script_engine",
    base_pricing_method: "gross_margin",
  }));
}

export function toEstimateLineItemInsertRows(params: {
  option: BuiltEstimateOption;
  estimateOptionId: string;
}): EstimateLineItemInsertRow[] {
  const estimateId = requireEstimateId(params.option);

  return params.option.lineItems.map((line) => ({
    estimate_id: estimateId,
    estimate_option_id: params.estimateOptionId,
    pricing_item_id: line.pricingItemId ?? null,
    labor_item_id: line.laborItemId ?? null,
    line_type: mapLineType(line),
    item_type: line.sourceType,
    line_source: "v2_pricing_engine",
    description: line.description,
    measured_quantity: line.measuredQuantity,
    quantity: line.measuredQuantity,
    order_quantity: line.orderQuantity,
    unit: line.unit,
    unit_cost: line.unitCost,
    total_cost: line.totalCost,
    sell_price: line.sellPrice,
    total_price: line.totalPrice,
    sort_order: line.sortOrder,
    coverage_per_sales_unit: line.coveragePerSalesUnit ?? null,
    sales_unit: line.salesUnit ?? null,
    pricing_basis: line.calculationNote,
  }));
}

export function toEstimateLineItemInsertRowsByOptionId(params: {
  options: BuiltEstimateOption[];
  optionIdByTemplateKey: Record<string, string>;
}): EstimateLineItemInsertRow[] {
  return params.options.flatMap((option) => {
    const estimateOptionId = params.optionIdByTemplateKey[option.templateKey];

    if (!estimateOptionId) {
      throw new Error(`Missing estimate option id for ${option.templateKey}.`);
    }

    return toEstimateLineItemInsertRows({ option, estimateOptionId });
  });
}
