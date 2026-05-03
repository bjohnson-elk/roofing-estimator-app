const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "src/app/estimates/page.tsx");

if (!fs.existsSync(filePath)) {
  console.error("Could not find src/app/estimates/page.tsx");
  process.exit(1);
}

let content = fs.readFileSync(filePath, "utf8");

const backupPath = `${filePath}.backup-fix-open-estimate-${Date.now()}`;
fs.writeFileSync(backupPath, content, "utf8");
console.log(`Backup created: ${backupPath}`);

if (!content.includes('import Link from "next/link";')) {
  if (content.trimStart().startsWith('"use client";')) {
    content = content.replace(
      '"use client";',
      '"use client";\n\nimport Link from "next/link";'
    );
  } else {
    content = `import Link from "next/link";\n${content}`;
  }
}

// Remove any existing Open Estimate Link block that may have been inserted in the wrong place.
const badOpenEstimateBlock =
  /\n?\s*<Link\s+href=\{`\/estimates\/\$\{estimate\.id\}`\}\s+className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"\s*>\s*Open Estimate\s*<\/Link>\s*/g;

content = content.replace(badOpenEstimateBlock, "\n");

// Find the estimate map block. This handles filteredEstimates.map, estimates.map, etc.
const mapRegex =
  /(\{?\s*[a-zA-Z0-9_]+\.map\(\(?estimate\)?\s*=>\s*\(?\s*)(<div\s+className="[^"]*")/;

if (!mapRegex.test(content)) {
  console.error(
    "Could not find an estimate.map block. The bad button was removed, but the new button was not added."
  );
  fs.writeFileSync(filePath, content, "utf8");
  process.exit(1);
}

const openEstimateButton = `
              <Link
                href={\`/estimates/\${estimate.id}\`}
                className="mb-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
              >
                Open Estimate
              </Link>
`;

content = content.replace(mapRegex, (match, mapStart, divStart) => {
  return `${mapStart}${divStart}`;
});

// Insert the button right after the opening div inside the estimate map.
const mapStartMatch = content.match(
  /\{?\s*[a-zA-Z0-9_]+\.map\(\(?estimate\)?\s*=>\s*\(?\s*<div\s+className="[^"]*"[^>]*>/
);

if (!mapStartMatch || mapStartMatch.index === undefined) {
  console.error(
    "Found the estimate map, but could not find the opening estimate card div."
  );
  fs.writeFileSync(filePath, content, "utf8");
  process.exit(1);
}

const insertAt = mapStartMatch.index + mapStartMatch[0].length;

content =
  content.slice(0, insertAt) + openEstimateButton + content.slice(insertAt);

fs.writeFileSync(filePath, content, "utf8");

console.log("Fixed Open Estimate link placement.");