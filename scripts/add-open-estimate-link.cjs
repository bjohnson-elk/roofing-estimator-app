const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "src/app/estimates/page.tsx");

if (!fs.existsSync(filePath)) {
  console.error("Could not find src/app/estimates/page.tsx");
  process.exit(1);
}

let content = fs.readFileSync(filePath, "utf8");

const backupPath = `${filePath}.backup-${Date.now()}`;
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

if (content.includes(">Open Estimate<")) {
  console.log("Open Estimate link already exists. No changes made.");
  fs.writeFileSync(filePath, content, "utf8");
  process.exit(0);
}

const openEstimateLink = `
<Link
  href={\`/estimates/\${estimate.id}\`}
  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
>
  Open Estimate
</Link>
`;

const actionBlockPatterns = [
  /(<Link[\s\S]*?href=\{`\/estimates\/\$\{estimate\.id\}\/measurements`\}[\s\S]*?<\/Link>)/,
  /(<Link[\s\S]*?href=\{`\/estimates\/\$\{estimate\.id\}\/questions`\}[\s\S]*?<\/Link>)/,
  /(<Link[\s\S]*?href=\{`\/estimates\/\$\{estimate\.id\}\/options`\}[\s\S]*?<\/Link>)/,
  /(<Link[\s\S]*?href=\{`\/estimates\/\$\{estimate\.id\}\/proposal`\}[\s\S]*?<\/Link>)/,
  /(<Link[\s\S]*?href=\{`\/estimates\/\$\{estimate\.id\}\/orders`\}[\s\S]*?<\/Link>)/,
];

let replaced = false;

for (const pattern of actionBlockPatterns) {
  if (pattern.test(content)) {
    content = content.replace(pattern, `${openEstimateLink}\n$1`);
    replaced = true;
    break;
  }
}

if (!replaced) {
  const cardFooterPattern =
    /(<div\s+className="[^"]*(?:flex|grid)[^"]*"[^>]*>\s*)/;

  if (cardFooterPattern.test(content)) {
    content = content.replace(cardFooterPattern, `$1\n${openEstimateLink}\n`);
    replaced = true;
  }
}

if (!replaced) {
  console.error(
    "Could not safely find where to insert the Open Estimate link. Backup was created and no changes were written."
  );
  process.exit(1);
}

fs.writeFileSync(filePath, content, "utf8");

console.log("Added Open Estimate link to src/app/estimates/page.tsx");