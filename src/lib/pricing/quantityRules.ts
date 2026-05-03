import { toFiniteNumber } from "./formulas";
import type {
  EstimateMeasurements,
  NormalizedMeasurements,
  QuantitySource,
} from "./types";

export function normalizeMeasurements(
  measurements: EstimateMeasurements
): NormalizedMeasurements {
  const roofAreaSf = toFiniteNumber(measurements.roofAreaSf);
  const roofSquares =
    toFiniteNumber(measurements.roofSquares) || roofAreaSf / 100;
  const wastePercent = toFiniteNumber(measurements.wastePercent);
  const wasteSquares = roofSquares * (1 + wastePercent / 100);

  const eavesLf = toFiniteNumber(measurements.eavesLf);
  const rakesLf = toFiniteNumber(measurements.rakesLf);
  const hipsLf = toFiniteNumber(measurements.hipsLf);
  const ridgesLf = toFiniteNumber(measurements.ridgesLf);

  return {
    roofAreaSf,
    roofSquares,
    wastePercent,
    wasteSquares,
    eavesLf,
    rakesLf,
    hipsLf,
    ridgesLf,
    valleysLf: toFiniteNumber(measurements.valleysLf),
    flashingLf: toFiniteNumber(measurements.flashingLf),
    stepFlashingLf: toFiniteNumber(measurements.stepFlashingLf),
    dripEdgeLf: toFiniteNumber(measurements.dripEdgeLf) || eavesLf + rakesLf,
    starterLf: toFiniteNumber(measurements.starterLf) || eavesLf + rakesLf,
    ridgeCapLf: toFiniteNumber(measurements.ridgeCapLf) || hipsLf + ridgesLf,
    iceWaterLf: toFiniteNumber(measurements.iceWaterLf),
    solarPanelsQty: toFiniteNumber(measurements.solarPanelsQty),
    solarArraysQty: toFiniteNumber(measurements.solarArraysQty),
    plywoodSheets: toFiniteNumber(measurements.plywoodSheets),
  };
}

export function resolveQuantity(
  source: QuantitySource,
  measurements: NormalizedMeasurements,
  customQuantity?: number
): number {
  if (source === "custom") return toFiniteNumber(customQuantity);

  const quantityMap: Record<Exclude<QuantitySource, "custom">, number> = {
    roof_squares: measurements.roofSquares,
    waste_squares: measurements.wasteSquares,
    eaves_lf: measurements.eavesLf,
    rakes_lf: measurements.rakesLf,
    hips_lf: measurements.hipsLf,
    ridges_lf: measurements.ridgesLf,
    valleys_lf: measurements.valleysLf,
    flashing_lf: measurements.flashingLf,
    step_flashing_lf: measurements.stepFlashingLf,
    drip_edge_lf: measurements.dripEdgeLf,
    starter_lf: measurements.starterLf,
    ridge_cap_lf: measurements.ridgeCapLf,
    ice_water_lf: measurements.iceWaterLf,
    solar_panels_qty: measurements.solarPanelsQty,
    solar_arrays_qty: measurements.solarArraysQty,
    plywood_sheets: measurements.plywoodSheets,
    fixed_1: 1,
  };

  return quantityMap[source];
}
