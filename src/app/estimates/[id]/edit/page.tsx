"use client";

import AppSidebar from "@/components/AppSidebar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Estimate = {
  id: string;
  customer_name: string | null;
  property_address: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  sales_rep: string | null;
  job_type: string | null;
  payment_type: string | null;
  quick_estimate: boolean | null;

  quick_estimate_squares: number | null;
  quick_estimate_pitch: string | null;
  quick_estimate_stories: string | null;
  quick_estimate_layers: number | null;
  quick_estimate_level: string | null;
  quick_estimate_shingle_type: string | null;
  quick_estimate_redeck: boolean | null;
  quick_estimate_shake_layer: boolean | null;
  quick_estimate_finance_product: string | null;
};

const pitchOptions = Array.from({ length: 25 }, (_, index) => `${index}/12`);
const storyOptions = ["One Story", "Two Story", "Three Story"];
const quickShingleOptions = ["NS", "HDZ", "UHDZ"];
const yesNoOptions = ["Yes", "No"];
const quickPaymentOptions = ["Cash", "Finance"];
const fullJobTypes = ["Insurance", "Retail", "Upgrade / Add-on", "Repair"];

const quickEstimateDisclaimer =
  "This is a quick estimate range only. Actual roof measurements, material selections, access conditions, waste, and final scope may increase or decrease the price. This range is not guaranteed without verified measurements.";

const quickFinanceProducts = [
  {
    value: "3122005",
    label: "12mo Deferred Interest / 20.99% APR / 5.24% fee",
    dealerFeePercent: 5.24,
  },
  {
    value: "1000605",
    label: "6.99% APR / 60mo / 7.49% fee",
    dealerFeePercent: 7.49,
  },
  {
    value: "1000615",
    label: "6.99% APR / 180mo / 14.99% fee",
    dealerFeePercent: 14.99,
  },
  {
    value: "1000905",
    label: "9.99% APR / 60mo / 2.49% fee",
    dealerFeePercent: 2.49,
  },
  {
    value: "1000915",
    label: "9.99% APR / 180mo / 5.99% fee",
    dealerFeePercent: 5.99,
  },
];

function getFinanceProduct(value: string) {
  return quickFinanceProducts.find((product) => product.value === value) ?? null;
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function boolToYesNo(value: boolean | null | undefined) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
}

function parsePitchNumber(pitch: string) {
  const raw = pitch.split("/")[0];
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getQuickRange({
  squares,
  pitch,
  stories,
  layers,
  shingleType,
  redeck,
  shakeLayer,
  paymentType,
  financeProduct,
}: {
  squares: string;
  pitch: string;
  stories: string;
  layers: string;
  shingleType: string;
  redeck: string;
  shakeLayer: string;
  paymentType: string;
  financeProduct: string;
}) {
  const squareCount = Number(squares);
  const layerCount = Number(layers);

  if (
    Number.isNaN(squareCount) ||
    squareCount <= 0 ||
    !pitch ||
    !stories ||
    Number.isNaN(layerCount) ||
    layerCount < 0 ||
    !Number.isInteger(layerCount) ||
    !shingleType ||
    !redeck ||
    !shakeLayer ||
    !paymentType
  ) {
    return null;
  }

  if (paymentType === "Finance" && !financeProduct) return null;

  const baseRates: Record<string, number> = {
    NS: 500,
    HDZ: 575,
    UHDZ: 675,
  };

  const pitchNumber = parsePitchNumber(pitch);

  let pitchMultiplier = 1;

  if (pitchNumber >= 13) {
    pitchMultiplier = 1.3;
  } else if (pitchNumber >= 11) {
    pitchMultiplier = 1.18;
  } else if (pitchNumber >= 9) {
    pitchMultiplier = 1.1;
  } else if (pitchNumber >= 7) {
    pitchMultiplier = 1.05;
  }

  const storyMultiplier =
    stories === "Three Story" ? 1.1 : stories === "Two Story" ? 1.05 : 1;

  const layerMultiplier = 1 + Math.max(layerCount - 1, 0) * 0.07;
  const redeckAdder = redeck === "Yes" ? 175 : 0;
  const shakeLayerAdder = shakeLayer === "Yes" ? 75 : 0;

  const rate =
    (baseRates[shingleType] ?? baseRates.NS) + redeckAdder + shakeLayerAdder;

  const cashMidpoint =
    squareCount * rate * pitchMultiplier * storyMultiplier * layerMultiplier;

  const cashLow = Math.round(cashMidpoint * 0.9);
  const cashHigh = Math.round(cashMidpoint * 1.15);
  const cashRoundedMidpoint = Math.round(cashMidpoint);

  const selectedFinanceProduct = getFinanceProduct(financeProduct);
  const dealerFeePercent =
    paymentType === "Finance" ? selectedFinanceProduct?.dealerFeePercent ?? 0 : 0;

  const dealerFeeLow = Math.round(cashLow * (dealerFeePercent / 100));
  const dealerFeeHigh = Math.round(cashHigh * (dealerFeePercent / 100));
  const dealerFeeMidpoint = Math.round(
    cashRoundedMidpoint * (dealerFeePercent / 100)
  );

  return {
    low: cashLow + dealerFeeLow,
    high: cashHigh + dealerFeeHigh,
    midpoint: cashRoundedMidpoint + dealerFeeMidpoint,

    cashLow,
    cashHigh,
    cashMidpoint: cashRoundedMidpoint,

    dealerFeePercent,
    dealerFeeLow,
    dealerFeeHigh,
    dealerFeeMidpoint,
  };
}

export default function EditEstimateInfoPage() {
  const router = useRouter();
  const params = useParams();

  const estimateId =
    typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [salesRep, setSalesRep] = useState("");
  const [jobType, setJobType] = useState("");

  const [quickSquares, setQuickSquares] = useState("");
  const [quickPitch, setQuickPitch] = useState("");
  const [quickStories, setQuickStories] = useState("");
  const [quickLayers, setQuickLayers] = useState("");
  const [quickShakeLayer, setQuickShakeLayer] = useState("");
  const [quickRedeck, setQuickRedeck] = useState("");
  const [quickPaymentType, setQuickPaymentType] = useState("");
  const [quickFinanceProduct, setQuickFinanceProduct] = useState("");
  const [quickShingleType, setQuickShingleType] = useState("");

  useEffect(() => {
    async function loadEstimate() {
      if (!estimateId) return;

      const { data, error } = await supabase
        .from("estimates")
        .select(
          [
            "id",
            "customer_name",
            "property_address",
            "customer_phone",
            "customer_email",
            "sales_rep",
            "job_type",
            "payment_type",
            "quick_estimate",
            "quick_estimate_squares",
            "quick_estimate_pitch",
            "quick_estimate_stories",
            "quick_estimate_layers",
            "quick_estimate_level",
            "quick_estimate_shingle_type",
            "quick_estimate_redeck",
            "quick_estimate_shake_layer",
            "quick_estimate_finance_product",
          ].join(", ")
        )
        .eq("id", estimateId)
        .single();

      if (error) {
        setErrorMessage(error.message);
      } else {
        const loaded = data as Estimate;
        setEstimate(loaded);

        setCustomerName(loaded.customer_name ?? "");
        setPropertyAddress(loaded.property_address ?? "");
        setCustomerPhone(loaded.customer_phone ?? "");
        setCustomerEmail(loaded.customer_email ?? "");
        setSalesRep(loaded.sales_rep ?? "");
        setJobType(loaded.job_type ?? "Insurance");

        setQuickSquares(
          loaded.quick_estimate_squares === null ||
            loaded.quick_estimate_squares === undefined
            ? ""
            : String(loaded.quick_estimate_squares)
        );
        setQuickPitch(loaded.quick_estimate_pitch ?? "");
        setQuickStories(loaded.quick_estimate_stories ?? "");
        setQuickLayers(
          loaded.quick_estimate_layers === null ||
            loaded.quick_estimate_layers === undefined
            ? ""
            : String(loaded.quick_estimate_layers)
        );
        setQuickShakeLayer(boolToYesNo(loaded.quick_estimate_shake_layer));
        setQuickRedeck(boolToYesNo(loaded.quick_estimate_redeck));
        setQuickPaymentType(loaded.payment_type ?? "");
        setQuickFinanceProduct(loaded.quick_estimate_finance_product ?? "");
        setQuickShingleType(
          loaded.quick_estimate_shingle_type ||
            loaded.quick_estimate_level ||
            "HDZ"
        );
      }

      setLoading(false);
    }

    loadEstimate();
  }, [estimateId]);

  const quickRange = useMemo(() => {
    return getQuickRange({
      squares: quickSquares,
      pitch: quickPitch,
      stories: quickStories,
      layers: quickLayers,
      shingleType: quickShingleType,
      redeck: quickRedeck,
      shakeLayer: quickShakeLayer,
      paymentType: quickPaymentType,
      financeProduct: quickFinanceProduct,
    });
  }, [
    quickSquares,
    quickPitch,
    quickStories,
    quickLayers,
    quickShingleType,
    quickRedeck,
    quickShakeLayer,
    quickPaymentType,
    quickFinanceProduct,
  ]);

  function validateSharedFields() {
    if (!customerName.trim()) return "Customer name is required.";
    if (!propertyAddress.trim()) return "Property address is required.";
    if (!salesRep.trim()) return "Sales rep is required.";

    if (!customerPhone.trim() && !customerEmail.trim()) {
      return "Customer phone or customer email is required.";
    }

    return "";
  }

  function validateQuickFields() {
    const sharedError = validateSharedFields();
    if (sharedError) return sharedError;

    const squareCount = Number(quickSquares);
    if (!quickSquares.trim() || Number.isNaN(squareCount) || squareCount <= 0) {
      return "# of SQ must be greater than 0.";
    }

    if (!quickPitch) return "Pitch is required.";
    if (!quickStories) return "Stories is required.";

    const layerCount = Number(quickLayers);
    if (
      !quickLayers.trim() ||
      Number.isNaN(layerCount) ||
      layerCount < 0 ||
      !Number.isInteger(layerCount)
    ) {
      return "Layers must be a whole number 0 or greater.";
    }

    if (!quickShakeLayer) return "Shake layer answer is required.";
    if (!quickRedeck) return "Redeck answer is required.";
    if (!quickPaymentType) return "Cash or Finance is required.";

    if (quickPaymentType === "Finance" && !quickFinanceProduct) {
      return "Finance product is required.";
    }

    if (!quickShingleType) return "Shingle type is required.";
    if (!quickRange) return "Quick estimate range could not be calculated.";

    return "";
  }

  async function saveInfo() {
    if (!estimate) return;

    setErrorMessage("");

    const isQuick = estimate.quick_estimate === true;

    const validationError = isQuick
      ? validateQuickFields()
      : validateSharedFields();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!isQuick && !jobType.trim()) {
      setErrorMessage("Job type is required.");
      return;
    }

    setSaving(true);

    const updatePayload: Record<string, unknown> = {
      customer_name: customerName.trim(),
      property_address: propertyAddress.trim(),
      customer_phone: customerPhone.trim() || null,
      customer_email: customerEmail.trim() || null,
      sales_rep: salesRep.trim(),
    };

    if (isQuick) {
      if (!quickRange) {
        setSaving(false);
        setErrorMessage("Quick estimate range could not be calculated.");
        return;
      }

      const squareCount = Number(quickSquares);
      const layerCount = Number(quickLayers);

      updatePayload.payment_type = quickPaymentType;
      updatePayload.quick_estimate_squares = squareCount;
      updatePayload.quick_estimate_pitch = quickPitch;
      updatePayload.quick_estimate_stories = quickStories;
      updatePayload.quick_estimate_layers = layerCount;
      updatePayload.quick_estimate_level = quickShingleType;
      updatePayload.quick_estimate_shingle_type = quickShingleType;
      updatePayload.quick_estimate_redeck = quickRedeck === "Yes";
      updatePayload.quick_estimate_shake_layer = quickShakeLayer === "Yes";
      updatePayload.quick_estimate_finance_product =
        quickPaymentType === "Finance" ? quickFinanceProduct : null;
      updatePayload.quick_estimate_dealer_fee_percent =
        quickRange.dealerFeePercent;
      updatePayload.quick_estimate_cash_low_price = quickRange.cashLow;
      updatePayload.quick_estimate_cash_high_price = quickRange.cashHigh;
      updatePayload.quick_estimate_dealer_fee_low_amount =
        quickRange.dealerFeeLow;
      updatePayload.quick_estimate_dealer_fee_high_amount =
        quickRange.dealerFeeHigh;
      updatePayload.quick_estimate_low_price = quickRange.low;
      updatePayload.quick_estimate_high_price = quickRange.high;
      updatePayload.quick_estimate_disclaimer = quickEstimateDisclaimer;

      updatePayload.roof_squares = squareCount;
      updatePayload.roof_area_sf = squareCount * 100;
      updatePayload.pitch = quickPitch;
      updatePayload.stories = quickStories;
      updatePayload.roof_layers = layerCount;
    } else {
      updatePayload.job_type = jobType;
    }

    const { error } = await supabase
      .from("estimates")
      .update(updatePayload)
      .eq("id", estimate.id);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (isQuick) {
      router.push(`/estimates/${estimate.id}/quick-estimate`);
    } else {
      router.push(`/estimates/${estimate.id}`);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="rounded-lg bg-white p-4 text-sm font-semibold shadow">
          Loading edit page...
        </div>
      </main>
    );
  }

  if (!estimate) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="rounded-lg bg-white p-5 shadow">
          Estimate not found.
        </div>
      </main>
    );
  }

  const isQuick = estimate.quick_estimate === true;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <AppSidebar active="Estimates" />

        <section className="min-h-screen min-w-0 flex-1 p-5 lg:ml-[var(--sidebar-width)]">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 border-b border-slate-300 pb-5">
              <button
                onClick={() =>
                  router.push(
                    isQuick
                      ? `/estimates/${estimate.id}/quick-estimate`
                      : `/estimates/${estimate.id}`
                  )
                }
                className="mb-2 text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                ← Back
              </button>

              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Review / Edit Info
                </div>
                <h1 className="mt-2 text-3xl font-black text-slate-950">
                  {customerName || "Unnamed Customer"}
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  Double-check and edit the information entered at the start.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Customer Information
                    </h2>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Customer Name"
                        value={customerName}
                        onChange={setCustomerName}
                        required
                      />

                      <TextField
                        label="Sales Rep"
                        value={salesRep}
                        onChange={setSalesRep}
                        required
                      />
                    </div>

                    <TextField
                      label="Property Address"
                      value={propertyAddress}
                      onChange={setPropertyAddress}
                      required
                    />

                    <div>
                      <div className="mb-2 text-xs font-bold text-slate-500">
                        Customer contact required: enter phone, email, or both.
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <TextField
                          label="Customer Phone"
                          value={customerPhone}
                          onChange={setCustomerPhone}
                          inputType="tel"
                        />

                        <TextField
                          label="Customer Email"
                          value={customerEmail}
                          onChange={setCustomerEmail}
                          inputType="email"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {!isQuick && (
                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                        Estimate Setup
                      </h2>
                    </div>

                    <div className="p-4">
                      <SelectField
                        label="Job Type"
                        value={jobType}
                        onChange={setJobType}
                        options={fullJobTypes}
                        required
                      />
                    </div>
                  </div>
                )}

                {isQuick && (
                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                        Quick Estimate Inputs
                      </h2>
                    </div>

                    <div className="grid gap-3 p-4 md:grid-cols-2">
                      <NumberField
                        label="# of SQ"
                        value={quickSquares}
                        onChange={setQuickSquares}
                        required
                      />

                      <SelectField
                        label="Pitch"
                        value={quickPitch}
                        onChange={setQuickPitch}
                        options={pitchOptions}
                        required
                      />

                      <SelectField
                        label="Stories"
                        value={quickStories}
                        onChange={setQuickStories}
                        options={storyOptions}
                        required
                      />

                      <IntegerField
                        label="Layers"
                        value={quickLayers}
                        onChange={setQuickLayers}
                        required
                      />

                      <SelectField
                        label="Shake Layer Under Shingles?"
                        value={quickShakeLayer}
                        onChange={setQuickShakeLayer}
                        options={yesNoOptions}
                        required
                      />

                      <SelectField
                        label="Redeck?"
                        value={quickRedeck}
                        onChange={setQuickRedeck}
                        options={yesNoOptions}
                        required
                      />

                      <SelectField
                        label="Cash or Finance"
                        value={quickPaymentType}
                        onChange={(value) => {
                          setQuickPaymentType(value);
                          if (value !== "Finance") setQuickFinanceProduct("");
                        }}
                        options={quickPaymentOptions}
                        required
                      />

                      {quickPaymentType === "Finance" && (
                        <SelectField
                          label="Finance Product"
                          value={quickFinanceProduct}
                          onChange={setQuickFinanceProduct}
                          options={quickFinanceProducts.map(
                            (product) => product.label
                          )}
                          optionValues={quickFinanceProducts.map(
                            (product) => product.value
                          )}
                          required
                        />
                      )}

                      <SelectField
                        label="Shingle Type"
                        value={quickShingleType}
                        onChange={setQuickShingleType}
                        options={quickShingleOptions}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Workflow Shortcuts
                    </h2>
                  </div>

                  <div className="space-y-2 p-4">
                    <Link
                      href={isQuick ? `/estimates/${estimate.id}/quick-estimate` : `/estimates/${estimate.id}`}
                      className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Back to Estimate
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}/measurements`}
                      className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Measurements
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}/questions`}
                      className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Job Questions
                    </Link>

                    <Link
                      href={`/estimates/${estimate.id}/options`}
                      className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Options
                    </Link>
                  </div>
                </div>
                {isQuick && quickRange && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-wide text-blue-700">
                      Updated Range Preview
                    </div>
                    <div className="mt-1 text-2xl font-black text-slate-950">
                      {formatMoney(quickRange.low)} -{" "}
                      {formatMoney(quickRange.high)}
                    </div>
                    {quickPaymentType === "Finance" && (
                      <div className="mt-2 text-xs font-semibold text-slate-700">
                        Includes dealer fee pass-through of{" "}
                        {quickRange.dealerFeePercent.toFixed(2)}%.
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                      Save Changes
                    </h2>
                  </div>

                  <div className="space-y-3 p-4">
                    <p className="text-sm font-medium text-slate-600">
                      Review this information before moving forward. Save any changes to update the estimate.
                    </p>

                    <button
                      onClick={saveInfo}
                      disabled={saving}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  inputType = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inputType?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label} {required ? "*" : ""}
      </label>
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label} {required ? "*" : ""}
      </label>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
      />
    </div>
  );
}

function IntegerField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label} {required ? "*" : ""}
      </label>
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  optionValues,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  optionValues?: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label} {required ? "*" : ""}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
      >
        <option value="">Select</option>
        {options.map((option, index) => {
          const optionValue = optionValues?.[index] ?? option;

          return (
            <option key={optionValue} value={optionValue}>
              {option}
            </option>
          );
        })}
      </select>
    </div>
  );
}
