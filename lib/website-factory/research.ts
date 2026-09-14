import type {
  BusinessResearch,
  WebsiteFactoryInput,
  WebsiteFactoryResearchProvider,
} from "./types";

function clean(value: string | null | undefined): string | null {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  return text || null;
}

function hostToBusinessName(websiteUrl: string): string {
  try {
    const hostname = new URL(websiteUrl).hostname.replace(/^www\./, "");
    return hostname
      .split(".")[0]
      ?.split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Mint Chip Business";
  } catch {
    return "Mint Chip Business";
  }
}

function extractLinks(html: string): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    links.push({
      href: match[1] ?? "",
      text: (match[2] ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    });
  }

  return links;
}

function parseHtmlToResearch(
  html: string,
  websiteUrl: string,
  pageUrls: string[],
): BusinessResearch {
  const links = extractLinks(html);
  const title =
    /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? null;
  const metaDescription =
    /<meta\b[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(
      html,
    )?.[1] ?? null;

  const email = links
    .filter((link) => link.href.toLowerCase().startsWith("mailto:"))
    .map((link) => link.href.replace(/^mailto:/i, "").split("?")[0]?.trim())
    .find((value) => value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));

  const phone =
    links
      .filter((link) => link.href.toLowerCase().startsWith("tel:"))
      .map((link) => link.href.replace(/^tel:/i, "").trim())
      .find(Boolean) ?? null;

  const contactHref = links.find((link) => {
    const href = link.href.toLowerCase();
    return href.includes("contact") || link.text.toLowerCase().includes("contact");
  })?.href;

  const socialHosts = [
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "x.com",
    "twitter.com",
    "youtube.com",
    "tiktok.com",
  ];
  const socialUrls = links
    .map((link) => link.href)
    .filter((href) => {
      try {
        const host = new URL(href, websiteUrl).hostname.toLowerCase();
        return socialHosts.some(
          (social) => host === social || host.endsWith(`.${social}`),
        );
      } catch {
        return false;
      }
    });

  const headingText =
    /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? null;
  const headline = clean(headingText);

  const trustWords = [
    "licensed",
    "certified",
    "insured",
    "years",
    "guarantee",
    "warranty",
    "trusted",
    "award",
  ];
  const text = html.replace(/<[^>]*>/g, " ");
  const trustBadges = trustWords
    .filter((word) => new RegExp(`\\b${word}\\b`, "i").test(text))
    .map((word) => `Public trust signal: ${word}`);

  const technicalQuality: string[] = [];
  if (!/<meta\b[^>]+name=["']viewport["']/i.test(html)) {
    technicalQuality.push("No viewport meta tag detected.");
  }
  if (!/^https:\/\//i.test(websiteUrl)) {
    technicalQuality.push("Website URL is not HTTPS.");
  }

  const services = links
    .filter((link) =>
      /services|service|pricing|quote|booking|appointment/i.test(
        `${link.href} ${link.text}`,
      ),
    )
    .map((link) => link.text || link.href)
    .filter(Boolean)
    .slice(0, 8);

  return {
    businessName: hostToBusinessName(websiteUrl),
    domain: (() => {
      try {
        return new URL(websiteUrl).hostname.replace(/^www\./, "");
      } catch {
        return null;
      }
    })(),
    websiteUrl,
    location: null,
    city: null,
    state: null,
    description: clean(metaDescription) ?? clean(title),
    services: [...new Set(services)],
    products: [],
    serviceAreas: [],
    phone,
    publicEmail: email ?? null,
    contactUrl: contactHref
      ? new URL(contactHref, websiteUrl).toString()
      : null,
    socialUrls: [...new Set(socialUrls)],
    testimonialsPresent: [],
    reviewsPresent: [],
    licensesCertifications: [],
    yearsInBusiness: null,
    guarantees: [],
    trustBadges: [...new Set(trustBadges)],
    portfolioPresent: [],
    currentPages: pageUrls,
    ctaPatterns: links
      .filter((link) => /call|quote|book|contact|get started/i.test(link.text))
      .map((link) => link.text)
      .filter(Boolean)
      .slice(0, 6),
    navigation: links
      .map((link) => link.text)
      .filter(Boolean)
      .slice(0, 20),
    formsPresent: /<form\b/i.test(html),
    images: (html.match(/<img\b[^>]*src=["']([^"']+)/gi) ?? []).slice(0, 10),
    metadata: {
      title: title ?? null,
      metaDescription: metaDescription ?? null,
    },
    technicalQuality,
    headline,
    valueProposition: clean(
      /<p\b[^>]*>([\s\S]*?)<\/p>/i.exec(html)?.[1] ?? null,
    ),
    notableCopy: [],
    provenance: [
      {
        url: websiteUrl,
        note: "Homepage HTML inspected with a bounded crawl.",
      },
    ],
    confidence: pageUrls.length > 0 ? 0.7 : 0.45,
  };
}

export class FixtureResearchProvider implements WebsiteFactoryResearchProvider {
  async research(input: WebsiteFactoryInput): Promise<BusinessResearch> {
    const websiteUrl = new URL(input.websiteUrl).toString();
    const businessName =
      input.businessName?.trim() || hostToBusinessName(websiteUrl);

    return {
      businessName,
      domain: new URL(websiteUrl).hostname.replace(/^www\./, ""),
      websiteUrl,
      location: "Cape Coral, FL",
      city: "Cape Coral",
      state: "FL",
      description: "Fixture business research for Website Factory verification.",
      services: ["Core service", "Secondary service"],
      products: [],
      serviceAreas: ["Cape Coral", "Fort Myers"],
      phone: "239-555-0142",
      publicEmail: "hello@example.com",
      contactUrl: `${websiteUrl.replace(/\/$/, "")}/contact`,
      socialUrls: [],
      testimonialsPresent: [],
      reviewsPresent: [],
      licensesCertifications: [],
      yearsInBusiness: null,
      guarantees: [],
      trustBadges: ["Fixture trust signal: locally operated"],
      portfolioPresent: [],
      currentPages: ["/", "/about", "/services", "/contact"],
      ctaPatterns: ["Get a quote", "Contact us"],
      navigation: ["Home", "Services", "About", "Contact"],
      formsPresent: true,
      images: [],
      metadata: { fixture: true },
      technicalQuality: [],
      headline: `${businessName} — Quality Local Service`,
      valueProposition: "Professional local service with clear next steps.",
      notableCopy: [],
      provenance: [
        {
          url: websiteUrl,
          note: "Deterministic fixture research provider.",
        },
      ],
      confidence: 0.8,
    };
  }
}

export class HttpResearchProvider implements WebsiteFactoryResearchProvider {
  async research(input: WebsiteFactoryInput): Promise<BusinessResearch> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(input.websiteUrl, {
        signal: controller.signal,
        headers: { Accept: "text/html" },
      });

      if (!response.ok) {
        throw new Error(`Website research request failed (${response.status}).`);
      }

      const html = await response.text();
      return parseHtmlToResearch(html, input.websiteUrl, [
        input.websiteUrl,
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
}

export function getDefaultResearchProvider(): WebsiteFactoryResearchProvider {
  return new FixtureResearchProvider();
}

