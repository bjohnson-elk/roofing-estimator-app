const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "src/app/estimates/page.tsx");

if (!fs.existsSync(filePath)) {
  console.error("Could not find src/app/estimates/page.tsx");
  process.exit(1);
}

let content = fs.readFileSync(filePath, "utf8");

const backupPath = `${filePath}.backup-open-detail-${Date.now()}`;
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

// Remove any previously misplaced Open Estimate button using estimate.id.
content = content.replace(
  /\n?\s*<Link\s+href=\{`\/estimates\/\$\{estimate\.id\}`\}[\s\S]*?Open Estimate[\s\S]*?<\/Link>\s*/g,
  "\n"
);

// Do not duplicate the correct button.
if (content.includes('href={`/estimates/${selectedEstimate.id}`}')) {
  console.log("Open Estimate button already exists. No changes made.");
  fs.writeFileSync(filePath, content, "utf8");
  process.exit(0);
}

const target = `<span className={getStatusBadge(selectedEstimate.status)}>
                      {selectedEstimate.status || "No Status"}
                    </span>
                  </div>`;

const replacement = `<div className="flex flex-col items-start gap-3 xl:items-end">
                      <span className={getStatusBadge(selectedEstimate.status)}>
                        {selectedEstimate.status || "No Status"}
                      </span>

                      <Link
                        href={\`/estimates/\${selectedEstimate.id}\`}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                      >
                        Open Estimate
                      </Link>
                    </div>
                  </div>`;

if (!content.includes(target)) {
  console.error("Could not find the selected estimate status block.");
  console.error("No changes written except backup.");
  process.exit(1);
}

content = content.replace(target, replacement);

fs.writeFileSync(filePath, content, "utf8");

console.log("Added Open Estimate button to the selected estimate detail panel.");