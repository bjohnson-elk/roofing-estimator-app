import type { BuiltLineItem } from "./types";

export function toFiniteNumber(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeMarginDecimal(targetMarginPercent: number): number {
  const decimal = targetMarginPercent / 100;

  if (!Number.isFinite(decimal) || decimal < 0 || decimal >= 1) {
    throw new Error("Target margin must be between 0 and 99.999 percent.");
  }

  return decimal;
}

export function sellPriceFromMargin(cost: number, targetMarginPercent: number): number {
  const margin = normalizeMarginDecimal(targetMarginPercent);
  return roundCurrency(cost / (1 - margin));
}

export function grossProfit(totalPrice: number, totalCost: number): number {
  return roundCurrency(totalPrice - totalCost);
}

export function grossMarginPercent(totalPrice: number, totalCost: number): number {
  if (totalPrice <= 0) return 0;
  return roundCurrency(((totalPrice - totalCost) / totalPrice) * 100);
}

export function roundMaterialOrderQuantity(
  measuredQuantity: number,
  coveragePerSalesUnit: number
): number {
  if (measuredQuantity <= 0) return 0;

  if (!Number.isFinite(coveragePerSalesUnit) || coveragePerSalesUnit <= 0) {
    throw new Error("coveragePerSalesUnit must be greater than 0.");
  }

  return Math.ceil(measuredQuantity / coveragePerSalesUnit);
}

export function calculateLinePricing(params: {
  orderQuantity: number;
  unitCost: number;
  targetMarginPercent: number;
}): Pick<
  BuiltLineItem,
  "totalCost" | "sellPrice" | "totalPrice" | "grossProfit" | "grossMarginPercent"
> {
  const totalCost = roundCurrency(params.orderQuantity * params.unitCost);
  const sellPrice = sellPriceFromMargin(params.unitCost, params.targetMarginPercent);
  const totalPrice = sellPriceFromMargin(totalCost, params.targetMarginPercent);

  return {
    totalCost,
    sellPrice,
    totalPrice,
    grossProfit: grossProfit(totalPrice, totalCost),
    grossMarginPercent: grossMarginPercent(totalPrice, totalCost),
  };
}

export function calculateOptionTotals(lineItems: BuiltLineItem[]): {
  subtotalCost: number;
  subtotalPrice: number;
  grossProfit: number;
  grossMarginPercent: number;
} {
  const subtotalCost = roundCurrency(
    lineItems.reduce((sum, line) => sum + line.totalCost, 0)
  );
  const subtotalPrice = roundCurrency(
    lineItems.reduce((sum, line) => sum + line.totalPrice, 0)
  );

  return {
    subtotalCost,
    subtotalPrice,
    grossProfit: grossProfit(subtotalPrice, subtotalCost),
    grossMarginPercent: grossMarginPercent(subtotalPrice, subtotalCost),
  };
}
