const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
require("dotenv").config();

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
		subject: subject,
		text: body,
	});
}

const PAGES_TO_CHECK = [
	//HARBORVIEW WEB DESIGN
	"https://www.harborviewwebdesign.com/",
	"https://www.harborviewwebdesign.com/services",
	"https://www.harborviewwebdesign.com/about",
	"https://www.harborviewwebdesign.com/contact",
	"https://www.harborviewwebdesign.com/blog",
	"https://www.harborviewwebdesign.com/faq",
	//SPRUCE IT UP LANDSCAPING
	"https://www.spruceituplandscaping.org/",
	"https://www.spruceituplandscaping.org/services",
	"https://www.spruceituplandscaping.org/about",
	"https://www.spruceituplandscaping.org/gallery",
	"https://www.spruceituplandscaping.org/contact",
	//PACIFIC NORTHWEST GUIDED TOURS
	"https://www.pacificnorthwestguidedtours.com/",
	"https://www.pacificnorthwestguidedtours.com/about",
	"https://www.pacificnorthwestguidedtours.com/tours",
	"https://www.pacificnorthwestguidedtours.com/contact",
	// PILGRIM'S QUILL
	"https://www.pilgrimsquill.com/",
	"https://www.pilgrimsquill.com/contact",
	"https://www.pilgrimsquill.com/gallery",
	"https://www.pilgrimsquill.com/services",
	"https://www.pilgrimsquill.com/about",
	//ABSOLUTE SOS
	"https://www.absolutesos.com/",
	"https://www.absolutesos.com/services",
	"https://www.absolutesos.com/about",
	"https://www.absolutesos.com/contact",
	//DEEZ EVENTS
	"https://www.deezevents.com/",
	"https://www.deezevents.com/about",
	"https://www.deezevents.com/services",
	"https://www.deezevents.com/contact",
	"https://www.deezevents.com/services/karaoke",
	"https://www.deezevents.com/services/dj-party",
	"https://www.deezevents.com/services/photo-booth",
	"https://www.deezevents.com/services/rentals",
	"https://www.deezevents.com/services/music-bingo",
	"https://www.deezevents.com/gallery",
];

function isSocialMedia(url) {
	return /facebook\.com|instagram\.com|linkedin\.com|twitter\.com|youtube\.com/.test(
		url
	);
}

async function checkLink(url, parentPage) {
	try {
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
				(isSocialMedia(url) && response.status === 400) ||
				response.status === 403 ||
				response.status === 429
			) {
				const linkLogMessage = `⚠️ Social media link potentially restricted on ${parentPage}: ${url} (Status ${response.status})`;
				console.log(linkLogMessage);
				return { linkSuccess: true, linkLogMessage };
			}
			linkLogMessage = `❌ Broken link on ${parentPage}: ${url} (Status ${response.status}`;
			console.log(linkLogMessage);
			return { linkSuccess: false, linkLogMessage };
		} else {
			linkLogMessage = `✅ OK link on ${parentPage}: ${url}`;
			console.log(linkLogMessage);
			return { linkSuccess: true, linkLogMessage };
		}
	} catch (error) {
		linkLogMessage = `⚠️ Error on ${parentPage}: ${url} (${error.message})`;
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
				if (href.startsWith("/")) {
					href = new URL(href, pageUrl).href; // Make relative links absolute
				}
				links.push(href);
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
	for (const page of PAGES_TO_CHECK) {
		console.log(`\n🔍 Checking links on: ${page}`);
		const { success, links, logMessage } = await getLinksFromPage(page);
		if (!success) brokenLinks.push(`Page ${page} | Error: ${logMessage}`);
		if (!links) continue;
		for (const link of links) {
			var { linkSuccess, linkLogMessage } = await checkLink(link, page);
			if (!linkSuccess)
				brokenLinks.push(`Link ${link} | Error: ${linkLogMessage}`);
		}
	}
	if (brokenLinks.length > 0) {
		await sendEmail("Broken Links Detected", brokenLinks.join("\n"));
	}
}

main();
