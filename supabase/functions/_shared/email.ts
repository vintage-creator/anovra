export const APP_BASE_URL = Deno.env.get("ANOVRA_APP_URL") || "https://anovra-api.vercel.app";
export const LOGO_URL = "https://res.cloudinary.com/dcoxo8snb/image/upload/v1784749813/IMG_6932_umtukr.png";

export function appLink(path = "") {
  if (!path) return APP_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${APP_BASE_URL}${path.startsWith("/") || path.startsWith("#") ? "" : "/"}${path}`;
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function button(label: string, href: string, tone: "green" | "dark" = "green") {
  const bg = tone === "dark" ? "#1f2a24" : "#008236";
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0 10px"><tr><td style="border-radius:8px;background:${bg};"><a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 18px;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;line-height:1.2;border-radius:8px;">${escapeHtml(label)}</a></td></tr></table>`;
}

export function linkBox(label: string, href: string) {
  return `
    <div style="margin:12px 0 0;padding:12px 14px;border:1px solid #dce7df;border-radius:10px;background:#f7fbf8;">
      <p style="margin:0 0 5px;color:#667085;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:800;">${escapeHtml(label)}</p>
      <a href="${escapeHtml(href)}" style="color:#008236;font-size:13px;line-height:1.45;word-break:break-all;text-decoration:none;font-weight:700;">${escapeHtml(href)}</a>
    </div>
  `;
}

export function fieldBox(label: string, value: string) {
  return `
    <div style="padding:12px 14px;border:1px solid #e4e7ec;border-radius:10px;background:#ffffff;">
      <p style="margin:0 0 5px;color:#667085;font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:800;">${escapeHtml(label)}</p>
      <p style="margin:0;color:#1f2a24;font-size:15px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-weight:800;word-break:break-all;">${escapeHtml(value)}</p>
    </div>
  `;
}

export function credentialsGrid(items: Array<{ label: string; value: string }>) {
  return `
    <div style="margin:18px 0;display:grid;gap:10px;">
      ${items.map((item) => fieldBox(item.label, item.value)).join("")}
    </div>
  `;
}

export function detailsCard(title: string, rows: Array<{ label: string; value: string }>) {
  return `
    <div style="margin:18px 0;padding:14px;border:1px solid #e4e7ec;border-radius:12px;background:#fbfaf7;">
      <p style="margin:0 0 10px;color:#1f2a24;font-size:13px;font-weight:800;">${escapeHtml(title)}</p>
      ${rows.map((row) => `
        <div style="padding:8px 0;border-top:1px solid #edf0eb;">
          <p style="margin:0;color:#667085;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">${escapeHtml(row.label)}</p>
          <p style="margin:3px 0 0;color:#253026;font-size:13px;line-height:1.45;word-break:break-word;">${escapeHtml(row.value)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

export function emailShell(options: {
  title: string;
  eyebrow?: string;
  preview?: string;
  body: string;
  footerNote?: string;
}) {
  const preview = escapeHtml(options.preview || options.title);
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f2eb;color:#253026;font-family:Inter,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f2eb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e7e2d8;border-radius:16px;overflow:hidden;box-shadow:0 16px 42px rgba(31,42,36,.08);">
            <tr>
              <td style="padding:26px 26px 18px;background:#fbfaf7;border-bottom:1px solid #eee7dc;">
                <img src="${LOGO_URL}" alt="Anovra" style="height:54px;max-width:170px;object-fit:contain;display:block;margin:0 0 18px;" />
                ${options.eyebrow ? `<p style="margin:0 0 8px;color:#008236;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;">${escapeHtml(options.eyebrow)}</p>` : ""}
                <h1 style="margin:0;color:#1f2a24;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.18;font-weight:500;">${escapeHtml(options.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;color:#253026;font-size:14px;line-height:1.65;">
                ${options.body}
                <div style="margin-top:26px;padding-top:18px;border-top:1px solid #edf0eb;color:#667085;font-size:12px;line-height:1.55;">
                  <p style="margin:0 0 8px;">${escapeHtml(options.footerNote || "This is an automated Anovra notification.")}</p>
                  <p style="margin:0;">Need help? Contact <a href="mailto:hello@anovra.africa" style="color:#008236;font-weight:700;text-decoration:none;">hello@anovra.africa</a>.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
