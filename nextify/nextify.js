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

// --- 2. Remove section header comments outside <section> tags ---
const removeOutsideSections = (input, pattern) => {
	const sectionRegex = /<section\b[^>]*>[\s\S]*?<\/section>/gi;
	let result = "";
	let lastIndex = 0;
	let match;

	while ((match = sectionRegex.exec(input)) !== null) {
		const outside = input.slice(lastIndex, match.index);
		result += outside.replace(pattern, "");
		result += match[0];
		lastIndex = match.index + match[0].length;
	}

	const tail = input.slice(lastIndex);
	result += tail.replace(pattern, "");
	return result;
};

const sectionHeaderComment = /<!--\s*={8,}\s*-->\s*<!--[\s\S]*?-->\s*<!--\s*={8,}\s*-->\s*/g;
content = removeOutsideSections(content, sectionHeaderComment);

// --- 3. Comment out HTML comments ---
content = content.replace(/<!--(.*?)-->/gs, (_, comment) => `{/*${comment}*/}`);

// --- 4. Replace class= with className= ---
content = content.replace(/\bclass=/g, "className=");

// --- 5. Import next/image if missing ---
if (!content.includes('import Image from "next/image"')) {
	content = 'import Image from "next/image";\n' + content;
}

// --- 6. Handle <picture> elements ---
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

		// Remove handled attributes so we don’t duplicate them
		let remaining = imgProps
			.replace(/\b(width|height|src|alt)=["'][^"']*["']/gi, "")
			.trim();

		// Clean up trailing slash
		if (remaining.endsWith("/")) remaining = remaining.slice(0, -1).trim();

		// Build Next.js <Image> tag, preserving other props (like className)
		let imageTag = `<Image src="${src}" alt="${alt}"`;
		if (width) imageTag += ` width={${width}}`;
		if (height) imageTag += ` height={${height}}`;
		if (remaining) imageTag += ` ${remaining}`;
		imageTag += " />";

		// Wrap <Image> in <div> with the original <picture> attributes
		return `<div${pictureAttrs}>${imageTag}</div>`;
	}
);

// --- 7. Convert remaining <img> tags outside <picture> ---
content = content.replace(/<img([^>]*)>/g, (_, props) => {
	const widthMatch = props.match(/width=["'](\d+)["']/);
	const heightMatch = props.match(/height=["'](\d+)["']/);
	const srcMatch = props.match(/src=["']([^"']+)["']/);
	const altMatch = props.match(/alt=["']([^"']*)["']/);

	const width = widthMatch ? widthMatch[1] : undefined;
	const height = heightMatch ? heightMatch[1] : undefined;
	const src = srcMatch ? srcMatch[1] : undefined;
	const alt = altMatch ? altMatch[1] : '""';

	let remaining = props
		.replace(/\b(width|height|src|alt)=["'][^"']*["']/gi, "")
		.trim();

	if (remaining.endsWith("/")) remaining = remaining.slice(0, -1).trim();

	let imageTag = `<Image src="${src}" alt="${alt}"`;
	if (width) imageTag += ` width={${width}}`;
	if (height) imageTag += ` height={${height}}`;
	if (remaining) imageTag += ` ${remaining}`;
	imageTag += " />";

	return imageTag;
});

// --- 8. Import next/link if missing ---
if (
	!content.includes('import Link from "next/link"') &&
	/<a[\s>]/i.test(content)
) {
	content = 'import Link from "next/link";\n' + content;
}

// --- 9. Convert a tags to next/Link
content = content.replace(/<a(\s[^>]*)?>/gi, "<Link$1>");
content = content.replace(/<\/a>/gi, "</Link>");

// Overwrite file
fs.writeFileSync(filePath, content, "utf-8");
console.log(`✅ Nextified file overwritten: ${filePath}`);
