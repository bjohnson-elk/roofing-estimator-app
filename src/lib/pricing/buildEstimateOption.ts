import {
  calculateLinePricing,
  calculateOptionTotals,
  roundMaterialOrderQuantity,
} from "./formulas";
import { resolveQuantity } from "./quantityRules";
import type {
  BuiltEstimateOption,
  BuiltLineItem,
  EstimatePricingInput,
  LaborItem,
  LaborTemplateLine,
  MaterialTemplateLine,
  NormalizedMeasurements,
  OptionTemplate,
  PricingItem,
} from "./types";

function textMatches(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function findPricingItem(
  pricingItems: PricingItem[],
  line: MaterialTemplateLine
): PricingItem {
  const item = pricingItems.find(
    (pricingItem) =>
      pricingItem.active !== false &&
      textMatches(pricingItem.category, line.category) &&
      textMatches(pricingItem.name, line.productName)
  );

  if (!item) {
    throw new Error(
      `Missing pricing item: ${line.category} / ${line.productName}`
    );
  }

  return item;
}

function findLaborItem(laborItems: LaborItem[], line: LaborTemplateLine): LaborItem {
  const item = laborItems.find(
    (laborItem) =>
      laborItem.active !== false && textMatches(laborItem.item, line.item)
  );

  if (!item) {
    throw new Error(`Missing labor item: ${line.item}`);
  }

  return item;
}

function buildMaterialLine(params: {
  estimateId?: string;
  templateLine: MaterialTemplateLine;
  pricingItem: PricingItem;
  measurements: NormalizedMeasurements;
  targetMarginPercent: number;
}): BuiltLineItem {
  const measuredQuantity = resolveQuantity(
    params.templateLine.quantitySource,
    params.measurements,
    params.templateLine.measuredQuantityOverride
  );
  const orderQuantity = roundMaterialOrderQuantity(
    measuredQuantity,
    params.pricingItem.coveragePerSalesUnit
  );
  const pricing = calculateLinePricing({
    orderQuantity,
    unitCost: params.pricingItem.costPerSalesUnit,
    targetMarginPercent: params.targetMarginPercent,
  });

  return {
    estimateId: params.estimateId,
    sortOrder: params.templateLine.sortOrder,
    sourceType: params.templateLine.sourceType,
    pricingItemId: params.pricingItem.id,
    description: params.pricingItem.name,
    measuredQuantity,
    orderQuantity,
    unit: params.pricingItem.salesUnit,
    unitCost: params.pricingItem.costPerSalesUnit,
    ...pricing,
    calculationNote:
      params.templateLine.calculationNote ??
      `${params.templateLine.quantitySource} / ${params.pricingItem.coveragePerSalesUnit} ${params.pricingItem.installUnit} per ${params.pricingItem.salesUnit}, rounded up.`,
  };
}

function buildLaborLine(params: {
  estimateId?: string;
  templateLine: LaborTemplateLine;
  laborItem: LaborItem;
  measurements: NormalizedMeasurements;
  targetMarginPercent: number;
}): BuiltLineItem {
  const measuredQuantity = resolveQuantity(
    params.templateLine.quantitySource,
    params.measurements,
    params.templateLine.measuredQuantityOverride
  );
  const orderQuantity = measuredQuantity;
  const pricing = calculateLinePricing({
    orderQuantity,
    unitCost: params.laborItem.costPerUnit,
    targetMarginPercent: params.targetMarginPercent,
  });

  return {
    estimateId: params.estimateId,
    sortOrder: params.templateLine.sortOrder,
    sourceType: "labor",
    laborItemId: params.laborItem.id,
    description: params.laborItem.item,
    measuredQuantity,
    orderQuantity,
    unit: params.laborItem.unit,
    unitCost: params.laborItem.costPerUnit,
    ...pricing,
    calculationNote:
      params.templateLine.calculationNote ??
      `${params.templateLine.quantitySource} priced as measured labor quantity.`,
  };
}

export function buildEstimateOption(params: {
  input: EstimatePricingInput;
  measurements: NormalizedMeasurements;
  template: OptionTemplate;
}): BuiltEstimateOption {
  const materialLines = params.template.materialLines.map((templateLine) =>
    buildMaterialLine({
      estimateId: params.input.estimateId,
      templateLine,
      pricingItem: findPricingItem(params.input.pricingItems, templateLine),
      measurements: params.measurements,
      targetMarginPercent: params.input.targetMarginPercent,
    })
  );

  const laborLines = params.template.laborLines.map((templateLine) =>
    buildLaborLine({
      estimateId: params.input.estimateId,
      templateLine,
      laborItem: findLaborItem(params.input.laborItems, templateLine),
      measurements: params.measurements,
      targetMarginPercent: params.input.targetMarginPercent,
    })
  );

  const lineItems = [...materialLines, ...laborLines].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  const totals = calculateOptionTotals(lineItems);

  return {
    estimateId: params.input.estimateId,
    optionName: params.template.optionName,
    templateKey: params.template.templateKey,
    ...totals,
    lineItems,
  };
}
