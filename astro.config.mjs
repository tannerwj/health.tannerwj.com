import { defineConfig } from "astro/config";

/**
 * Open every external link from Markdown bodies in a new tab. Affiliate and
 * source links in components set this themselves; this covers prose links.
 */
function externalLinksInNewTab() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === "element" && node.tagName === "a") {
        const href = node.properties?.href;
        if (typeof href === "string" && /^https?:\/\//i.test(href)) {
          node.properties.target = "_blank";
          node.properties.rel = "noreferrer noopener";
        }
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);
  };
}

export default defineConfig({
  output: "static",
  site: "https://health.tannerwj.com",
  markdown: {
    rehypePlugins: [externalLinksInNewTab]
  }
});
