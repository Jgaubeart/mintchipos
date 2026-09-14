import type {
  AssetPlan,
  BusinessResearch,
  CreativeDirection,
  DesignBrief,
  FrontendBuilder,
  FrontendBuildResult,
  UxContentStrategy,
} from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makeBuildId(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 0x01000193);
  }
  return `wf-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class DeterministicFrontendBuilder implements FrontendBuilder {
  async build(input: {
    brief: DesignBrief;
    research: BusinessResearch;
    strategy: UxContentStrategy;
    creative: CreativeDirection;
    assets: AssetPlan;
    defects?: string[];
  }): Promise<FrontendBuildResult> {
    const businessName = input.brief.project.businessName;
    const headline =
      input.strategy.headlineStrategy || `${businessName} — local service`;
    const services = input.research.services.length
      ? input.research.services
      : ["Core service", "Secondary service"];
    const sections = input.strategy.sectionSequence;
    const cta = input.brief.demoConversionUx.primaryCtaConcept || "Get a quote";
    const phone = input.research.phone;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${escapeHtml(input.research.description ?? businessName)}" />
  <title>${escapeHtml(businessName)}</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; }
    body { margin: 0; color: #171717; background: #ffffff; }
    main { width: min(1080px, calc(100% - 32px)); margin: 0 auto; }
    section { padding: 64px 0; border-bottom: 1px solid #e5e5e5; }
    h1 { font-size: clamp(2.2rem, 7vw, 4.8rem); line-height: 1; }
    a.cta, button.cta { display: inline-block; margin-top: 24px; padding: 14px 20px;
      background: #171717; color: #ffffff; text-decoration: none; border-radius: 10px; }
    .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .service { border: 1px solid #e5e5e5; border-radius: 14px; padding: 20px; }
  </style>
</head>
<body>
  <main>
    <section>
      <p>${escapeHtml(input.creative.centralVisualConcept)}</p>
      <h1>${escapeHtml(headline)}</h1>
      <p>${escapeHtml(input.research.valueProposition ?? "")}</p>
      <a class="cta" href="#contact">${escapeHtml(cta)}</a>
    </section>
    <section>
      <h2>Services</h2>
      <div class="services">
        ${services.map((service) => `<div class="service"><h3>${escapeHtml(service)}</h3></div>`).join("")}
      </div>
    </section>
    <section>
      <h2>About</h2>
      <p>${escapeHtml(input.research.description ?? "Local business.")}</p>
    </section>
    <section id="contact">
      <h2>Contact</h2>
      <p>${phone ? `<a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a>` : "Contact information available on request."}</p>
      <a class="cta" href="mailto:${escapeHtml(input.research.publicEmail ?? "")}">${escapeHtml(cta)}</a>
    </section>
    <p style="padding: 32px 0;">Demo preview — not the business&apos;s live website.</p>
  </main>
</body>
</html>`;

    const defects = input.defects ?? [];
    const buildId = makeBuildId(
      `${businessName}|${sections.join("|")}|${defects.join("|")}`,
    );

    return {
      siteFormat: input.brief.siteFormat.format,
      html,
      sourceFiles: ["index.html"],
      buildId,
      buildResult: "OK",
    };
  }
}
