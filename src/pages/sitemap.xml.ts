import type { APIRoute } from "astro";
import { SITE_ORIGIN, siteRoutes } from "../data/site";

const toUrl = (path: string) => `${SITE_ORIGIN}${path === "/" ? "/" : path}`;

export const GET: APIRoute = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${siteRoutes.map((path) => `  <url><loc>${toUrl(path)}</loc></url>`).join("\n")}
</urlset>
`,
    {
      headers: {
        "Content-Type": "application/xml"
      }
    }
  );
