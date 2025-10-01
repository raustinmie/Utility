#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];

if (!filePath) {
	console.error("❌ Please provide a .tsx file path");
	process.exit(1);
}

// Read the file
let content = fs.readFileSync(filePath, "utf-8");

// --- 1. Rename the function ---
content = content.replace(/export default function ([\w-]+)\(/, (_, name) => {
	const newName = name
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join("");
	return `export default function ${newName}(`;
});

// --- 2. Comment out HTML comments ---
content = content.replace(/<!--(.*?)-->/gs, (_, comment) => `{/*${comment}*/}`);

// --- 3. Replace class= with className= ---
content = content.replace(/\bclass=/g, "className=");

// --- 4. Import next/image if missing ---
if (!content.includes('import Image from "next/image"')) {
	content = 'import Image from "next/image";\n' + content;
}

// --- 5. Handle <picture> elements ---
// Replace <picture> with a <div> wrapper that keeps the original attributes
content = content.replace(
	/<picture([^>]*)>([\s\S]*?)<\/picture>/gi,
	(_, pictureAttrs, inner) => {
		// Extract the <img> tag inside
		const imgMatch = inner.match(/<img([^>]*)>/i);
		if (!imgMatch) return `<div${pictureAttrs}>${inner}</div>`; // fallback

		let imgProps = imgMatch[1];

		// Extract width, height, src, alt
		const widthMatch = imgProps.match(/width=["'](\d+)["']/);
		const heightMatch = imgProps.match(/height=["'](\d+)["']/);
		const srcMatch = imgProps.match(/src=["']([^"']+)["']/);
		const altMatch = imgProps.match(/alt=["']([^"']*)["']/);

		const width = widthMatch ? widthMatch[1] : undefined;
		const height = heightMatch ? heightMatch[1] : undefined;
		const src = srcMatch ? srcMatch[1] : undefined;
		const alt = altMatch ? altMatch[1] : '""';

		// Build Next.js <Image> tag
		let imageTag = `<Image src="${src}" alt="${alt}"`;
		if (width) imageTag += ` width={${width}}`;
		if (height) imageTag += ` height={${height}}`;
		imageTag += " />";

		// Wrap <Image> in <div> with the original <picture> attributes
		return `<div${pictureAttrs}>${imageTag}</div>`;
	}
);

// --- 6. Convert remaining <img> tags outside <picture> ---
content = content.replace(/<img([^>]*)>/g, (_, props) => {
	const widthMatch = props.match(/width=["'](\d+)["']/);
	const heightMatch = props.match(/height=["'](\d+)["']/);
	const srcMatch = props.match(/src=["']([^"']+)["']/);
	const altMatch = props.match(/alt=["']([^"']*)["']/);

	const width = widthMatch ? widthMatch[1] : undefined;
	const height = heightMatch ? heightMatch[1] : undefined;
	const src = srcMatch ? srcMatch[1] : undefined;
	const alt = altMatch ? altMatch[1] : '""';

	let imageTag = `<Image src="${src}" alt="${alt}"`;
	if (width) imageTag += ` width={${width}}`;
	if (height) imageTag += ` height={${height}}`;
	imageTag += " />";

	return imageTag;
});

// --- 7. Import next/link if missing ---
if (
	!content.includes('import Link from "next/link"') &&
	/<a[\s>]/i.test(content)
) {
	content = 'import Link from "next/link";\n' + content;
}

// --- 8. Convert a tags to next/Link
content = content.replace(/<a(\s[^>]*)?>/gi, "<Link$1>");
content = content.replace(/<\/a>/gi, "</Link>");

// Overwrite file
fs.writeFileSync(filePath, content, "utf-8");
console.log(`✅ Nextified file overwritten: ${filePath}`);
