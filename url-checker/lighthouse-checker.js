const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const nodemailer = require("nodemailer");
require("dotenv").config();

const { HOMEPAGES_TO_CHECK } = require("./pages-to-check");
const execFileAsync = promisify(execFile);

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

const STRATEGY =
	process.env.PAGESPEED_STRATEGY === "desktop" ? "desktop" : "mobile";
const THRESHOLDS = {
	performance: parseThreshold("PAGESPEED_THRESHOLD_PERFORMANCE", 90),
	accessibility: parseThreshold("PAGESPEED_THRESHOLD_ACCESSIBILITY", 90),
	"best-practices": parseThreshold("PAGESPEED_THRESHOLD_BEST_PRACTICES", 90),
	seo: parseThreshold("PAGESPEED_THRESHOLD_SEO", 90),
};

function parseThreshold(envName, fallback) {
	const value = Number.parseInt(process.env[envName] || "", 10);
	if (Number.isNaN(value)) return fallback;
	return Math.max(0, Math.min(100, value));
}

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
		subject,
		text: body,
	});
}

function formatScore(score) {
	if (typeof score !== "number") return "n/a";
	return String(Math.round(score * 100));
}

function resolveLighthouseCommand() {
	const localBin = path.resolve(__dirname, "../node_modules/.bin/lighthouse");
	if (fs.existsSync(localBin)) {
		return {
			command: localBin,
			baseArgs: [],
		};
	}

	return {
		command: "npx",
		baseArgs: ["--yes", "lighthouse"],
	};
}

function normalizeCategoryId(category) {
	return String(category || "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-");
}

function getIgnoredCategories(homepageConfig) {
	return new Set(
		(homepageConfig.ignoreCategories || []).map(normalizeCategoryId),
	);
}

function buildLighthouseArgs(pageUrl, categoriesToCheck) {
	const args = [
		pageUrl,
		"--output=json",
		"--output-path=stdout",
		`--only-categories=${categoriesToCheck.join(",")}`,
		"--quiet",
		"--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage",
	];

	if (STRATEGY === "desktop") {
		args.push("--preset=desktop");
	}

	if (process.env.CHROME_PATH) {
		args.push(`--chrome-path=${process.env.CHROME_PATH}`);
	}

	return args;
}

async function runLighthouse(pageUrl, categoriesToCheck) {
	const { command, baseArgs } = resolveLighthouseCommand();

	try {
		const { stdout, stderr } = await execFileAsync(
			command,
			[...baseArgs, ...buildLighthouseArgs(pageUrl, categoriesToCheck)],
			{
				cwd: path.resolve(__dirname, ".."),
				env: {
					...process.env,
					npm_config_loglevel: "silent",
				},
				maxBuffer: 20 * 1024 * 1024,
			},
		);

		return {
			payload: JSON.parse(stdout),
			stderr: stderr.trim(),
		};
	} catch (error) {
		const details =
			error.stderr?.trim() || error.stdout?.trim() || error.message;
		throw new Error(details);
	}
}

function getCategoryScores(payload) {
	const categories = payload?.categories || payload?.lighthouseResult?.categories || {};
	return {
		performance: categories.performance?.score,
		accessibility: categories.accessibility?.score,
		"best-practices": categories["best-practices"]?.score,
		seo: categories.seo?.score,
	};
}

function getFailedCategoryAudits(payload, categoryId) {
	const categories = payload?.categories || payload?.lighthouseResult?.categories || {};
	const audits = payload?.audits || payload?.lighthouseResult?.audits || {};
	const category = categories[categoryId];
	const auditRefs = category?.auditRefs || [];

	return auditRefs
		.map(({ id, weight }) => {
			const audit = audits[id];
			if (!audit || weight === 0) return null;

			const scoreDisplayMode = audit.scoreDisplayMode || "binary";
			if (
				scoreDisplayMode === "notApplicable" ||
				scoreDisplayMode === "manual" ||
				scoreDisplayMode === "informative"
			) {
				return null;
			}

			if (audit.score === 1) return null;

			const parts = [audit.title || id];
			if (typeof audit.score === "number") {
				parts.push(`score ${Math.round(audit.score * 100)}`);
			}
			if (audit.details?.type === "debugdata" && audit.explanation) {
				parts.push(audit.explanation);
			} else if (audit.explanation) {
				parts.push(audit.explanation);
			}

			return `${id}: ${parts.join(" | ")}`;
		})
		.filter(Boolean);
}

function summarizeScores(scores) {
	return [
		`performance ${formatScore(scores.performance)}`,
		`accessibility ${formatScore(scores.accessibility)}`,
		`best-practices ${formatScore(scores["best-practices"])}`,
		`seo ${formatScore(scores.seo)}`,
	].join(" | ");
}

async function main() {
	const issues = [];
	const summaries = [];
	const allCategories = Object.keys(THRESHOLDS);

	for (const homepageConfig of HOMEPAGES_TO_CHECK) {
		const pageUrl = homepageConfig.url;
		const ignoredCategories = getIgnoredCategories(homepageConfig);
		const categoriesToCheck = allCategories.filter(
			(category) => !ignoredCategories.has(category),
		);
		console.log(`\n📊 Checking Lighthouse on: ${pageUrl}`);

		try {
			const { payload, stderr } = await runLighthouse(pageUrl, categoriesToCheck);
			const scores = getCategoryScores(payload);
			const lighthouseVersion =
				payload?.lighthouseVersion || payload?.lighthouseResult?.lighthouseVersion || "unknown";
			const summaryParts = [
				pageUrl,
				summarizeScores(scores),
				`strategy ${STRATEGY}`,
				`lighthouse ${lighthouseVersion}`,
			];
			if (ignoredCategories.size > 0) {
				summaryParts.push(
					`ignored ${Array.from(ignoredCategories).sort().join(",")}`,
				);
			}
			if (homepageConfig.note) {
				summaryParts.push(`note ${homepageConfig.note}`);
			}
			const summary = summaryParts.join(" | ");
			console.log(`✅ ${summary}`);
			if (stderr) {
				console.log(`ℹ️ Lighthouse warnings: ${stderr}`);
			}
			summaries.push(summary);

			for (const [category, threshold] of Object.entries(THRESHOLDS)) {
				if (ignoredCategories.has(category)) {
					console.log(`ℹ️ Skipping ${category} threshold for ${pageUrl}`);
					continue;
				}

				const score = scores[category];
				if (typeof score !== "number") {
					issues.push(
						`⚠️ Missing ${category} score: ${pageUrl} | Strategy ${STRATEGY}`,
					);
					continue;
				}

				const scoreOutOf100 = Math.round(score * 100);
				if (scoreOutOf100 < threshold) {
					const issueLines = [
						`⚠️ ${category} below threshold: ${pageUrl} | Score ${scoreOutOf100} | Threshold ${threshold} | Strategy ${STRATEGY} | Lighthouse ${lighthouseVersion}`,
					];

					if (category === "best-practices") {
						const failedAudits = getFailedCategoryAudits(payload, category);
						if (failedAudits.length > 0) {
							issueLines.push("Failed best-practices audits:");
							issueLines.push(...failedAudits.map((audit) => `  - ${audit}`));
						}
					}

					issues.push(issueLines.join("\n"));
				}
			}
		} catch (error) {
			const message = `❌ Lighthouse run failed: ${pageUrl} | ${error.message} | Strategy ${STRATEGY}`;
			console.error(message);
			issues.push(message);
		}
	}

	if (issues.length > 0) {
		const body = [
			`Lighthouse issues detected for ${issues.length} check(s).`,
			"",
			...issues,
			"",
			"Score summary:",
			...summaries,
		].join("\n");

		try {
			await sendEmail("Lighthouse Issues Detected", body);
			console.log(`\nSent report with ${issues.length} issue(s).`);
		} catch (error) {
			console.error(`\n⚠️ Failed to send email: ${error.message}`);
		}
		return;
	}

	console.log("\nNo Lighthouse issues detected.");
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`Fatal error: ${error.message}`);
		process.exitCode = 1;
	});
}
