#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const name = process.argv[2];

if (!name) {
	console.error("❌ Please provide a component name.");
	process.exit(1);
}

const cwd = process.cwd();
const componentDir = path.join(cwd, name);
const tsxFile = path.join(componentDir, `${name}.tsx`);
const cssFile = path.join(componentDir, `${name}.css`);

const toNextifiedName = (rawName) =>
	rawName
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");

const componentName = toNextifiedName(name);

// 1. Make the folder
if (!fs.existsSync(componentDir)) {
	fs.mkdirSync(componentDir);
	console.log(`📁 Created folder: ${componentDir}`);
} else {
	console.error(`⚠️ Folder "${name}" already exists.`);
	process.exit(1);
}

// 2. Create .tsx with a simple template
const tsxTemplate = `import React from "react";
import Image from "next/image";

export default function ${componentName}() {
  return ();
}
`;

fs.writeFileSync(tsxFile, tsxTemplate);
console.log(`✅ Created file: ${tsxFile}`);

// 3. Create .css file
const cssTemplate = ``;
fs.writeFileSync(cssFile, cssTemplate);
console.log(`✅ Created file: ${cssFile}`);

// 4. Add import line to _app.tsx
const appFile = path.join(cwd, "../../../pages/_app.tsx"); // relative from script to _app.tsx

if (fs.existsSync(appFile)) {
	const relativePath = path
		.relative(path.dirname(appFile), cssFile)
		.replace(/\\/g, "/");
	const importLine = `import "${relativePath}";\n`;

	let appContents = fs.readFileSync(appFile, "utf-8");

	if (!appContents.includes(importLine.trim())) {
		appContents = importLine + appContents;
		fs.writeFileSync(appFile, appContents, "utf-8");
		console.log(`✅ Added import to _app.tsx: ${importLine.trim()}`);
	} else {
		console.log("ℹ️ Import line already exists in _app.tsx");
	}
} else {
	console.warn(`⚠️ _app.tsx not found at ${appFile}. Skipping import.`);
}

// 5. Add component import + usage to corresponding page
const cwdParts = cwd.split(path.sep);
const srcIndex = cwdParts.lastIndexOf("src");
const componentsIndex =
	srcIndex >= 0 ? cwdParts.indexOf("components", srcIndex) : -1;
const pageName = cwdParts[cwdParts.length - 1];
const repoRoot =
	srcIndex >= 0 ? cwdParts.slice(0, srcIndex).join(path.sep) : null;
const pageFile =
	repoRoot && componentsIndex !== -1
		? path.join(repoRoot, "src", "pages", `${pageName}.tsx`)
		: null;

if (pageFile && fs.existsSync(pageFile)) {
	const relativeComponentPath = path
		.relative(path.dirname(pageFile), tsxFile)
		.replace(/\\/g, "/")
		.replace(/\.tsx$/, "");
	const importLine = `import ${componentName} from "${relativeComponentPath}";`;

	let pageContents = fs.readFileSync(pageFile, "utf-8");

	if (!pageContents.includes(importLine)) {
		const importMatches = pageContents.match(/^import .*;$/gm);
		if (importMatches && importMatches.length > 0) {
			const lastImport = importMatches[importMatches.length - 1];
			pageContents = pageContents.replace(
				lastImport,
				`${lastImport}\n${importLine}`
			);
		} else {
			pageContents = `${importLine}\n${pageContents}`;
		}
	}

	if (!pageContents.includes(`<${componentName} />`)) {
		const lastDivCloseIndex = pageContents.lastIndexOf("</div>");
		if (lastDivCloseIndex !== -1) {
			const beforeClose = pageContents.slice(0, lastDivCloseIndex);
			const afterClose = pageContents.slice(lastDivCloseIndex);
			const lineStartIndex = beforeClose.lastIndexOf("\n") + 1;
			const lineIndentMatch = beforeClose
				.slice(lineStartIndex)
				.match(/^(\s*)/);
			const baseIndent = lineIndentMatch ? lineIndentMatch[1] : "";
			const indentUnit = pageContents.includes("\n\t") ? "\t" : "  ";
			const insertIndent = `${baseIndent}${indentUnit}`;
			pageContents = `${beforeClose}${insertIndent}<${componentName} />\n${baseIndent}${afterClose}`;
		} else {
			console.warn(
				`⚠️ Could not find a closing </div> in ${pageFile}. Skipping component usage insertion.`
			);
		}
	}

	fs.writeFileSync(pageFile, pageContents, "utf-8");
	console.log(`✅ Added ${componentName} to ${pageFile}`);
} else {
	console.warn(`⚠️ Page not found. Skipping page update.`);
}

// sudo ln -s /Users/austinmiedema/code/Utility/create-component/create-component.js /usr/local/bin/create-component
// chmod +x /Users/austinmiedema/code/Utility/create-component/create-component.js
// create-component {name}
