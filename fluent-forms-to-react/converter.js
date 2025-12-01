// ff-json-to-html.js
// Usage: node ff-json-to-html.js input.json output.html
const fs = require("fs");
const path = require("path");

const input = process.argv[2];
const output = process.argv[3] || "form.html";
if (!input) {
	console.error("Usage: node ff-json-to-html.js input.json [output.html]");
	process.exit(1);
}

const raw = fs.readFileSync(input, "utf8");
const data = JSON.parse(raw);

// Helpers to render fields
function escapeHtml(s) {
	return String(s || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
function idify(name, idx) {
	return "ff_" + (name || "field") + "_" + idx;
}

let fields = data.fields || data.form_fields || data.elements || [];
// Fluent Forms exports can vary — try a few fallbacks
if (!Array.isArray(fields)) {
	// try to find nested structure
	for (const k of Object.keys(data)) {
		if (Array.isArray(data[k])) {
			fields = data[k];
			break;
		}
	}
}

function renderField(f, idx) {
	const type = (f.type || f.element || f.input_type || "")
		.toString()
		.toLowerCase();
	const label = f.label || f.title || f.name || "";
	const required = f.required || f.is_required || false;
	const name = f.name || "field_" + idx;
	const id = idify(name.replace(/\s+/g, "").toLowerCase(), idx);
	const placeholder = f.placeholder || f.placeholder_text || "";
	const options = f.options || f.choices || f.choice || [];

	if (/text|singleline|input_text/.test(type) || type === "text") {
		return `<label for="${id}">${escapeHtml(label)}${
			required ? " *" : ""
		}</label>
<input id="${id}" name="${escapeHtml(name)}" type="text" ${
			required ? "required" : ""
		} placeholder="${escapeHtml(placeholder)}">`;
	}

	if (/email/.test(type)) {
		return `<label for="${id}">${escapeHtml(label)}${
			required ? " *" : ""
		}</label>
<input id="${id}" name="${escapeHtml(name)}" type="email" ${
			required ? "required" : ""
		} placeholder="${escapeHtml(placeholder)}">`;
	}

	if (/textarea|paragraph/.test(type)) {
		return `<label for="${id}">${escapeHtml(label)}${
			required ? " *" : ""
		}</label>
<textarea id="${id}" name="${escapeHtml(name)}" rows="4" ${
			required ? "required" : ""
		} placeholder="${escapeHtml(placeholder)}"></textarea>`;
	}

	if (/select|dropdown/.test(type)) {
		const opts = (options.length ? options : f.options_list || [])
			.map((o) => {
				const val = typeof o === "object" ? o.value || o.label || o.text : o;
				const text = typeof o === "object" ? o.label || o.text || o.value : o;
				return `<option value="${escapeHtml(val)}">${escapeHtml(
					text
				)}</option>`;
			})
			.join("\n");
		return `<label for="${id}">${escapeHtml(label)}${
			required ? " *" : ""
		}</label>
<select id="${id}" name="${escapeHtml(name)}" ${required ? "required" : ""}>
  ${opts}
</select>`;
	}

	if (/checkbox/.test(type) && options.length) {
		const items = options
			.map((o, i) => {
				const val = typeof o === "object" ? o.value || o.label || o.text : o;
				const text = typeof o === "object" ? o.label || o.text || o.value : o;
				const cid = id + "_cb_" + i;
				return `<div class="ff-checkbox"><input id="${cid}" type="checkbox" name="${escapeHtml(
					name
				)}[]" value="${escapeHtml(val)}"><label for="${cid}">${escapeHtml(
					text
				)}</label></div>`;
			})
			.join("\n");
		return `<fieldset><legend>${escapeHtml(label)}${
			required ? " *" : ""
		}</legend>${items}</fieldset>`;
	}

	if (/radio/.test(type) && options.length) {
		const items = options
			.map((o, i) => {
				const val = typeof o === "object" ? o.value || o.label || o.text : o;
				const text = typeof o === "object" ? o.label || o.text || o.value : o;
				const rid = id + "_r_" + i;
				return `<div class="ff-radio"><input id="${rid}" type="radio" name="${escapeHtml(
					name
				)}" value="${escapeHtml(val)}" ${
					i === 0 && required ? "required" : ""
				}><label for="${rid}">${escapeHtml(text)}</label></div>`;
			})
			.join("\n");
		return `<fieldset><legend>${escapeHtml(label)}${
			required ? " *" : ""
		}</legend>${items}</fieldset>`;
	}

	if (/date/.test(type)) {
		return `<label for="${id}">${escapeHtml(label)}${
			required ? " *" : ""
		}</label>
<input id="${id}" name="${escapeHtml(name)}" type="date" ${
			required ? "required" : ""
		}>`;
	}

	if (/number|phone|tel/.test(type)) {
		return `<label for="${id}">${escapeHtml(label)}${
			required ? " *" : ""
		}</label>
<input id="${id}" name="${escapeHtml(name)}" type="tel" ${
			required ? "required" : ""
		} placeholder="${escapeHtml(placeholder)}">`;
	}

	if (/file|upload/.test(type)) {
		return `<label for="${id}">${escapeHtml(label)}${
			required ? " *" : ""
		}</label>
<input id="${id}" name="${escapeHtml(name)}" type="file" ${
			required ? "required" : ""
		}>`;
	}

	// fallback: render as text input with note about unknown type
	return `<label for="${id}">${escapeHtml(label)}${required ? " *" : ""}</label>
<input id="${id}" name="${escapeHtml(name)}" type="text" ${
		required ? "required" : ""
	} placeholder="${escapeHtml(placeholder)}">
<small>Field type: ${escapeHtml(type || "unknown")}</small>`;
}

const rendered = fields
	.map((f, i) => `<div class="ff-field">${renderField(f, i)}</div>`)
	.join("\n\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(data.form_name || data.title || "Converted Form")}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:system-ui,Arial,Helvetica,sans-serif;padding:20px}
  form{max-width:900px;margin:0 auto}
  .ff-field{margin-bottom:1rem}
  label{display:block;font-weight:600;margin-bottom:.25rem}
  input[type="text"], input[type="email"], input[type="date"], input[type="tel"], select, textarea{width:100%;padding:.5rem;border:1px solid #ddd;border-radius:6px}
  fieldset{border:1px solid #eee;padding:10px;border-radius:6px}
  .ff-checkbox, .ff-radio{margin-bottom:6px}
  button{padding:.6rem 1rem;border-radius:8px;border:0;background:#0b5fff;color:white;font-weight:600}
</style>
</head>
<body>
<h1>${escapeHtml(data.form_name || data.title || "Converted Form")}</h1>
<form id="convertedForm" method="post" action="/api/submit" enctype="multipart/form-data">
${rendered}

<div style="margin-top:1rem">
  <button type="submit">Submit</button>
</div>
</form>

<script>
document.getElementById('convertedForm').addEventListener('submit', async function(ev){
  // default behaviour: let developer wire up /api/submit
  // Example: convert form to JSON and post to /api/submit
  ev.preventDefault();
  const f = ev.target;
  const fd = new FormData(f);
  // Basic submit to JSON endpoint (change to your Next.js API route)
  try {
    const res = await fetch(f.action, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Network response was not ok');
    alert('Form submitted successfully');
    f.reset();
  } catch (err) {
    alert('Submission failed: ' + err.message);
  }
});
</script>
</body>
</html>
`;

fs.writeFileSync(output, html, "utf8");
console.log("Wrote", output);
