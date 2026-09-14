import { DEFAULT_CRAWL_LIMITS } from "./constants";
import type {
  FetchLike,
  WebsiteInspectionOptions,
  WebsiteInspectionResult,
} from "./types";

type ParsedLink = {
  href: string;
  text: string;
};

type FetchedPage = {
  url: string;
  status: number | null;
  html: string;
  lastModifiedAt: string | null;
  reachable: boolean;
};

function toWebsiteUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
    ? raw
    : `https://${raw}`;

  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function hostnameFromUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function parseAnchors(html: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) !== null) {
    links.push({
      href: match[1] ?? "",
      text: stripTags(match[2] ?? "").trim(),
    });
  }

  return links;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function resolveUrl(href: string, baseUrl: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) {
    return null;
  }

  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("#")
  ) {
    return null;
  }

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

function isInternalUrl(url: string, domain: string): boolean {
  return hostnameFromUrl(url) === domain;
}

function extractInternalLinks(
  html: string,
  pageUrl: string,
  domain: string,
): string[] {
  const links = parseAnchors(html);
  const internal = new Set<string>();

  for (const link of links) {
    const resolved = resolveUrl(link.href, pageUrl);
    if (resolved && isInternalUrl(resolved, domain)) {
      internal.add(resolved);
    }
  }

  return [...internal];
}

function extractTitle(html: string): string | null {
  const match = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? stripTags(match[1] ?? "") : null;
}

function extractPhoneLinks(links: ParsedLink[]): string[] {
  return links
    .filter((link) => link.href.toLowerCase().startsWith("tel:"))
    .map((link) => link.href.replace(/^tel:/i, "").trim())
    .filter(Boolean);
}

function extractEmailLinks(links: ParsedLink[]): string[] {
  const emails: string[] = [];

  for (const link of links) {
    if (!link.href.toLowerCase().startsWith("mailto:")) {
      continue;
    }

    const email = link.href
      .replace(/^mailto:/i, "")
      .split("?")[0]
      .trim()
      .toLowerCase();

    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emails.push(email);
    }
  }

  return [...new Set(emails)];
}

function extractContactLinks(
  links: ParsedLink[],
  pageUrl: string,
): { urls: string[]; contactPageUrl: string | null } {
  const urls: string[] = [];
  let contactPageUrl: string | null = null;

  for (const link of links) {
    const resolved = resolveUrl(link.href, pageUrl);
    if (!resolved) {
      continue;
    }

    const lowerHref = link.href.toLowerCase();
    const lowerText = link.text.toLowerCase();
    const isContact =
      lowerHref.includes("contact") ||
      lowerText.includes("contact") ||
      lowerText.includes("get in touch") ||
      lowerText.includes("reach us");

    if (isContact) {
      urls.push(resolved);
      contactPageUrl = contactPageUrl ?? resolved;
    }
  }

  return { urls: [...new Set(urls)], contactPageUrl };
}

function extractSocialLinks(links: ParsedLink[]): string[] {
  const socialHosts = [
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "x.com",
    "twitter.com",
    "youtube.com",
    "youtu.be",
    "tiktok.com",
  ];

  const social = new Set<string>();

  for (const link of links) {
    const hostname = hostnameFromUrl(link.href);
    if (
      hostname &&
      socialHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))
    ) {
      social.add(link.href);
    }
  }

  return [...social];
}

function extractSignals(
  html: string,
  pageUrl: string,
  domain: string,
): WebsiteInspectionResult {
  const links = parseAnchors(html);
  const phoneLinks = extractPhoneLinks(links);
  const emailLinks = extractEmailLinks(links);
  const contactLinks = extractContactLinks(links, pageUrl);
  const socialLinks = extractSocialLinks(links);
  const internalLinks = extractInternalLinks(html, pageUrl, domain);

  const viewportPresent =
    /<meta\b[^>]+name=["']viewport["'][^>]*>/i.test(html);
  const metaDescriptionPresent =
    /<meta\b[^>]+name=["']description["'][^>]*>/i.test(html);

  return {
    websitePresent: true,
    websiteReachable: true,
    httpStatus: 200,
    httpsPresent: pageUrl.toLowerCase().startsWith("https://"),
    title: extractTitle(html),
    metaDescriptionPresent,
    viewportPresent,
    mobileResponsive: viewportPresent,
    navigationLinkCount: internalLinks.length,
    phoneLinks,
    emailLinks,
    contactLinks: contactLinks.urls,
    contactPageUrl: contactLinks.contactPageUrl,
    formPresent: /<form\b/i.test(html),
    portfolioPresent:
      /(portfolio|gallery|our work|projects)/i.test(html) &&
      (html.match(/<img\b/gi) ?? []).length >= 2,
    testimonialsPresent:
      /(testimonial|reviews|what our customers say)/i.test(html),
    imageCount: (html.match(/<img\b/gi) ?? []).length,
    socialLinks,
    pageCountEstimate: 1,
    brokenLinks: [],
    lastModifiedAt: null,
    visualAuditStatus: "BASIC",
    auditNotes: [],
    auditTimestamp: new Date().toISOString(),
  };
}

async function readTextLimited(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (contentLength > maxBytes) {
    return "";
  }

  if (!response.body) {
    const text = await response.text();
    return text.slice(0, maxBytes);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    text += decoder.decode(value, { stream: true });

    if (totalBytes >= maxBytes) {
      await reader.cancel();
      break;
    }
  }

  return text.slice(0, maxBytes);
}

async function fetchPage(
  url: string,
  fetchImpl: FetchLike,
  timeoutMs: number,
  maxBytes: number,
): Promise<FetchedPage> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { Accept: "text/html,application/xhtml+xml" },
    });

    const html = await readTextLimited(response, maxBytes);
    return {
      url: response.url || url,
      status: response.status,
      html,
      lastModifiedAt: response.headers.get("last-modified"),
      reachable: response.status >= 200 && response.status < 400,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function notInspected(reason: string): WebsiteInspectionResult {
  return {
    websitePresent: false,
    websiteReachable: false,
    httpStatus: null,
    httpsPresent: false,
    title: null,
    metaDescriptionPresent: false,
    viewportPresent: false,
    mobileResponsive: null,
    navigationLinkCount: 0,
    phoneLinks: [],
    emailLinks: [],
    contactLinks: [],
    contactPageUrl: null,
    formPresent: false,
    portfolioPresent: false,
    testimonialsPresent: false,
    imageCount: 0,
    socialLinks: [],
    pageCountEstimate: 0,
    brokenLinks: [],
    lastModifiedAt: null,
    visualAuditStatus: "NOT_INSPECTED",
    auditNotes: [reason],
    auditTimestamp: new Date().toISOString(),
  };
}

export async function inspectWebsite(
  input: string,
  options: WebsiteInspectionOptions = {},
): Promise<WebsiteInspectionResult> {
  const maxPages = options.maxPages ?? DEFAULT_CRAWL_LIMITS.maxPages;
  const maxRequests = options.maxRequests ?? DEFAULT_CRAWL_LIMITS.maxRequests;
  const timeoutMs = options.timeoutMs ?? DEFAULT_CRAWL_LIMITS.timeoutMs;
  const maxBytes = options.maxBytes ?? DEFAULT_CRAWL_LIMITS.maxBytes;
  const fetchImpl = options.fetchImpl ?? fetch;

  const homepageUrl = toWebsiteUrl(input);
  const domain = hostnameFromUrl(homepageUrl);

  if (!homepageUrl || !domain) {
    return notInspected("No valid website domain was provided.");
  }

  const queue = [homepageUrl];
  const visited = new Set<string>();
  const brokenLinks = new Set<string>();
  const auditNotes: string[] = [];
  let requestCount = 0;
  let homepage: WebsiteInspectionResult | null = null;
  let homepageStatus: number | null = null;
  let homepageReachable = false;
  let homepageHttps = false;
  let lastModifiedAt: string | null = null;

  while (queue.length > 0 && visited.size < maxPages && requestCount < maxRequests) {
    const currentUrl = queue.shift();
    if (!currentUrl || visited.has(currentUrl)) {
      continue;
    }

    visited.add(currentUrl);
    requestCount += 1;

    let page: FetchedPage;
    try {
      page = await fetchPage(currentUrl, fetchImpl, timeoutMs, maxBytes);
    } catch {
      if (!homepage) {
        homepageStatus = null;
        homepageReachable = false;
      } else {
        brokenLinks.add(currentUrl);
      }
      continue;
    }

    const isHomepage = currentUrl === homepageUrl || !homepage;
    if (isHomepage && !homepage) {
      homepageStatus = page.status;
      homepageReachable = page.reachable;
      homepageHttps = page.url.toLowerCase().startsWith("https://");
      lastModifiedAt = page.lastModifiedAt;

      if (!page.reachable) {
        homepage = {
          ...notInspected("The website was unreachable."),
          websitePresent: true,
          websiteReachable: false,
          httpStatus: page.status,
          httpsPresent: homepageHttps,
          visualAuditStatus: "FAILED",
          auditTimestamp: new Date().toISOString(),
        };
        continue;
      }

      homepage = extractSignals(page.html, page.url, domain);
    } else if (!page.reachable) {
      brokenLinks.add(currentUrl);
      continue;
    }

    const internalLinks = extractInternalLinks(page.html, page.url, domain);
    for (const link of internalLinks) {
      if (!visited.has(link) && !queue.includes(link)) {
        queue.push(link);
      }
    }
  }

  if (requestCount >= maxRequests && queue.length > 0) {
    auditNotes.push(`Bounded crawl stopped after ${requestCount} requests.`);
  }
  if (visited.size >= maxPages && queue.length > 0) {
    auditNotes.push(`Bounded crawl stopped after ${visited.size} pages.`);
  }

  if (!homepage) {
    return {
      ...notInspected("The website was unreachable."),
      websitePresent: true,
      websiteReachable: false,
      httpStatus: homepageStatus,
      httpsPresent: homepageHttps,
      visualAuditStatus: "FAILED",
      auditTimestamp: new Date().toISOString(),
    };
  }

  return {
    ...homepage,
    httpStatus: homepageStatus,
    websiteReachable: homepageReachable,
    httpsPresent: homepageHttps,
    lastModifiedAt,
    pageCountEstimate: visited.size,
    brokenLinks: [...brokenLinks],
    auditNotes: [...homepage.auditNotes, ...auditNotes],
  };
}
