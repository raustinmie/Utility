//To run this from the utility folder: node url-checker/url-checker.js

const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { PAGES_TO_CHECK } = require("./pages-to-check");

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

function hasSmtpConfig() {
	return Boolean(
		process.env.SMTP_HOST &&
			process.env.SMTP_PORT &&
			process.env.SMTP_USER &&
			process.env.SMTP_PASS &&
			process.env.EMAIL_TO,
	);
}

async function sendEmail(subject, body) {
	if (!hasSmtpConfig()) {
		throw new Error("SMTP or email recipient configuration is missing");
	}

	await transporter.sendMail({
		from: '"Site Monitor" <austin@harborviewwebdesign.com>',
		to: process.env.EMAIL_TO,
		subject: subject,
		text: body,
	});
}

function isSocialMedia(url) {
	return /facebook\.com|instagram\.com|linkedin\.com|twitter\.com|youtube\.com/.test(
		url,
	);
}

const IGNORED_LINKS = new Set([
	"https://app.gethearth.com/partners/four-seasons-heating-and-cooling/aaron/apply",
]);

function isIgnoredLink(url) {
	return IGNORED_LINKS.has(url.trim());
}

function normalizeLink(url, parentPage) {
	try {
		const normalized = new URL(url, parentPage);
		normalized.hash = "";
		return normalized.href;
	} catch {
		return null;
	}
}

function formatParentPages(parentPages) {
	return [...parentPages].join(", ");
}

async function checkLink(url, parentPages) {
	const parentPageList = formatParentPages(parentPages);

	try {
		if (isIgnoredLink(url)) {
			const linkLogMessage = `⚠️ Ignored link on ${parentPageList}: ${url}`;
			console.log(linkLogMessage);
			return { linkSuccess: true, linkLogMessage };
		}

		const response = await fetch(url, {
			method: "GET",
			redirect: "follow",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
				"Accept-Language": "en-US,en;q=0.9",
			},
		});
		var linkLogMessage;
		if (!response.ok) {
			if (
				isSocialMedia(url) &&
				(response.status === 400 ||
					response.status === 403 ||
					response.status === 415 ||
					response.status === 429)
			) {
				const linkLogMessage = `⚠️ Social media link potentially restricted on ${parentPageList}: ${url} (Status ${response.status})`;
				console.log(linkLogMessage);
				return { linkSuccess: true, linkLogMessage };
			}
			if (
				response.status === 403 ||
				response.status === 415 ||
				response.status === 429
			) {
				const linkLogMessage = `⚠️ Link may be blocking automated requests on ${parentPageList}: ${url} (Status ${response.status})`;
				console.log(linkLogMessage);
				return { linkSuccess: true, linkLogMessage };
			}
			linkLogMessage = `❌ Broken link on ${parentPageList}: ${url} (Status ${response.status})`;
			console.log(linkLogMessage);
			return { linkSuccess: false, linkLogMessage };
		} else {
			linkLogMessage = `✅ OK link on ${parentPageList}: ${url}`;
			console.log(linkLogMessage);
			return { linkSuccess: true, linkLogMessage };
		}
	} catch (error) {
		linkLogMessage = `⚠️ Error on ${parentPageList}: ${url} (${error.message})`;
		console.log(linkLogMessage);
		return { linkSuccess: false, linkLogMessage };
	}
}

async function getLinksFromPage(pageUrl) {
	try {
		const response = await fetch(pageUrl);
		const html = await response.text();
		const $ = cheerio.load(html);
		const links = [];

		$("a").each((_, element) => {
			let href = $(element).attr("href");
			if (href && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
				const normalizedHref = normalizeLink(href, pageUrl);
				if (normalizedHref) {
					links.push(normalizedHref);
				}
			}
		});
		var logMessage = "Success!";
		return { success: true, links, logMessage };
	} catch (error) {
		var logMessage = `⚠️ Could not fetch page ${pageUrl}: ${error.message}`;
		console.log(logMessage);
		return { success: false, links: [], logMessage };
	}
}

async function main() {
	var brokenLinks = [];
	const linksByUrl = new Map();

	for (const page of PAGES_TO_CHECK) {
		console.log(`\n🔍 Checking links on: ${page}`);
		const { success, links, logMessage } = await getLinksFromPage(page);
		if (!success) brokenLinks.push(`Page ${page} | Error: ${logMessage}`);
		if (!links) continue;
		for (const link of links) {
			if (!linksByUrl.has(link)) {
				linksByUrl.set(link, new Set());
			}
			linksByUrl.get(link).add(page);
		}
	}

	for (const [link, parentPages] of linksByUrl) {
		var { linkSuccess, linkLogMessage } = await checkLink(link, parentPages);
		if (!linkSuccess) {
			brokenLinks.push(`Link ${link} | Error: ${linkLogMessage}`);
		}
	}
	if (brokenLinks.length > 0) {
		try {
			await sendEmail("Broken Links Detected", brokenLinks.join("\n"));
		} catch (error) {
			console.error(`⚠️ Failed to send email: ${error.message}`);
		}
	}
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`Fatal error: ${error.message}`);
		process.exitCode = 1;
	});
}
