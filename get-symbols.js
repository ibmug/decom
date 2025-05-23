// scripts/download-symbols.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

async function main() {
	// 1) Fetch the symbology list
	const res = await fetch("https://api.scryfall.com/symbology");
	if (!res.ok) throw new Error(`Failed to fetch symbology: ${res.status}`);
	const json = await res.json();
	const symbols = json.data; // <-- pull out the array

	// 2) Ensure output dir exists
	const outDir = path.resolve(process.cwd(), "public/symbols");
	fs.mkdirSync(outDir, { recursive: true });

	// 3) Download each SVG
	for (const symObj of symbols) {
		const code = symObj.symbol
			.replace(/[{}]/g, "")
			.toLowerCase()
			.replace(/\//g, "");
		try {
			const svgRes = await fetch(symObj.svg_uri);
			if (!svgRes.ok) throw new Error(`HTTP ${svgRes.status}`);
			const svgText = await svgRes.text();
			fs.writeFileSync(path.join(outDir, `${code}.svg`), svgText);
			console.log(`✓ Wrote ${code}.svg`);
		} catch (e) {
			console.warn(`⚠️ Skipping ${symObj.symbol}:`, e.message);
		}
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
