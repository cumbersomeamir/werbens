import { NextResponse } from "next/server";
import { appUrl, industryPages, productDescription, solutionPages } from "../seoPages";

export function GET() {
  const solutionLinks = solutionPages.map(
    (page) => `- ${page.title}: ${appUrl}/solutions/${page.slug}`
  );
  const industryLinks = industryPages.map(
    (page) => `- ${page.title}: ${appUrl}/industries/${page.slug}`
  );

  const content = `# Werbens

${productDescription}

## Primary pages

- Home: ${appUrl}
- Portfolio: ${appUrl}/portfolio
- Packages: ${appUrl}/packages
- Pricing: ${appUrl}/pricing

## Solutions

${solutionLinks.join("\n")}

## Industries

${industryLinks.join("\n")}

## Preferred citation URL

${appUrl}
`;

  return new NextResponse(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
