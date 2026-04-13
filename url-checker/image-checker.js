const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
require("dotenv").config();

const { PAGES_TO_CHECK } = require("./url-checker");

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

async function sendEmail(subject, body) {
	await transporter.sendMail({
		from: '"Site Monitor" <austin@harborviewwebdesign.com>',
		to: process.env.EMAIL_TO,
		subject,
		text: body,
	});
}

function normalizeToAbsolute(pageUrl, maybeUrl) {
	if (!maybeUrl) return null;
	const raw = maybeUrl.trim();
	if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return null;
	try {
		return new URL(raw, pageUrl).href;
	} catch {
		return null;
	}
}

function parseSrcsetUrls(srcsetValue, pageUrl) {
	if (!srcsetValue) return [];
	return srcsetValue
		.split(",")
		.map((candidate) => candidate.trim().split(/\s+/)[0])
		.map((url) => normalizeToAbsolute(pageUrl, url))
		.filter(Boolean);
}

function isLikelyAvif(url, explicitType) {
	const type = (explicitType || "").toLowerCase();
	if (type.includes("image/avif")) return true;
	try {
		const pathname = new URL(url).pathname.toLowerCase();
		return pathname.endsWith(".avif");
	} catch {
		return false;
	}
}

function collectImagesFromPage(pageUrl, html) {
	const $ = cheerio.load(html);
	const refs = [];

	$("picture").each((_, pictureEl) => {
		const pictureUrls = [];
		let hasAvif = false;
		let hasNonAvif = false;

		$(pictureEl)
			.find("source")
			.each((__, sourceEl) => {
				const explicitType = $(sourceEl).attr("type");
				const srcset = $(sourceEl).attr("srcset") || $(sourceEl).attr("data-srcset");
				const urls = parseSrcsetUrls(srcset, pageUrl);
				for (const url of urls) {
					pictureUrls.push(url);
					const avif = isLikelyAvif(url, explicitType);
					if (avif) hasAvif = true;
					else hasNonAvif = true;
				}
			});

		const img = $(pictureEl).find("img").first();
		if (img.length) {
			const imgSrc =
				img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src");
			const imgSrcset = img.attr("srcset") || img.attr("data-srcset");
			const imgUrls = [
				normalizeToAbsolute(pageUrl, imgSrc),
				...parseSrcsetUrls(imgSrcset, pageUrl),
			].filter(Boolean);
			for (const url of imgUrls) {
				pictureUrls.push(url);
				const avif = isLikelyAvif(url);
				if (avif) hasAvif = true;
				else hasNonAvif = true;
			}
		}

		const uniquePictureUrls = [...new Set(pictureUrls)];
		for (const url of uniquePictureUrls) {
			refs.push({
				url,
				pageUrl,
				sourceType: "picture",
				avifOnlyRisk: hasAvif && !hasNonAvif,
			});
		}
	});

	$("img").each((_, imgEl) => {
		// Skip img tags that are already inside picture since they were handled above.
		if ($(imgEl).closest("picture").length) return;
		const src =
			$(imgEl).attr("src") ||
			$(imgEl).attr("data-src") ||
			$(imgEl).attr("data-lazy-src");
		const srcset = $(imgEl).attr("srcset") || $(imgEl).attr("data-srcset");
		const urls = [
			normalizeToAbsolute(pageUrl, src),
			...parseSrcsetUrls(srcset, pageUrl),
		].filter(Boolean);

		for (const url of urls) {
			refs.push({
				url,
				pageUrl,
				sourceType: "img",
				avifOnlyRisk: isLikelyAvif(url),
			});
		}
	});

	return refs;
}

async function fetchPage(pageUrl) {
	const response = await fetch(pageUrl, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
			"Accept-Language": "en-US,en;q=0.9",
		},
	});

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	return response.text();
}

async function fetchImageMeta(url, acceptHeader) {
	try {
		const response = await fetch(url, {
			method: "GET",
			redirect: "follow",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
				Accept: acceptHeader,
				Range: "bytes=0-2048",
			},
		});

		return {
			ok: response.ok,
			status: response.status,
			contentType: response.headers.get("content-type") || "",
			finalUrl: response.url || url,
		};
	} catch (error) {
		return {
			ok: false,
			status: 0,
			contentType: "",
			finalUrl: url,
			error: error.message,
		};
	}
}

async function main() {
	const pageErrors = [];
	const issues = [];
	const refsByUrl = new Map();

	for (const pageUrl of PAGES_TO_CHECK) {
		console.log(`\n🖼️ Checking images on: ${pageUrl}`);
		try {
			const html = await fetchPage(pageUrl);
			const refs = collectImagesFromPage(pageUrl, html);
			for (const ref of refs) {
				if (!refsByUrl.has(ref.url)) {
					refsByUrl.set(ref.url, {
						url: ref.url,
						pages: new Set(),
						avifOnlyRisk: false,
					});
				}
				const existing = refsByUrl.get(ref.url);
				existing.pages.add(ref.pageUrl);
				existing.avifOnlyRisk = existing.avifOnlyRisk || ref.avifOnlyRisk;
			}
		} catch (error) {
			const msg = `⚠️ Could not fetch page ${pageUrl}: ${error.message}`;
			console.log(msg);
			pageErrors.push(msg);
		}
	}

	for (const entry of refsByUrl.values()) {
		const pageList = [...entry.pages].slice(0, 3).join(", ");
		const modern = await fetchImageMeta(
			entry.url,
			"image/avif,image/webp,image/*,*/*;q=0.8",
		);
		const legacy = await fetchImageMeta(
			entry.url,
			"image/webp,image/apng,image/*,*/*;q=0.8",
		);

		if (!modern.ok) {
			issues.push(
				`❌ Image failed (modern request): ${entry.url} | Status ${modern.status || "ERR"} | Pages: ${pageList}`,
			);
			continue;
		}

		if (!modern.contentType.toLowerCase().startsWith("image/")) {
			issues.push(
				`⚠️ Non-image content type: ${entry.url} | Content-Type: ${modern.contentType || "missing"} | Pages: ${pageList}`,
			);
		}

		if (!legacy.ok) {
			issues.push(
				`⚠️ Legacy-style request failed: ${entry.url} | Status ${legacy.status || "ERR"} | Pages: ${pageList}`,
			);
		}

		if (
			legacy.ok &&
			legacy.contentType.toLowerCase().includes("image/avif") &&
			entry.avifOnlyRisk
		) {
			issues.push(
				`⚠️ AVIF-only risk (no clear fallback in markup): ${entry.url} | Legacy request still receives AVIF | Pages: ${pageList}`,
			);
		}
	}

	const allProblems = [...pageErrors, ...issues];
	if (allProblems.length > 0) {
		await sendEmail("Image Rendering Issues Detected", allProblems.join("\n"));
		console.log(`\nSent report with ${allProblems.length} issue(s).`);
		return;
	}

	console.log("\nNo image issues detected.");
}

if (require.main === module) {
	main();
}
