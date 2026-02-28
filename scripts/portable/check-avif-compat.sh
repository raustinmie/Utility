#!/usr/bin/env bash

set -euo pipefail

# Portable AVIF compatibility checker.
# Usage:
#   bash scripts/portable/check-avif-compat.sh [search_path]
# Example:
#   bash scripts/portable/check-avif-compat.sh public/images

SEARCH_PATH="${1:-public/images}"

if ! command -v ffprobe >/dev/null 2>&1; then
	echo "Error: ffprobe is required but not found in PATH."
	exit 2
fi

if [ ! -d "$SEARCH_PATH" ]; then
	echo "Error: path '$SEARCH_PATH' does not exist."
	exit 2
fi

count_bad=0
count_total=0

while IFS= read -r -d '' file; do
	count_total=$((count_total + 1))
	meta="$(ffprobe -v error -select_streams v:0 -show_entries stream=profile,pix_fmt -of csv=p=0 "$file" 2>/dev/null || true)"
	profile="$(echo "$meta" | cut -d',' -f1 | tr -d '[:space:]')"
	pix_fmt="$(echo "$meta" | cut -d',' -f2 | tr -d '[:space:]')"

	if [ "$profile" != "Main" ] || [ "$pix_fmt" != "yuv420p" ]; then
		if [ "$count_bad" -eq 0 ]; then
			echo "Incompatible AVIF files found (Safari-risk):"
		fi
		count_bad=$((count_bad + 1))
		echo " - $file (profile=${profile:-unknown}, pix_fmt=${pix_fmt:-unknown})"
	fi
done < <(find "$SEARCH_PATH" -type f -name '*.avif' -print0)

if [ "$count_bad" -gt 0 ]; then
	echo ""
	echo "Result: $count_bad/$count_total AVIF files are not Main/yuv420p."
	echo "Recommendation: re-encode to AV1 Main + yuv420p for Safari compatibility."
	exit 1
fi

echo "Result: all $count_total AVIF files are Main/yuv420p."
