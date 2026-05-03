import AppSidebar from "@/components/AppSidebar";
import { buildEstimate } from "@/lib/pricing";
import type { LaborItem, PricingItem } from "@/lib/pricing";

const samplePricingItems: PricingItem[] = [
  {
    id: "price-gaf-timberline-ns",
    category: "shingles",
    brand: "GAF",
    name: "GAF Timberline NS",
    installUnit: "SQ",
    salesUnit: "bundle",
    coveragePerSalesUnit: 0.333333,
    costPerSalesUnit: 34,
  },
  {
    id: "price-gaf-timberline-hdz",
    category: "shingles",
    brand: "GAF",
    name: "GAF Timberline HDZ",
    installUnit: "SQ",
    salesUnit: "bundle",
    coveragePerSalesUnit: 0.333333,
    costPerSalesUnit: 39,
  },
  {
    id: "price-gaf-timberline-uhdz",
    category: "shingles",
    brand: "GAF",
    name: "GAF Timberline UHDZ",
    installUnit: "SQ",
    salesUnit: "bundle",
    coveragePerSalesUnit: 0.333333,
    costPerSalesUnit: 55,
  },
  {
    id: "price-gaf-grand-sequoia",
    category: "shingles",
    brand: "GAF",
    name: "GAF Grand Sequoia",
    installUnit: "SQ",
    salesUnit: "bundle",
    coveragePerSalesUnit: 0.333333,
    costPerSalesUnit: 82,
  },
  {
    id: "price-epilay-protectite-superior",
    category: "felt",
    brand: "Epilay",
    name: "Epilay ProtecTite Superior",
    installUnit: "SQ",
    salesUnit: "roll",
    coveragePerSalesUnit: 10,
    costPerSalesUnit: 82,
  },
  {
    id: "price-gaf-feltbuster",
    category: "felt",
    brand: "GAF",
    name: "GAF FeltBuster",
    installUnit: "SQ",
    salesUnit: "roll",
    coveragePerSalesUnit: 10,
    costPerSalesUnit: 116,
  },
  {
    id: "price-gaf-tiger-paw",
    category: "felt",
    brand: "GAF",
    name: "GAF Tiger Paw",
    installUnit: "SQ",
    salesUnit: "roll",
    coveragePerSalesUnit: 10,
    costPerSalesUnit: 148,
  },
  {
    id: "price-epilay-roofnado-ht",
    category: "ice and water",
    brand: "Epilay",
    name: "Epilay Roofnado HT",
    installUnit: "LF",
    salesUnit: "roll",
    coveragePerSalesUnit: 66,
    costPerSalesUnit: 91,
  },
  {
    id: "price-gaf-weatherwatch",
    category: "ice and water",
    brand: "GAF",
    name: "GAF WeatherWatch",
    installUnit: "LF",
    salesUnit: "roll",
    coveragePerSalesUnit: 66,
    costPerSalesUnit: 104,
  },
  {
    id: "price-gaf-prostart",
    category: "starter",
    brand: "GAF",
    name: "GAF ProStart",
    installUnit: "LF",
    salesUnit: "bundle",
    coveragePerSalesUnit: 120,
    costPerSalesUnit: 47,
  },
  {
    id: "price-gaf-seal-a-ridge",
    category: "ridge cap",
    brand: "GAF",
    name: "GAF Seal-A-Ridge",
    installUnit: "LF",
    salesUnit: "bundle",
    coveragePerSalesUnit: 25,
    costPerSalesUnit: 69,
  },
  {
    id: "price-gaf-timbercrest",
    category: "ridge cap",
    brand: "GAF",
    name: "GAF Timbercrest",
    installUnit: "LF",
    salesUnit: "bundle",
    coveragePerSalesUnit: 20,
    costPerSalesUnit: 109,
  },
  {
    id: "price-gaf-cobra-ridge-runner",
    category: "vent",
    brand: "GAF",
    name: "GAF Cobra Ridge Runner",
    installUnit: "LF",
    salesUnit: "roll",
    coveragePerSalesUnit: 30,
    costPerSalesUnit: 88,
  },
];

const sampleLaborItems: LaborItem[] = [
  {
    id: "labor-install-shingles",
    item: "Install shingles",
    unit: "SQ",
    costPerUnit: 62,
  },
  {
    id: "labor-tear-off-shingles",
    item: "Tear off shingles",
    unit: "SQ",
    costPerUnit: 42,
  },
  {
    id: "labor-dump-trailer",
    item: "Dump trailer",
    unit: "EA",
    costPerUnit: 575,
  },
];

const sampleEstimate = buildEstimate({
  estimateId: "preview-estimate",
  targetMarginPercent: 45,
  measurements: {
    roofAreaSf: 2200,
    wastePercent: 10,
    eavesLf: 128,
    rakesLf: 96,
    hipsLf: 42,
    ridgesLf: 58,
    iceWaterLf: 164,
  },
  pricingItems: samplePricingItems,
  laborItems: sampleLaborItems,
});

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PricingV2PreviewPage() {
  const firstOption = sampleEstimate.options[0];

  return (
    <main className="min-h-screen bg-slate-100 pl-[var(--sidebar-width,0px)]">
      <AppSidebar active="Pricing V2" />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <div className="text-sm font-bold uppercase tracking-wide text-blue-700">
            Pricing V2
          </div>
          <h1 className="mt-1 text-3xl font-black text-slate-950">
            Estimate Option Preview
          </h1>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-5">
          <Metric
            label="Roof squares"
            value={number(sampleEstimate.measurements.roofSquares)}
          />
          <Metric
            label="Waste squares"
            value={number(sampleEstimate.measurements.wasteSquares)}
          />
          <Metric
            label="Waste"
            value={`${number(sampleEstimate.measurements.wastePercent)}%`}
          />
          <Metric label="Target margin" value="45%" />
          <Metric label="Options" value={String(sampleEstimate.options.length)} />
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-4 py-3">Option</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Gross Profit</th>
                <th className="px-4 py-3 text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {sampleEstimate.options.map((option) => (
                <tr key={option.templateKey} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-bold text-slate-950">
                    {option.optionName}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {money(option.subtotalCost)}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-950">
                    {money(option.subtotalPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {money(option.grossProfit)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {number(option.grossMarginPercent)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-black text-slate-950">
            {firstOption.optionName} Line Items
          </h2>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Line</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Measured</th>
                  <th className="px-4 py-3 text-right">Order Qty</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {firstOption.lineItems.map((line) => (
                  <tr
                    key={`${line.sourceType}-${line.description}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-950">
                      {line.description}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {line.sourceType}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {number(line.measuredQuantity)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-950">
                      {number(line.orderQuantity)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{line.unit}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {money(line.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-950">
                      {money(line.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
    </div>
  );
}
