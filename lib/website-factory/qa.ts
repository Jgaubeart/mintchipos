import type {
  FunctionalQaReport,
  VisualQaReport,
} from "./types";

export function runFunctionalQa(
  html: string,
): FunctionalQaReport {
  const checks = [
    {
      name: "page-loads",
      passed: html.length > 100,
      detail: "Generated HTML contains a usable page body.",
    },
    {
      name: "viewport",
      passed: /name="viewport"/i.test(html),
      detail: "Mobile viewport is present.",
    },
    {
      name: "title",
      passed: /<title>/.test(html),
      detail: "Page title is present.",
    },
    {
      name: "contact-cta",
      passed: /id="contact"/.test(html) && /class="cta"/.test(html),
      detail: "Contact section and call to action are present.",
    },
    {
      name: "missing-placeholder",
      passed: !/undefined|null|\[object Object\]/i.test(html),
      detail: "No obvious unresolved placeholders were emitted.",
    },
  ];

  const defects = checks
    .filter((check) => !check.passed)
    .map((check) => check.detail);

  return { passed: defects.length === 0, checks, defects };
}

export function runVisualQa(
  html: string,
): VisualQaReport {
  const checks = [
    {
      name: "hero-present",
      passed: /<h1>/.test(html),
      detail: "A clear hero headline is present.",
    },
    {
      name: "section-count",
      passed: (html.match(/<section/g) ?? []).length >= 3,
      detail: "The page contains a reasonable section rhythm.",
    },
    {
      name: "not-template-only",
      passed: !/SaaS dashboard|endless card grid/i.test(html),
      detail: "The page avoids explicitly generic template language.",
    },
    {
      name: "demo-disclaimer",
      passed: /not the business/i.test(html),
      detail: "Preview is clearly labeled as a demo.",
    },
  ];

  const defects = checks
    .filter((check) => !check.passed)
    .map((check) => check.detail);

  return { passed: defects.length === 0, checks, defects };
}

