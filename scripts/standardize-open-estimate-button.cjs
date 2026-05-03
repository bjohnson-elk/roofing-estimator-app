const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "src/app/estimates/page.tsx");

if (!fs.existsSync(filePath)) {
  console.error("Could not find src/app/estimates/page.tsx");
  process.exit(1);
}

let content = fs.readFileSync(filePath, "utf8");

const backupPath = `${filePath}.backup-standardize-open-${Date.now()}`;
fs.writeFileSync(backupPath, content, "utf8");
console.log(`Backup created: ${backupPath}`);

const before = `{getActionLabel(selectedEstimate.status)}`;
const after = `Open Estimate`;

if (!content.includes(before)) {
  console.log("Dynamic action label not found. No changes made.");
  process.exit(0);
}

content = content.replace(before, after);

fs.writeFileSync(filePath, content, "utf8");

console.log("Changed selected estimate action button to always say Open Estimate.");