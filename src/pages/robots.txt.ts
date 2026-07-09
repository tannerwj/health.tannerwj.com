import type { APIRoute } from "astro";
import { SITE_ORIGIN } from "../data/site";

export const GET: APIRoute = () =>
  new Response(`User-agent: *
Allow: /
Sitemap: ${SITE_ORIGIN}/sitemap.xml
`);
