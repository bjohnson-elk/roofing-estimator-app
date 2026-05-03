const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

const filesToUpdate = [
  {
    file: "src/app/dashboard/page.tsx",
    active: "Dashboard",
  },
  {
    file: "src/app/estimates/page.tsx",
    active: "Estimates",
  },
  {
    file: "src/app/estimates/[id]/page.tsx",
    active: "Estimates",
  },
  {
    file: "src/app/estimates/[id]/measurements/page.tsx",
    active: "Estimates",
  },
  {
    file: "src/app/estimates/[id]/questions/page.tsx",
    active: "Estimates",
  },
  {
    file: "src/app/estimates/[id]/options/page.tsx",
    active: "Estimates",
  },
  {
    file: "src/app/estimates/[id]/proposal/page.tsx",
    active: "Estimates",
  },
  {
    file: "src/app/estimates/[id]/orders/page.tsx",
    active: "Estimates",
  },
];

function addImport(content) {
  if (content.includes('import AppSidebar from "@/components/AppSidebar";')) {
    return content;
  }

  const useClientLine = `"use client";`;

  if (content.trimStart().startsWith(useClientLine)) {
    return content.replace(
      useClientLine,
      `${useClientLine}\n\nimport AppSidebar from "@/components/AppSidebar";`
    );
  }

  return `import AppSidebar from "@/components/AppSidebar";\n${content}`;
}

function replaceSidebar(content, active) {
  const asideRegex =
    /<aside\s+className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-slate-950 text-white lg:flex">[\s\S]*?<\/aside>/;

  if (!asideRegex.test(content)) {
    return {
      content,
      replaced: false,
    };
  }

  return {
    content: content.replace(asideRegex, `<AppSidebar active="${active}" />`),
    replaced: true,
  };
}

for (const item of filesToUpdate) {
  const fullPath = path.join(projectRoot, item.file);

  if (!fs.existsSync(fullPath)) {
    console.log(`SKIPPED missing file: ${item.file}`);
    continue;
  }

  const original = fs.readFileSync(fullPath, "utf8");

  if (!original.includes("ELKSTONE") && !original.includes("<aside")) {
    console.log(`SKIPPED no old sidebar found: ${item.file}`);
    continue;
  }

  let updated = addImport(original);
  const result = replaceSidebar(updated, item.active);
  updated = result.content;

  if (!result.replaced) {
    console.log(`SKIPPED could not match sidebar block: ${item.file}`);
    continue;
  }

  fs.writeFileSync(fullPath, updated, "utf8");
  console.log(`UPDATED: ${item.file}`);
}

console.log("Done.");