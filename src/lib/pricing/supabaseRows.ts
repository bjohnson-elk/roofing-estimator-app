import type {
  BuiltEstimateOption,
  BuiltLineItem,
  LaborItem,
  PricingItem,
} from "./types";

export interface PricingItemSelectRow {
  id: string;
  category?: string | null;
  brand?: string | null;
  name?: string | null;
  product_name?: string | null;
  type?: string | null;
  install_unit?: string | null;
  unit?: string | null;
  sales_unit?: string | null;
  coverage_per_sales_unit?: number | null;
  cost_per_sales_unit?: number | null;
  unit_cost?: number | null;
  price?: number | null;
  active?: boolean | null;
}

export interface LaborItemSelectRow {
  id: string;
  subcontractor?: string | null;
  item?: string | null;
  name?: string | null;
  unit?: string | null;
  cost_per_unit?: number | null;
  unit_cost?: number | null;
  active?: boolean | null;
}

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

function requireText(value: string | null | undefined, fieldName: string): string {
  const text = value?.trim();

  if (!text) {
    throw new Error(`Missing required ${fieldName}.`);
  }

  return text;
}

function requireNumber(
  value: number | null | undefined,
  fieldName: string
): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Missing required ${fieldName}.`);
  }

  return Number(value);
}

function databaseOrderQuantityFromSavedQuantity(line: BuiltLineItem): number {
  if (line.orderQuantity <= 0) return 0;

  return Math.ceil(line.orderQuantity);
}

function divideOrZero(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return 0;
  if (denominator === 0) return 0;

  return numerator / denominator;
}

function normalizePricingCategory(
  value: string | null | undefined
): string | null | undefined {
  const text = value?.trim();

  if (!text) return text;

  const knownCategories: Record<string, string> = {
    "ice & water": "ice and water",
    "ice and water": "ice and water",
    icewater: "ice and water",
    ridgecap: "ridge cap",
    "ridge cap": "ridge cap",
    shingle: "shingles",
    shingles: "shingles",
    starter: "starter",
    underlayment: "felt",
    felt: "felt",
    vent: "vent",
    vents: "vent",
  };

  return knownCategories[text.toLowerCase()] ?? text;
}

function productNameWithBrand(row: PricingItemSelectRow): string | null | undefined {
  const productName = row.product_name?.trim();

  if (productName) return productName;
  if (!row.brand || !row.name) return row.name;

  const normalizedBrand = row.brand.trim().toLowerCase();
  const normalizedName = row.name.trim().toLowerCase();

  if (normalizedBrand === "gaf" && normalizedName === "ridge runner") {
    return "GAF Cobra Ridge Runner";
  }

  if (normalizedName.startsWith(`${normalizedBrand} `)) {
    return row.name;
  }

  return `${row.brand} ${row.name}`;
}

export function pricingItemFromSupabaseRow(
  row: PricingItemSelectRow
): PricingItem {
  return {
    id: requireText(row.id, "pricing item id"),
    category: requireText(
      normalizePricingCategory(row.category ?? row.type),
      "pricing item category"
    ),
    brand: row.brand ?? null,
    name: requireText(productNameWithBrand(row), "pricing item name"),
    installUnit: requireText(
      row.install_unit ?? row.unit,
      "pricing item install unit"
    ),
    salesUnit: requireText(row.sales_unit, "pricing item sales unit"),
    coveragePerSalesUnit: requireNumber(
      row.coverage_per_sales_unit,
      "pricing item coverage per sales unit"
    ),
    costPerSalesUnit: requireNumber(
      row.cost_per_sales_unit ?? row.unit_cost ?? row.price,
      "pricing item cost per sales unit"
    ),
    active: row.active ?? true,
  };
}

export function laborItemFromSupabaseRow(row: LaborItemSelectRow): LaborItem {
  return {
    id: requireText(row.id, "labor item id"),
    subcontractor: row.subcontractor ?? null,
    item: requireText(row.item ?? row.name, "labor item"),
    unit: requireText(row.unit, "labor item unit"),
    costPerUnit: requireNumber(
      row.cost_per_unit ?? row.unit_cost,
      "labor item cost per unit"
    ),
    active: row.active ?? true,
  };
}

export function pricingItemsFromSupabaseRows(
  rows: PricingItemSelectRow[]
): PricingItem[] {
  return rows.map(pricingItemFromSupabaseRow);
}

export function laborItemsFromSupabaseRows(
  rows: LaborItemSelectRow[]
): LaborItem[] {
  return rows.map(laborItemFromSupabaseRow);
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

  return params.option.lineItems.map((line) => {
    const recalculatedOrderQuantity = databaseOrderQuantityFromSavedQuantity(line);

    return {
      estimate_id: estimateId,
      estimate_option_id: params.estimateOptionId,
      pricing_item_id: null,
      labor_item_id: null,
      line_type: mapLineType(line),
      item_type: line.sourceType,
      line_source: "v2_pricing_engine",
      description: line.description,
      measured_quantity: line.measuredQuantity,
      quantity: line.orderQuantity,
      order_quantity: line.orderQuantity,
      unit: line.unit,
      unit_cost: divideOrZero(line.totalCost, recalculatedOrderQuantity),
      total_cost: line.totalCost,
      sell_price: divideOrZero(line.totalPrice, line.orderQuantity),
      total_price: line.totalPrice,
      sort_order: line.sortOrder,
      coverage_per_sales_unit: 1,
      sales_unit: line.salesUnit ?? null,
      pricing_basis: line.calculationNote,
    };
  });
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
