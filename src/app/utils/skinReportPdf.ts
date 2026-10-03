import { jsPDF } from "jspdf";

type Finding = { name: string; percentage: number; level: string; confidence: number };
type Treatment = {
  name: string; what_to_do: string; why: string; frequency: string; timeline: string;
  avoid: string[]; see_a_dermatologist_if: string;
  ingredient_targets: { ingredient: string; concentration: string }[];
};
type Product = { name: string; brand: string; price: string; score: number; matchReasons: string[]; vendorSlug: string; id: string };

export function downloadSkinReportPdf(report: {
  area: string;
  scanId: string;
  skinType?: string;
  confidence?: number | null;
  capture?: { confidence?: number; threshold?: number; lighting?: { brightness?: number; glare_pct?: number; verdict?: string }; frames_used?: number; frames_received?: number };
  findings: Finding[];
  treatment: Treatment[];
  ingredients: string[];
  products: Product[];
  productsWithheld: boolean;
  noIssuesDetected: boolean;
  disclaimer: string;
}, logo?: HTMLImageElement | null) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const left = 18;
  const right = 192;
  const width = right - left;
  const bottom = 270;
  let y = 22;

  const nextPage = (needed: number) => {
    if (y + needed <= bottom) return;
    pdf.addPage();
    y = 22;
  };
  const plain = (value: string) => value.replace(/₦/g, "NGN ").replace(/[\u2013\u2014]/g, "-").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');
  const line = (value: string, options: { size?: number; colour?: [number, number, number]; bold?: boolean; gap?: number } = {}) => {
    const size = options.size ?? 10;
    pdf.setFont("helvetica", options.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(...(options.colour ?? [35, 48, 39]));
    const lines = pdf.splitTextToSize(plain(value), width);
    const height = lines.length * (size * 0.43 + 1);
    nextPage(height + 2);
    pdf.text(lines, left, y);
    y += height + (options.gap ?? 2);
  };
  const heading = (value: string) => {
    nextPage(15);
    y += 3;
    pdf.setDrawColor(220, 230, 220);
    pdf.line(left, y - 5, right, y - 5);
    line(value, { size: 14, bold: true, colour: [7, 83, 46], gap: 4 });
  };

  if (logo?.complete && logo.naturalWidth) {
    try {
      pdf.addImage(logo, "PNG", left, 12, 43, 14);
      y = 34;
    } catch {
      line("ANOVRA", { size: 18, bold: true, colour: [7, 83, 46], gap: 6 });
    }
  } else {
    line("ANOVRA", { size: 18, bold: true, colour: [7, 83, 46], gap: 6 });
  }
  line("Personalised skin report", { size: 19, bold: true, colour: [7, 83, 46], gap: 4 });
  line("Prepared by Anovra AI skin analysis", { size: 9, colour: [92, 107, 96], gap: 3 });
  line(`Area: ${report.area}    Date: ${new Date().toLocaleDateString("en-GB")}${report.scanId ? `    Scan ID: ${report.scanId}` : ""}`, { size: 9, colour: [92, 107, 96], gap: 5 });
  if (report.skinType) line(`Skin type: ${report.skinType}`, { bold: true });
  if (report.capture?.confidence != null) {
    const capture = report.capture;
    line(`Capture confidence: ${Math.round(capture.confidence)}%${capture.threshold != null ? ` (required ${Math.round(capture.threshold)}%)` : ""}`);
    const details = [
      capture.lighting?.brightness != null ? `Brightness ${Math.round(capture.lighting.brightness)}` : "",
      capture.lighting?.glare_pct != null ? `Glare ${Math.round(capture.lighting.glare_pct)}%` : "",
      capture.lighting?.verdict ? `Lighting ${capture.lighting.verdict}` : "",
      capture.frames_used != null ? `${capture.frames_used}/${capture.frames_received ?? capture.frames_used} frames used` : "",
    ].filter(Boolean);
    if (details.length) line(details.join("  |  "), { size: 9, colour: [92, 107, 96] });
  }
  if (!report.noIssuesDetected) line(`Finding confidence: ${report.confidence == null ? "not supplied" : `${Math.round(report.confidence)}% (${report.confidence >= 65 ? "high" : "low"})`}`, { size: 9, colour: [92, 107, 96] });

  heading("Visible findings");
  if (!report.findings.length) line(report.noIssuesDetected ? "No notable visible concerns were identified in this photo. This does not rule out a skin condition." : "No visible findings were returned by the analysis.");
  for (const finding of report.findings) {
    line(`${finding.name}: ${Math.round(finding.percentage)}% severity (${finding.level}); finding confidence ${Math.round(finding.confidence)}%`, { size: 10 });
  }
  line("Severity percentages describe visible features, not a medical diagnosis.", { size: 9, colour: [92, 107, 96] });

  heading("Care guidance");
  if (!report.treatment.length) line(report.noIssuesDetected ? "No condition-specific care plan was generated because no notable concerns were identified. Retake the photo if this does not reflect what you see." : "The analysis returned no condition-specific care guidance for this photo.");
  for (const item of report.treatment) {
    nextPage(22);
    line(item.name, { bold: true, gap: 1 });
    line(item.what_to_do);
    if (item.why) line(`Why: ${item.why}`, { size: 9 });
    if (item.frequency) line(`How often: ${item.frequency}`, { size: 9 });
    if (item.timeline) line(`Expected timeframe: ${item.timeline}`, { size: 9 });
    if (item.ingredient_targets?.length) line(`Ingredients to discuss or look for: ${item.ingredient_targets.map((target) => `${target.ingredient}${target.concentration ? ` (${target.concentration})` : ""}`).join(", ")}`, { size: 9 });
    if (item.avoid?.length) line(`Avoid: ${item.avoid.join("; ")}`, { size: 9 });
    if (item.see_a_dermatologist_if) line(`See a dermatologist if: ${item.see_a_dermatologist_if}`, { size: 9, colour: [138, 69, 43] });
    y += 3;
  }

  heading("Product matches");
  if (report.noIssuesDetected) {
    line("No targeted partner products were recommended because no notable concern was identified.");
  } else if (report.productsWithheld) {
    line("Product matches were paused because finding confidence was below 65%, unavailable, or professional review was advised. Consult a registered dermatologist for a closer assessment when confidence is low.");
  } else if (report.products.length) {
    for (const product of report.products) {
      nextPage(18);
      line(`${product.name} - ${product.brand} - ${product.price} - ${Math.round(product.score)}% match`, { bold: true, gap: 1 });
      if (product.matchReasons.length) line(product.matchReasons.join(". "), { size: 9 });
      if (product.vendorSlug) {
        const url = `${window.location.origin}/#/shop/${encodeURIComponent(product.vendorSlug)}?product=${encodeURIComponent(product.id)}`;
        nextPage(9);
        pdf.setFontSize(9);
        pdf.setTextColor(0, 109, 48);
        pdf.textWithLink("View product online", left, y, { url });
        y += 8;
      }
    }
  } else {
    line("No approved catalogue product matched this report.");
    if (report.ingredients.length) line(`Ingredient targets from the analysis: ${report.ingredients.join(", ")}`);
  }

  heading("Disclaimer");
  line(report.disclaimer, { size: 9 });

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(220, 230, 220);
    pdf.line(left, 281, right, 281);
    pdf.setFontSize(8);
    pdf.setTextColor(92, 107, 96);
    pdf.text(`Anovra  |  Private skin report  |  ${page} of ${pages}`, left, 287);
  }
  pdf.save(`anovra-skin-report-${report.scanId || new Date().toISOString().slice(0, 10)}.pdf`);
}
