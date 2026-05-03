import type { OptionTemplate } from "./types";

const COMMON_MATERIAL_LINES = [
  {
    sourceType: "material" as const,
    category: "flashing",
    productName: "Generic Drip Edge Steel",
    quantitySource: "drip_edge_lf" as const,
    sortOrder: 70,
  },
  {
    sourceType: "material" as const,
    category: "nails",
    productName: "Generic 1.25\" Coil Roofing",
    quantitySource: "waste_squares" as const,
    sortOrder: 71,
  },
  {
    sourceType: "material" as const,
    category: "nails",
    productName: "Generic 1\" Plastic Top",
    quantitySource: "roof_squares" as const,
    sortOrder: 72,
  },
  {
    sourceType: "material" as const,
    category: "misc",
    productName: "Generic Delivery Fee",
    quantitySource: "fixed_1" as const,
    sortOrder: 73,
  },
  {
    sourceType: "material" as const,
    category: "misc",
    productName: "Generic Rainbuster Caulk",
    quantitySource: "fixed_1" as const,
    sortOrder: 74,
  },
  {
    sourceType: "material" as const,
    category: "misc",
    productName: "Generic Spray Paint",
    quantitySource: "fixed_1" as const,
    sortOrder: 75,
  },
  {
    sourceType: "material" as const,
    category: "flashing",
    productName: "Generic Step Flashing Galvanized",
    quantitySource: "step_flashing_lf" as const,
    sortOrder: 76,
  },
  {
    sourceType: "material" as const,
    category: "flashing",
    productName: "Generic Valley Metal Painted W",
    quantitySource: "valleys_lf" as const,
    sortOrder: 77,
  },
];

const BASE_LABOR_LINES = [
  {
    sourceType: "labor" as const,
    item: "Install shingles",
    quantitySource: "waste_squares" as const,
    sortOrder: 100,
    calculationNote: "Install labor uses waste-inflated roof squares.",
  },
  {
    sourceType: "labor" as const,
    item: "Tear off shingles",
    quantitySource: "roof_squares" as const,
    sortOrder: 110,
    calculationNote: "Tear off labor uses raw roof squares.",
  },
  {
    sourceType: "labor" as const,
    item: "Dump trailer",
    quantitySource: "fixed_1" as const,
    sortOrder: 900,
  },
];

function buildRoofingTemplate(params: {
  templateKey: string;
  optionName: string;
  shingleName: string;
  ridgeCapName: string;
  starterName: string;
  feltName: string;
  iceWaterName: string;
  ridgeVentName?: string;
}): OptionTemplate {
  return {
    templateKey: params.templateKey,
    optionName: params.optionName,
    materialLines: [
      {
        sourceType: "material",
        category: "shingles",
        productName: params.shingleName,
        quantitySource: "waste_squares",
        sortOrder: 10,
        calculationNote: "Shingles use waste-inflated roof squares.",
      },
      {
        sourceType: "material",
        category: "felt",
        productName: params.feltName,
        quantitySource: "waste_squares",
        sortOrder: 20,
      },
      {
        sourceType: "material",
        category: "ice and water",
        productName: params.iceWaterName,
        quantitySource: "ice_water_lf",
        sortOrder: 30,
      },
      {
        sourceType: "material",
        category: "starter",
        productName: params.starterName,
        quantitySource: "starter_lf",
        sortOrder: 40,
      },
      {
        sourceType: "material",
        category: "ridge cap",
        productName: params.ridgeCapName,
        quantitySource: "ridge_cap_lf",
        sortOrder: 50,
      },
      ...(params.ridgeVentName
        ? [
            {
              sourceType: "material" as const,
              category: "vent",
              productName: params.ridgeVentName,
              quantitySource: "ridges_lf" as const,
              sortOrder: 60,
            },
          ]
        : []),
      ...COMMON_MATERIAL_LINES,
    ],
    laborLines: BASE_LABOR_LINES,
  };
}

export const DEFAULT_ROOFING_OPTION_TEMPLATES: OptionTemplate[] = [
  buildRoofingTemplate({
    templateKey: "natural-shadow-cheapest",
    optionName: "Natural Shadow - Cheapest",
    shingleName: "GAF Timberline NS",
    ridgeCapName: "GAF Seal-A-Ridge",
    starterName: "GAF ProStart",
    feltName: "Epilay ProtecTite Superior",
    iceWaterName: "Epilay Roofnado HT",
  }),
  buildRoofingTemplate({
    templateKey: "hdz-standard-ridge",
    optionName: "HDZ with Standard Profile Ridge",
    shingleName: "GAF Timberline HDZ",
    ridgeCapName: "GAF Seal-A-Ridge",
    starterName: "GAF ProStart",
    feltName: "GAF FeltBuster",
    iceWaterName: "GAF WeatherWatch",
  }),
  buildRoofingTemplate({
    templateKey: "hdz-high-profile-ridge",
    optionName: "HDZ with High Profile Ridge",
    shingleName: "GAF Timberline HDZ",
    ridgeCapName: "GAF Timbercrest",
    starterName: "GAF ProStart",
    feltName: "GAF FeltBuster",
    iceWaterName: "GAF WeatherWatch",
  }),
  buildRoofingTemplate({
    templateKey: "uhdz-three-component-gaf",
    optionName: "UHDZ with 3 Component GAF",
    shingleName: "GAF Timberline UHDZ",
    ridgeCapName: "GAF Seal-A-Ridge",
    starterName: "GAF ProStart",
    feltName: "GAF FeltBuster",
    iceWaterName: "GAF WeatherWatch",
  }),
  buildRoofingTemplate({
    templateKey: "uhdz-full-gaf",
    optionName: "UHDZ with Full GAF",
    shingleName: "GAF Timberline UHDZ",
    ridgeCapName: "GAF Timbercrest",
    starterName: "GAF ProStart",
    feltName: "GAF Tiger Paw",
    iceWaterName: "GAF WeatherWatch",
    ridgeVentName: "GAF Cobra Ridge Runner",
  }),
  buildRoofingTemplate({
    templateKey: "grand-sequoia",
    optionName: "Grand Sequoia",
    shingleName: "GAF Grand Sequoia",
    ridgeCapName: "GAF Timbercrest",
    starterName: "GAF ProStart",
    feltName: "GAF Tiger Paw",
    iceWaterName: "GAF WeatherWatch",
  }),
];
