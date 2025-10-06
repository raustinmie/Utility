#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function normalizeExtensions(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			// Recurse into subdirectories
			normalizeExtensions(fullPath);
		} else {
			const ext = path.extname(entry.name);
			const base = path.basename(entry.name, ext);

			const lowerExt = ext.toLowerCase();

			if (ext !== lowerExt) {
				const newName = base + lowerExt;
				const newPath = path.join(dir, newName);

				// Rename file if needed
				console.log(`Renaming: ${entry.name} -> ${newName}`);
				fs.renameSync(fullPath, newPath);
			}
		}
	}
}

// Get directory from args, default is current folder
const targetDir = process.argv[2] || ".";
normalizeExtensions(path.resolve(targetDir));
