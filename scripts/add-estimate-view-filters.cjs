const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "src/app/estimates/page.tsx");

if (!fs.existsSync(filePath)) {
  console.error("Could not find src/app/estimates/page.tsx");
  process.exit(1);
}

let content = fs.readFileSync(filePath, "utf8");

const backupPath = `${filePath}.backup-view-filters-${Date.now()}`;
fs.writeFileSync(backupPath, content, "utf8");
console.log(`Backup created: ${backupPath}`);

const helperBlock = `
type EstimateViewFilter =
  | "Active"
  | "Drafts"
  | "Proposals"
  | "Orders"
  | "Lost"
  | "Archived"
  | "All";

const estimateViewFilters: EstimateViewFilter[] = [
  "Active",
  "Drafts",
  "Proposals",
  "Orders",
  "Lost",
  "Archived",
  "All",
];

function matchesEstimateView(status: string | null, view: EstimateViewFilter) {
  const normalizedStatus = status || "";

  if (view === "All") return true;

  if (view === "Active") {
    return normalizedStatus !== "Lost" && normalizedStatus !== "Archived";
  }

  if (view === "Drafts") {
    return (
      normalizedStatus === "Draft - Pending Measurements" ||
      normalizedStatus === "Draft - Pending Information"
    );
  }

  if (view === "Proposals") {
    return (
      normalizedStatus === "Proposal Created" ||
      normalizedStatus === "Proposal Sent" ||
      normalizedStatus === "Proposal Signed"
    );
  }

  if (view === "Orders") {
    return (
      normalizedStatus === "Orders Created" ||
      normalizedStatus === "Orders Sent"
    );
  }

  if (view === "Lost") {
    return normalizedStatus === "Lost";
  }

  if (view === "Archived") {
    return normalizedStatus === "Archived";
  }

  return true;
}
`;

if (!content.includes("type EstimateViewFilter")) {
  const insertBefore =
    content.indexOf("function formatMoney") !== -1
      ? "function formatMoney"
      : content.indexOf("export default function") !== -1
      ? "export default function"
      : null;

  if (!insertBefore) {
    console.error("Could not find a safe place to insert helper functions.");
    process.exit(1);
  }

  content = content.replace(insertBefore, `${helperBlock}\n${insertBefore}`);
} else {
  console.log("Estimate view helper block already exists.");
}

if (!content.includes("selectedViewFilter")) {
  const statePattern =
    /const\s+\[selectedStatus,\s*setSelectedStatus\]\s*=\s*useState<([^>]+)>\(([^)]*)\);/;

  if (statePattern.test(content)) {
    content = content.replace(
      statePattern,
      (match) =>
        `${match}\n  const [selectedViewFilter, setSelectedViewFilter] = useState<EstimateViewFilter>("Active");`
    );
  } else {
    const fallbackPattern =
      /const\s+\[searchText,\s*setSearchText\]\s*=\s*useState\(""\);/;

    if (fallbackPattern.test(content)) {
      content = content.replace(
        fallbackPattern,
        (match) =>
          `${match}\n  const [selectedViewFilter, setSelectedViewFilter] = useState<EstimateViewFilter>("Active");`
      );
    } else {
      console.error("Could not find where to add selectedViewFilter state.");
      process.exit(1);
    }
  }
} else {
  console.log("selectedViewFilter state already exists.");
}

if (!content.includes("matchesEstimateView(estimate.status, selectedViewFilter)")) {
  const returnPattern = /return\s+matchesSearch\s+&&\s+matchesStatus\s*;/;

  if (returnPattern.test(content)) {
    content = content.replace(
      returnPattern,
      "return matchesSearch && matchesStatus && matchesEstimateView(estimate.status, selectedViewFilter);"
    );
  } else {
    const activeFilterPattern =
      /const\s+filteredEstimates\s*=\s*estimates\s*\.filter\(\(estimate\)\s*=>\s*\{/;

    if (activeFilterPattern.test(content)) {
      content = content.replace(
        activeFilterPattern,
        `const filteredEstimates = estimates.filter((estimate) => {
    if (!matchesEstimateView(estimate.status, selectedViewFilter)) {
      return false;
    }`
      );
    } else {
      console.error("Could not find filteredEstimates filter logic.");
      process.exit(1);
    }
  }
} else {
  console.log("filteredEstimates already uses selectedViewFilter.");
}

if (!content.includes("View Type")) {
  const currentViewBlock = `<div className="mb-6 rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Current View
                </div>`;

  const newViewFilterBlock = `<div className="mb-6 rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  View Type
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {estimateViewFilters.map((view) => {
                    const active = selectedViewFilter === view;

                    return (
                      <button
                        key={view}
                        onClick={() => {
                          setSelectedViewFilter(view);
                          setSelectedStatus(null);
                        }}
                        className={\`rounded-lg px-3 py-2 text-sm font-bold \${
                          active
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-100"
                        }\`}
                      >
                        {view}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-6 rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Current View
                </div>`;

  if (content.includes(currentViewBlock)) {
    content = content.replace(currentViewBlock, newViewFilterBlock);
  } else {
    console.error("Could not find the Current View filter block.");
    process.exit(1);
  }
} else {
  console.log("View Type filter block already exists.");
}

content = content.replace(
  /\{selectedStatus \|\| "All Estimates"\}/g,
  '{selectedStatus || `${selectedViewFilter} Estimates`}'
);

fs.writeFileSync(filePath, content, "utf8");

console.log("Added estimate view filters.");
console.log("Default view is Active, which hides Lost and Archived.");