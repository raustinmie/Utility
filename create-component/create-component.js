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

export default function ${name}() {
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

// sudo ln -s /Users/austinmiedema/code/Utility/create-component/create-component.js /usr/local/bin/create-component
// chmod +x /Users/austinmiedema/code/Utility/create-component/create-component.js
// create-component {name}
