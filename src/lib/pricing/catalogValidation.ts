import { DEFAULT_ROOFING_OPTION_TEMPLATES } from "./optionTemplates";
import type { LaborItem, OptionTemplate, PricingItem } from "./types";

export interface MissingMaterialCatalogItem {
  category: string;
  productName: string;
}

export interface MissingCatalogItems {
  materials: MissingMaterialCatalogItem[];
  laborItems: string[];
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function materialKey(category: string, productName: string): string {
  return `${normalizeText(category)}:${normalizeText(productName)}`;
}

export function findMissingCatalogItems(params: {
  pricingItems: PricingItem[];
  laborItems: LaborItem[];
  templates?: OptionTemplate[];
}): MissingCatalogItems {
  const templates = params.templates ?? DEFAULT_ROOFING_OPTION_TEMPLATES;
  const activeMaterialKeys = new Set(
    params.pricingItems
      .filter((item) => item.active !== false)
      .map((item) => materialKey(item.category, item.name))
  );
  const activeLaborNames = new Set(
    params.laborItems
      .filter((item) => item.active !== false)
      .map((item) => normalizeText(item.item))
  );
  const missingMaterials = new Map<string, MissingMaterialCatalogItem>();
  const missingLaborItems = new Map<string, string>();

  for (const template of templates) {
    for (const line of template.materialLines) {
      const key = materialKey(line.category, line.productName);

      if (!activeMaterialKeys.has(key)) {
        missingMaterials.set(key, {
          category: line.category,
          productName: line.productName,
        });
      }
    }

    for (const line of template.laborLines) {
      const key = normalizeText(line.item);

      if (!activeLaborNames.has(key)) {
        missingLaborItems.set(key, line.item);
      }
    }
  }

  return {
    materials: Array.from(missingMaterials.values()),
    laborItems: Array.from(missingLaborItems.values()),
  };
}

export function hasMissingCatalogItems(missing: MissingCatalogItems): boolean {
  return missing.materials.length > 0 || missing.laborItems.length > 0;
}
