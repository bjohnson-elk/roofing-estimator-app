export type SourceType =
  | "material"
  | "labor"
  | "fee"
  | "warranty"
  | "financing"
  | "custom"
  | "adjustment";

export type QuantitySource =
  | "roof_squares"
  | "waste_squares"
  | "eaves_lf"
  | "rakes_lf"
  | "hips_lf"
  | "ridges_lf"
  | "valleys_lf"
  | "flashing_lf"
  | "step_flashing_lf"
  | "drip_edge_lf"
  | "starter_lf"
  | "ridge_cap_lf"
  | "ice_water_lf"
  | "solar_panels_qty"
  | "solar_arrays_qty"
  | "plywood_sheets"
  | "fixed_1"
  | "custom";

export interface PricingItem {
  id: string;
  category: string;
  brand?: string | null;
  name: string;
  installUnit: string;
  salesUnit: string;
  coveragePerSalesUnit: number;
  costPerSalesUnit: number;
  active?: boolean;
}

export interface LaborItem {
  id: string;
  subcontractor?: string | null;
  item: string;
  unit: string;
  costPerUnit: number;
  active?: boolean;
}

export interface EstimateMeasurements {
  roofAreaSf?: number | null;
  roofSquares?: number | null;
  wastePercent?: number | null;
  eavesLf?: number | null;
  rakesLf?: number | null;
  hipsLf?: number | null;
  ridgesLf?: number | null;
  valleysLf?: number | null;
  flashingLf?: number | null;
  stepFlashingLf?: number | null;
  dripEdgeLf?: number | null;
  starterLf?: number | null;
  ridgeCapLf?: number | null;
  iceWaterLf?: number | null;
  solarPanelsQty?: number | null;
  solarArraysQty?: number | null;
  plywoodSheets?: number | null;
}

export interface NormalizedMeasurements {
  roofAreaSf: number;
  roofSquares: number;
  wastePercent: number;
  wasteSquares: number;
  eavesLf: number;
  rakesLf: number;
  hipsLf: number;
  ridgesLf: number;
  valleysLf: number;
  flashingLf: number;
  stepFlashingLf: number;
  dripEdgeLf: number;
  starterLf: number;
  ridgeCapLf: number;
  iceWaterLf: number;
  solarPanelsQty: number;
  solarArraysQty: number;
  plywoodSheets: number;
}

export interface EstimatePricingInput {
  estimateId?: string;
  targetMarginPercent: number;
  measurements: EstimateMeasurements;
  pricingItems: PricingItem[];
  laborItems: LaborItem[];
}

export interface MaterialTemplateLine {
  sourceType: "material" | "fee" | "warranty" | "custom" | "adjustment";
  category: string;
  productName: string;
  quantitySource: QuantitySource;
  sortOrder: number;
  measuredQuantityOverride?: number;
  calculationNote?: string;
}

export interface LaborTemplateLine {
  sourceType: "labor";
  item: string;
  quantitySource: QuantitySource;
  sortOrder: number;
  measuredQuantityOverride?: number;
  calculationNote?: string;
}

export interface OptionTemplate {
  templateKey: string;
  optionName: string;
  materialLines: MaterialTemplateLine[];
  laborLines: LaborTemplateLine[];
}

export interface BuiltLineItem {
  estimateId?: string;
  estimateOptionId?: string;
  sortOrder: number;
  sourceType: SourceType;
  pricingItemId?: string;
  laborItemId?: string;
  description: string;
  measuredQuantity: number;
  orderQuantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  sellPrice: number;
  totalPrice: number;
  grossProfit: number;
  grossMarginPercent: number;
  calculationNote: string;
}

export interface BuiltEstimateOption {
  estimateId?: string;
  optionName: string;
  templateKey: string;
  subtotalCost: number;
  subtotalPrice: number;
  grossProfit: number;
  grossMarginPercent: number;
  lineItems: BuiltLineItem[];
}

export interface BuiltEstimate {
  measurements: NormalizedMeasurements;
  options: BuiltEstimateOption[];
}
