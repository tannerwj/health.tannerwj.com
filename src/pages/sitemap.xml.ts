import { calculatorRoute, editorialSections, siteUrl } from "../lib/site";

export const prerender = true;

export function GET() {
  const routes = ["/", ...editorialSections.map((section) => section.href), calculatorRoute.href];
  const urls = routes
    .map((route) => `<url><loc>${new URL(route, siteUrl).toString()}</loc></url>`)
    .join("");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
