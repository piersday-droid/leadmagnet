// Zero-dependency static server for icanstopyousmoking.com.
// Contact details come from Railway environment variables, so nothing in the code needs editing:
//   PHONE        defaults to 07716 008836 (shown on the page and used for tap-to-call)
//   WHATSAPP     e.g. 447700900123   (international format, digits only)
//   BOOKING_URL  e.g. https://calendly.com/piersday/stop-smoking
// Any of them can be left unset; the matching button is simply hidden.

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const contact = {
  PHONE: (process.env.PHONE || "07716 008836").trim(),
  WHATSAPP: (process.env.WHATSAPP || "").replace(/\D/g, ""),
  BOOKING_URL: (process.env.BOOKING_URL || "").trim(),
};
contact.PHONE_TEL = contact.PHONE.replace(/[^\d+]/g, "");

for (const key of ["PHONE", "WHATSAPP", "BOOKING_URL"]) {
  if (!contact[key]) console.warn(`[config] ${key} is not set; its button will be hidden.`);
}

const escapeHtml = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Fill {{TOKENS}} and drop <!--IF:KEY-->...<!--END:KEY--> blocks whose value is empty.
function render(html) {
  let out = html;
  let prev;
  do {
    prev = out;
    out = out.replace(/<!--IF:(PHONE|WHATSAPP|BOOKING_URL)-->([\s\S]*?)<!--END:\1-->/g, (_, key, inner) => (contact[key] ? inner : ""));
  } while (out !== prev);
  out = out.replace(/<!--IF:NONE-->([\s\S]*?)<!--END:NONE-->/g, (_, inner) =>
    contact.PHONE || contact.WHATSAPP || contact.BOOKING_URL ? "" : inner
  );
  return out.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in contact ? escapeHtml(contact[key]) : m));
}

const indexHtml = render(fs.readFileSync(path.join(PUBLIC_DIR, "index.html"), "utf8"));

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function send(res, status, body, type, extra = {}) {
  res.writeHead(status, { "Content-Type": type, ...securityHeaders, ...extra });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method not allowed", "text/plain; charset=utf-8", { Allow: "GET, HEAD" });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return send(res, 400, "Bad request", "text/plain; charset=utf-8");
  }

  if (pathname === "/health") return send(res, 200, "ok", "text/plain; charset=utf-8");

  if (pathname === "/" || pathname === "/index.html") {
    return send(res, 200, req.method === "HEAD" ? "" : indexHtml, MIME[".html"], { "Cache-Control": "public, max-age=300" });
  }

  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, req.method === "HEAD" ? "" : indexHtml, MIME[".html"]);
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Content-Length": stat.size, "Cache-Control": "public, max-age=86400", ...securityHeaders });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => console.log(`icanstopyousmoking.com listening on port ${PORT}`));
