import type {
  DemoLimitation,
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
      passed: /name=["']viewport["']/i.test(html),
      detail: "Mobile viewport is present.",
    },
    {
      name: "title",
      passed: /<title>/.test(html),
      detail: "Page title is present.",
    },
    {
      name: "contact-cta",
      passed:
        /id=["']contact["']/i.test(html) &&
        /class=["'][^"']*cta/i.test(html),
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

  const blockingDefects = checks
    .filter((check) => !check.passed)
    .map((check) => check.detail);

  const demoLimitations: DemoLimitation[] = [];
  if (/placeholder|demo site|not connected/i.test(html)) {
    demoLimitations.push("PLACEHOLDER_REVIEWS");
    demoLimitations.push("PLACEHOLDER_PORTFOLIO");
    demoLimitations.push("FORM_NOT_CONNECTED");
  }

  const status =
    blockingDefects.length === 0
      ? demoLimitations.length === 0
        ? "PASSED"
        : "PASSED_WITH_DEMO_LIMITATIONS"
      : "FAILED";

  return {
    status,
    score: Math.round(
      ((checks.length - blockingDefects.length) / Math.max(checks.length, 1)) *
        100,
    ),
    blockingDefects,
    demoLimitations,
    recommendations: [],
    summary:
      status === "PASSED"
        ? "Visual QA passed with no material defects or demo limitations."
        : status === "PASSED_WITH_DEMO_LIMITATIONS"
          ? "Visually acceptable for a non-production demo with disclosed placeholder data."
          : "Visual QA failed due to material interaction, accessibility, or layout defects.",
    passed: blockingDefects.length === 0,
    checks,
    defects: blockingDefects,
  };
}

export function normalizeVisualQaReport(
  value: unknown,
): VisualQaReport {
  if (!value || typeof value !== "object") {
    return {
      status: "FAILED",
      score: 0,
      blockingDefects: ["Visual QA report is missing."],
      demoLimitations: [],
      recommendations: [],
      summary: "Visual QA report is missing.",
      passed: false,
      checks: [],
      defects: ["Visual QA report is missing."],
    };
  }

  const report = value as Partial<VisualQaReport> & {
    checks?: Array<{ name: string; passed: boolean; detail: string }>;
    defects?: string[];
  };
  const checks = Array.isArray(report.checks) ? report.checks : [];
  const blockingDefects = Array.isArray(report.blockingDefects)
    ? report.blockingDefects
    : Array.isArray(report.defects)
      ? report.defects
      : checks
          .filter((check) => !check.passed)
          .map((check) => check.detail);
  const demoLimitations = Array.isArray(report.demoLimitations)
    ? report.demoLimitations
    : [];
  const status: VisualQaReport["status"] =
    report.status === "PASSED" ||
    report.status === "PASSED_WITH_DEMO_LIMITATIONS" ||
    report.status === "FAILED"
      ? report.status
      : blockingDefects.length === 0
        ? demoLimitations.length === 0
          ? "PASSED"
          : "PASSED_WITH_DEMO_LIMITATIONS"
        : "FAILED";

  return {
    status,
    score:
      typeof report.score === "number"
        ? Math.max(0, Math.min(100, Math.round(report.score)))
        : checks.length === 0
          ? (status === "PASSED" ? 100 : status === "PASSED_WITH_DEMO_LIMITATIONS" ? 85 : 0)
          : Math.round(
              (checks.filter((check) => check.passed).length /
                Math.max(checks.length, 1)) *
                100,
            ),
    blockingDefects,
    demoLimitations,
    recommendations: Array.isArray(report.recommendations)
      ? report.recommendations
      : [],
    summary:
      typeof report.summary === "string"
        ? report.summary
        : status === "FAILED"
          ? "Visual QA failed."
          : status === "PASSED_WITH_DEMO_LIMITATIONS"
            ? "Visually acceptable for demo with disclosed limitations."
            : "Visual QA passed.",
    passed: report.passed ?? blockingDefects.length === 0,
    checks,
    defects: blockingDefects,
  };
}

export function visualQaGate(report: VisualQaReport): {
  allowed: boolean;
  requiresDemoLabel: boolean;
} {
  return {
    allowed: report.status !== "FAILED",
    requiresDemoLabel: report.status === "PASSED_WITH_DEMO_LIMITATIONS",
  };
}
