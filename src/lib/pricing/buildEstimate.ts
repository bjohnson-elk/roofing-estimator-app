import { DEFAULT_ROOFING_OPTION_TEMPLATES } from "./optionTemplates";
import { normalizeMeasurements } from "./quantityRules";
import { buildEstimateOption } from "./buildEstimateOption";
import type { BuiltEstimate, EstimatePricingInput, OptionTemplate } from "./types";

export function buildEstimate(
  input: EstimatePricingInput,
  templates: OptionTemplate[] = DEFAULT_ROOFING_OPTION_TEMPLATES
): BuiltEstimate {
  const measurements = normalizeMeasurements(input.measurements);
  const options = templates.map((template) =>
    buildEstimateOption({ input, measurements, template })
  );

  return {
    measurements,
    options,
  };
}
