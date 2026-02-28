#!/usr/bin/env bash

set -euo pipefail

# Portable AVIF compatibility fixer.
# Re-encodes incompatible AVIF files to AV1 Main + yuv420p in place.
#
# Usage:
#   bash scripts/portable/fix-avif-compat.sh [search_path]
# Example:
#   bash scripts/portable/fix-avif-compat.sh public/images

SEARCH_PATH="${1:-public/images}"

if ! command -v ffprobe >/dev/null 2>&1; then
	echo "Error: ffprobe is required but not found in PATH."
	exit 2
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
	echo "Error: ffmpeg is required but not found in PATH."
	exit 2
fi

if [ ! -d "$SEARCH_PATH" ]; then
	echo "Error: path '$SEARCH_PATH' does not exist."
	exit 2
fi

if ! ffmpeg -hide_banner -encoders 2>/dev/null | grep -q 'libsvtav1'; then
	echo "Error: ffmpeg encoder 'libsvtav1' is required but not available."
	exit 2
fi

count_total=0
count_fixed=0

while IFS= read -r -d '' file; do
	count_total=$((count_total + 1))
	meta="$(ffprobe -v error -select_streams v:0 -show_entries stream=profile,pix_fmt -of csv=p=0 "$file" 2>/dev/null || true)"
	profile="$(echo "$meta" | cut -d',' -f1 | tr -d '[:space:]')"
	pix_fmt="$(echo "$meta" | cut -d',' -f2 | tr -d '[:space:]')"

	if [ "$profile" != "Main" ] || [ "$pix_fmt" != "yuv420p" ]; then
		tmp="${file%.avif}.tmp.avif"
		echo "Fixing: $file (profile=${profile:-unknown}, pix_fmt=${pix_fmt:-unknown})"
		ffmpeg -y -i "$file" -an -c:v libsvtav1 -pix_fmt yuv420p -crf 35 -preset 8 -frames:v 1 "$tmp" >/dev/null 2>&1
		mv "$tmp" "$file"
		count_fixed=$((count_fixed + 1))
	fi
done < <(find "$SEARCH_PATH" -type f -name '*.avif' -print0)

if [ "$count_fixed" -eq 0 ]; then
	echo "Result: no changes needed. All AVIF files are already Main/yuv420p."
else
	echo "Result: fixed $count_fixed incompatible AVIF file(s) out of $count_total checked."
fi
