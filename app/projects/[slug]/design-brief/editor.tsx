"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  AI_ASSET_GENERATION_MODES,
  AI_ASSET_PERMISSIONS,
  ASSET_CONDITIONS,
  AUTHENTICITY_RULES,
  BRAND_TRAITS,
  BUILD_TYPES,
  COLOR_SCALES,
  CONTENT_BALANCES,
  COPY_DENSITIES,
  CREATIVE_AUTHORITY_LEVELS,
  DESIGN_MODES,
  EFFECTS,
  FORM_COMPLEXITIES,
  GEOMETRIES,
  humanizeToken,
  LOGO_STRATEGIES,
  MOTIONS,
  PALETTE_AUTHORITIES,
  PHOTOGRAPHY_STRATEGIES,
  PRIMARY_GOALS,
  SHAPE_LANGUAGES,
  SITE_PAGES,
  THEMES,
  TYPOGRAPHY_CHARACTERISTICS,
  VISUAL_COMPLEXITIES,
  VISUAL_SCALES,
  VOICE_OPTIONS,
} from "@/lib/design-brief/constants";
import { createEmptyDesignBrief } from "@/lib/design-brief/defaults";
import { buildDesignBriefSummary } from "@/lib/design-brief/summary";
import type {
  AntiInspirationEntry,
  BrandColor,
  DesignBrief,
  DesignBriefProject,
  InspirationReference,
} from "@/lib/design-brief/types";
import { saveDesignBrief } from "./actions";
import { initialSaveBriefFormState } from "./types";

const ASPECTS = [
  "LAYOUT",
  "TYPOGRAPHY",
  "COLOR",
  "IMAGERY",
  "ANIMATION",
  "NAVIGATION",
  "COMPOSITION",
  "BRAND_PERSONALITY",
  "OVERALL_FEELING",
  "SPECIFIC_SECTION",
] as const;

const STEPS = [
  "Business",
  "Goals",
  "Brand",
  "Visual Style",
  "Colors & Type",
  "Inspiration",
  "Assets",
  "Content & Structure",
  "Conversion",
  "Review",
] as const;

const inputClasses =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300";

type EditorProps = {
  project: DesignBriefProject;
  initialBrief: DesignBrief | null;
};

type SectionKey = {
  [K in keyof DesignBrief]: DesignBrief[K] extends Record<string, unknown> ? K : never;
}[keyof DesignBrief];

export default function DesignBriefEditor({
  project,
  initialBrief,
}: EditorProps) {
  const storageKey = `mintchipos:design-brief:${project.slug}`;
  const [brief, setBrief] = useState<DesignBrief>(() => {
    if (typeof window !== "undefined") {
      try {
        const draft = window.localStorage.getItem(storageKey);
        if (draft) {
          return JSON.parse(draft) as DesignBrief;
        }
      } catch {
        // ignore malformed drafts
      }
    }
    return initialBrief ?? createEmptyDesignBrief(project);
  });
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(
    saveDesignBrief,
    initialSaveBriefFormState,
  );

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(brief));
  }, [brief, storageKey]);

  const update = <K extends keyof DesignBrief>(key: K, value: DesignBrief[K]) => {
    setBrief((current) => ({ ...current, [key]: value }));
  };

  const updateSection = <K extends SectionKey>(
    key: K,
    patch: Partial<DesignBrief[K]>,
  ) => {
    setBrief((current) => {
      const section = current[key] as Record<string, unknown>;
      return {
        ...current,
        [key]: { ...section, ...patch } as DesignBrief[K],
      } as DesignBrief;
    });
  };

  return (
    <form
      action={formAction}
      onSubmit={() => window.localStorage.removeItem(storageKey)}
      className="space-y-6"
      noValidate
    >
      <input type="hidden" name="project_id" value={project.id} />
      <input type="hidden" name="project_slug" value={project.slug} />
      <input type="hidden" name="brief_json" value={JSON.stringify(brief)} />

      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              index === step
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <BusinessStep brief={brief} updateSection={updateSection} />
      )}
      {step === 1 && (
        <GoalsStep brief={brief} updateSection={updateSection} />
      )}
      {step === 2 && (
        <BrandStep brief={brief} updateSection={updateSection} />
      )}
      {step === 3 && (
        <VisualStyleStep brief={brief} updateSection={updateSection} />
      )}
      {step === 4 && (
        <ColorsTypeStep brief={brief} updateSection={updateSection} />
      )}
      {step === 5 && (
        <InspirationStep brief={brief} updateSection={updateSection} />
      )}
      {step === 6 && (
        <AssetsStep brief={brief} updateSection={updateSection} />
      )}
      {step === 7 && (
        <ContentStructureStep brief={brief} updateSection={updateSection} />
      )}
      {step === 8 && (
        <ConversionStep brief={brief} updateSection={updateSection} />
      )}
      {step === 9 && (
        <ReviewStep brief={brief} update={update} updateSection={updateSection} />
      )}

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {pending ? "Saving..." : "Save Brief"}
          </button>
        )}
      </div>
    </form>
  );
}

type SectionProps = {
  brief: DesignBrief;
  updateSection: <K extends SectionKey>(
    key: K,
    patch: Partial<DesignBrief[K]>,
  ) => void;
};

function BusinessStep({ brief, updateSection }: SectionProps) {
  return (
    <Section title="Business">
      <Grid>
        <TextInput label="Business name" value={brief.project.businessName} onChange={(value) => updateSection("project", { businessName: value })} />
        <TextInput label="Industry" value={brief.project.industry} onChange={(value) => updateSection("project", { industry: value })} />
        <TextInput label="Industry subtype / niche" value={brief.project.industrySubtype} onChange={(value) => updateSection("project", { industrySubtype: value })} />
        <TextInput label="Business location" value={brief.project.businessLocation} onChange={(value) => updateSection("project", { businessLocation: value })} />
        <TextInput label="Existing website URL" value={brief.project.existingWebsiteUrl} onChange={(value) => updateSection("project", { existingWebsiteUrl: value })} />
        <SelectField label="Build type" value={brief.project.buildType} options={BUILD_TYPES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("project", { buildType: value as DesignBrief["project"]["buildType"] })} />
      </Grid>
      <TextArea label="Short project description" value={brief.project.description} onChange={(value) => updateSection("project", { description: value })} />
      <TextArea label="Business description" value={brief.businessAudience.businessDescription} onChange={(value) => updateSection("businessAudience", { businessDescription: value })} />
      <Grid>
        <TextArea label="Primary services / products" value={brief.businessAudience.servicesProducts.join("\n")} onChange={(value) => updateSection("businessAudience", { servicesProducts: lines(value) })} />
        <TextArea label="Customer priorities" value={brief.businessAudience.customerPriorities.join("\n")} onChange={(value) => updateSection("businessAudience", { customerPriorities: lines(value) })} />
        <TextArea label="Customer pain points" value={brief.businessAudience.customerPainPoints.join("\n")} onChange={(value) => updateSection("businessAudience", { customerPainPoints: lines(value) })} />
        <TextArea label="Common objections" value={brief.businessAudience.commonObjections.join("\n")} onChange={(value) => updateSection("businessAudience", { commonObjections: lines(value) })} />
        <TextArea label="Business differentiators" value={brief.businessAudience.differentiators.join("\n")} onChange={(value) => updateSection("businessAudience", { differentiators: lines(value) })} />
        <TextArea label="Trust factors" value={brief.businessAudience.trustFactors.join("\n")} onChange={(value) => updateSection("businessAudience", { trustFactors: lines(value) })} />
      </Grid>
      <Grid>
        <TextInput label="Primary target customer" value={brief.businessAudience.primaryTargetCustomer} onChange={(value) => updateSection("businessAudience", { primaryTargetCustomer: value })} />
        <TextInput label="Secondary target customer" value={brief.businessAudience.secondaryTargetCustomer} onChange={(value) => updateSection("businessAudience", { secondaryTargetCustomer: value })} />
        <TextInput label="Geographic market" value={brief.businessAudience.geographicMarket} onChange={(value) => updateSection("businessAudience", { geographicMarket: value })} />
        <TextInput label="Typical customer/project value" value={brief.businessAudience.typicalProjectValue} onChange={(value) => updateSection("businessAudience", { typicalProjectValue: value })} />
      </Grid>
    </Section>
  );
}

function GoalsStep({ brief, updateSection }: SectionProps) {
  return (
    <Section title="Website goals">
      <SelectField label="Primary goal" value={brief.websiteGoals.primaryGoal} options={PRIMARY_GOALS.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("websiteGoals", { primaryGoal: value as DesignBrief["websiteGoals"]["primaryGoal"] })} />
      <ChipMulti label="Secondary goals" options={PRIMARY_GOALS.map((value) => ({ value, label: humanizeToken(value) }))} selected={brief.websiteGoals.secondaryGoals} onChange={(selected) => updateSection("websiteGoals", { secondaryGoals: selected as DesignBrief["websiteGoals"]["secondaryGoals"] })} />
      <Grid>
        <TextInput label="Primary CTA concept" value={brief.websiteGoals.primaryCtaConcept} onChange={(value) => updateSection("websiteGoals", { primaryCtaConcept: value })} />
        <TextInput label="Secondary CTA concept" value={brief.websiteGoals.secondaryCtaConcept} onChange={(value) => updateSection("websiteGoals", { secondaryCtaConcept: value })} />
      </Grid>
      <TextInput label="Primary desired visitor action" value={brief.websiteGoals.primaryDesiredAction} onChange={(value) => updateSection("websiteGoals", { primaryDesiredAction: value })} />
      <TextArea label="What should visitors understand in the first 10–30 seconds?" value={brief.websiteGoals.firstImpression} onChange={(value) => updateSection("websiteGoals", { firstImpression: value })} />
    </Section>
  );
}

function BrandStep({ brief, updateSection }: SectionProps) {
  return (
    <Section title="Brand personality">
      <ChipMulti label="Traits" options={BRAND_TRAITS.map((value) => ({ value, label: humanizeToken(value) }))} selected={brief.brandPersonality.traits} onChange={(selected) => updateSection("brandPersonality", { traits: selected as DesignBrief["brandPersonality"]["traits"] })} />
      <TextArea label="Free-text brand description" value={brief.brandPersonality.description} onChange={(value) => updateSection("brandPersonality", { description: value })} />
      <TextInput label="Desired visitor feeling" value={brief.brandPersonality.desiredFeeling} onChange={(value) => updateSection("brandPersonality", { desiredFeeling: value })} />
    </Section>
  );
}

function VisualStyleStep({ brief, updateSection }: SectionProps) {
  const setScale = (key: (typeof VISUAL_SCALES)[number], value: number) =>
    updateSection("visualDirection", { scales: { ...brief.visualDirection.scales, [key]: value } });

  return (
    <Section title="Visual direction">
      <Scale label="Minimal ↔ Expressive" value={brief.visualDirection.scales.minimalExpressive} onChange={(value) => setScale("minimalExpressive", value)} />
      <Scale label="Conventional ↔ Experimental" value={brief.visualDirection.scales.conventionalExperimental} onChange={(value) => setScale("conventionalExperimental", value)} />
      <Scale label="Quiet ↔ Bold" value={brief.visualDirection.scales.quietBold} onChange={(value) => setScale("quietBold", value)} />
      <Scale label="Traditional ↔ Futuristic" value={brief.visualDirection.scales.traditionalFuturistic} onChange={(value) => setScale("traditionalFuturistic", value)} />
      <Scale label="Corporate ↔ Playful" value={brief.visualDirection.scales.corporatePlayful} onChange={(value) => setScale("corporatePlayful", value)} />
      <Scale label="Dense ↔ Spacious" value={brief.visualDirection.scales.denseSpacious} onChange={(value) => setScale("denseSpacious", value)} />
      <Scale label="Flat ↔ Layered" value={brief.visualDirection.scales.flatLayered} onChange={(value) => setScale("flatLayered", value)} />
      <Scale label="Symmetrical ↔ Asymmetrical" value={brief.visualDirection.scales.symmetricalAsymmetrical} onChange={(value) => setScale("symmetricalAsymmetrical", value)} />
      <Grid>
        <SelectField label="Theme" value={brief.visualDirection.theme} options={THEMES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("visualDirection", { theme: value as DesignBrief["visualDirection"]["theme"] })} />
        <SelectField label="Content balance" value={brief.visualDirection.contentBalance} options={CONTENT_BALANCES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("visualDirection", { contentBalance: value as DesignBrief["visualDirection"]["contentBalance"] })} />
        <SelectField label="Design mode" value={brief.visualDirection.designMode} options={DESIGN_MODES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("visualDirection", { designMode: value as DesignBrief["visualDirection"]["designMode"] })} />
        <SelectField label="Geometry" value={brief.visualDirection.geometry} options={GEOMETRIES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("visualDirection", { geometry: value as DesignBrief["visualDirection"]["geometry"] })} />
        <SelectField label="Visual complexity" value={brief.visualDirection.visualComplexity} options={VISUAL_COMPLEXITIES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("visualDirection", { visualComplexity: value as DesignBrief["visualDirection"]["visualComplexity"] })} />
      </Grid>
      <TextArea label="Free-text visual direction" value={brief.visualDirection.notes} onChange={(value) => updateSection("visualDirection", { notes: value })} />
      <SelectField label="Shape language" value={brief.visualLanguage.shapeLanguage} options={SHAPE_LANGUAGES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("visualLanguage", { shapeLanguage: value as DesignBrief["visualLanguage"]["shapeLanguage"] })} />
      <ChipMulti label="Optional effects" options={EFFECTS.map((value) => ({ value, label: humanizeToken(value) }))} selected={brief.visualLanguage.effects} onChange={(selected) => updateSection("visualLanguage", { effects: selected as DesignBrief["visualLanguage"]["effects"] })} />
      <SelectField label="Motion" value={brief.visualLanguage.motion} options={MOTIONS.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("visualLanguage", { motion: value as DesignBrief["visualLanguage"]["motion"] })} />
      <TextArea label="Motion / style notes" value={brief.visualLanguage.notes} onChange={(value) => updateSection("visualLanguage", { notes: value })} />
    </Section>
  );
}

function ColorsTypeStep({ brief, updateSection }: SectionProps) {
  const setColorScale = (key: (typeof COLOR_SCALES)[number], value: number) =>
    updateSection("colorDirection", { scales: { ...brief.colorDirection.scales, [key]: value } });

  return (
    <Section title="Colors and typography">
      <BrandColorList colors={brief.colorDirection.existingBrandColors} onChange={(colors) => updateSection("colorDirection", { existingBrandColors: colors })} />
      <Grid>
        <TextArea label="Required colors" value={brief.colorDirection.requiredColors.join("\n")} onChange={(value) => updateSection("colorDirection", { requiredColors: lines(value) })} />
        <TextArea label="Preferred colors" value={brief.colorDirection.preferredColors.join("\n")} onChange={(value) => updateSection("colorDirection", { preferredColors: lines(value) })} />
        <TextArea label="Colors to avoid" value={brief.colorDirection.avoidColors.join("\n")} onChange={(value) => updateSection("colorDirection", { avoidColors: lines(value) })} />
      </Grid>
      <Scale label="Warm ↔ Cool" value={brief.colorDirection.scales.warmCool} onChange={(value) => setColorScale("warmCool", value)} />
      <Scale label="Muted ↔ Saturated" value={brief.colorDirection.scales.mutedSaturated} onChange={(value) => setColorScale("mutedSaturated", value)} />
      <Scale label="Soft ↔ High contrast" value={brief.colorDirection.scales.softHighContrast} onChange={(value) => setColorScale("softHighContrast", value)} />
      <Scale label="Monochrome ↔ Multicolor" value={brief.colorDirection.scales.monochromeMulticolor} onChange={(value) => setColorScale("monochromeMulticolor", value)} />
      <SelectField label="Palette authority" value={brief.colorDirection.paletteAuthority} options={PALETTE_AUTHORITIES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("colorDirection", { paletteAuthority: value as DesignBrief["colorDirection"]["paletteAuthority"] })} />
      <ChipMulti label="Typography characteristics" options={TYPOGRAPHY_CHARACTERISTICS.map((value) => ({ value, label: humanizeToken(value) }))} selected={brief.typography.characteristics} onChange={(selected) => updateSection("typography", { characteristics: selected as DesignBrief["typography"]["characteristics"] })} />
      <Grid>
        <Toggle label="Large display typography preference" checked={brief.typography.largeDisplayPreference} onChange={(checked) => updateSection("typography", { largeDisplayPreference: checked })} />
        <Toggle label="Uppercase-heavy preference" checked={brief.typography.uppercaseHeavyPreference} onChange={(checked) => updateSection("typography", { uppercaseHeavyPreference: checked })} />
      </Grid>
      <Scale label="Restraint level" value={brief.typography.restraintLevel} onChange={(value) => updateSection("typography", { restraintLevel: value })} />
      <Grid>
        <TextArea label="Required fonts" value={brief.typography.requiredFonts.join("\n")} onChange={(value) => updateSection("typography", { requiredFonts: lines(value) })} />
        <TextArea label="Fonts/styles to avoid" value={brief.typography.avoidFonts.join("\n")} onChange={(value) => updateSection("typography", { avoidFonts: lines(value) })} />
      </Grid>
    </Section>
  );
}

function InspirationStep({ brief, updateSection }: SectionProps) {
  return (
    <Section title="Inspiration and anti-inspiration">
      <InspirationList references={brief.inspiration.references} onChange={(references) => updateSection("inspiration", { references })} />
      <Grid>
        <TextArea label="Styles to avoid" value={brief.inspiration.stylesToAvoid.join("\n")} onChange={(value) => updateSection("inspiration", { stylesToAvoid: lines(value) })} />
        <TextArea label="Website clichés to avoid" value={brief.inspiration.clichesToAvoid.join("\n")} onChange={(value) => updateSection("inspiration", { clichesToAvoid: lines(value) })} />
      </Grid>
      <TextArea label="What should this website absolutely NOT look like?" value={brief.inspiration.absolutelyNot} onChange={(value) => updateSection("inspiration", { absolutelyNot: value })} />
      <AntiInspirationList entries={brief.antiInspiration.entries} onChange={(entries) => updateSection("antiInspiration", { entries })} />
    </Section>
  );
}

function AssetsStep({ brief, updateSection }: SectionProps) {
  return (
    <Section title="Asset strategy">
      <Grid>
        <SelectField label="Brand asset condition" value={brief.assetStrategy.brandAssetCondition} options={ASSET_CONDITIONS.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("assetStrategy", { brandAssetCondition: value as DesignBrief["assetStrategy"]["brandAssetCondition"] })} />
        <SelectField label="Logo strategy" value={brief.assetStrategy.logoStrategy} options={LOGO_STRATEGIES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("assetStrategy", { logoStrategy: value as DesignBrief["assetStrategy"]["logoStrategy"] })} />
      </Grid>
      <ChipMulti label="Photography strategy" options={PHOTOGRAPHY_STRATEGIES.map((value) => ({ value, label: humanizeToken(value) }))} selected={brief.assetStrategy.photography} onChange={(selected) => updateSection("assetStrategy", { photography: selected as DesignBrief["assetStrategy"]["photography"] })} />
      <ChipMulti label="AI asset permissions" options={AI_ASSET_PERMISSIONS.map((value) => ({ value, label: humanizeToken(value) }))} selected={brief.assetStrategy.aiAssetPermissions} onChange={(selected) => updateSection("assetStrategy", { aiAssetPermissions: selected as DesignBrief["assetStrategy"]["aiAssetPermissions"] })} />
      <SelectField label="AI asset generation mode" value={brief.assetStrategy.aiAssetGenerationMode} options={AI_ASSET_GENERATION_MODES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("assetStrategy", { aiAssetGenerationMode: value as DesignBrief["assetStrategy"]["aiAssetGenerationMode"] })} />
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Authenticity rules (always enforced)</p>
        <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          {AUTHENTICITY_RULES.map((rule) => (
            <li key={rule}>• {rule}</li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function ContentStructureStep({ brief, updateSection }: SectionProps) {
  return (
    <Section title="Content and structure">
      <ChipMulti label="Voice" options={VOICE_OPTIONS.map((value) => ({ value, label: humanizeToken(value) }))} selected={brief.contentDirection.voice} onChange={(selected) => updateSection("contentDirection", { voice: selected as DesignBrief["contentDirection"]["voice"] })} />
      <TextArea label="Desired messaging" value={brief.contentDirection.desiredMessaging} onChange={(value) => updateSection("contentDirection", { desiredMessaging: value })} />
      <Grid>
        <TextArea label="Important phrases" value={brief.contentDirection.importantPhrases.join("\n")} onChange={(value) => updateSection("contentDirection", { importantPhrases: lines(value) })} />
        <TextArea label="Phrases/words to avoid" value={brief.contentDirection.phrasesToAvoid.join("\n")} onChange={(value) => updateSection("contentDirection", { phrasesToAvoid: lines(value) })} />
      </Grid>
      <Grid>
        <Toggle label="Existing copy available" checked={brief.contentDirection.existingCopyAvailable} onChange={(checked) => updateSection("contentDirection", { existingCopyAvailable: checked })} />
        <Toggle label="AI may rewrite existing copy" checked={brief.contentDirection.aiMayRewriteExistingCopy} onChange={(checked) => updateSection("contentDirection", { aiMayRewriteExistingCopy: checked })} />
        <Toggle label="AI may create new draft copy" checked={brief.contentDirection.aiMayCreateNewCopy} onChange={(checked) => updateSection("contentDirection", { aiMayCreateNewCopy: checked })} />
      </Grid>
      <SelectField label="Copy density" value={brief.contentDirection.copyDensity} options={COPY_DENSITIES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("contentDirection", { copyDensity: value as DesignBrief["contentDirection"]["copyDensity"] })} />
      <ChipMulti label="Site pages" options={SITE_PAGES.map((value) => ({ value, label: humanizeToken(value) }))} selected={brief.siteStructure.pages} onChange={(selected) => updateSection("siteStructure", { pages: selected as DesignBrief["siteStructure"]["pages"] })} />
      <Grid>
        <TextArea label="Custom pages" value={brief.siteStructure.customPages.join("\n")} onChange={(value) => updateSection("siteStructure", { customPages: lines(value) })} />
        <TextArea label="Required homepage sections" value={brief.siteStructure.requiredHomepageSections.join("\n")} onChange={(value) => updateSection("siteStructure", { requiredHomepageSections: lines(value) })} />
        <TextArea label="Requested sections" value={brief.siteStructure.requestedSections.join("\n")} onChange={(value) => updateSection("siteStructure", { requestedSections: lines(value) })} />
        <TextArea label="Sections Creative Director may determine" value={brief.siteStructure.creativeDirectorSections.join("\n")} onChange={(value) => updateSection("siteStructure", { creativeDirectorSections: lines(value) })} />
      </Grid>
    </Section>
  );
}

function ConversionStep({ brief, updateSection }: SectionProps) {
  return (
    <Section title="Conversion and creative authority">
      <Grid>
        <TextInput label="Primary CTA concept" value={brief.demoConversionUx.primaryCtaConcept} onChange={(value) => updateSection("demoConversionUx", { primaryCtaConcept: value })} />
        <TextInput label="Secondary CTA concept" value={brief.demoConversionUx.secondaryCtaConcept} onChange={(value) => updateSection("demoConversionUx", { secondaryCtaConcept: value })} />
      </Grid>
      <Grid>
        <Toggle label="Phone CTA desired" checked={brief.demoConversionUx.phoneCtaDesired} onChange={(checked) => updateSection("demoConversionUx", { phoneCtaDesired: checked })} />
        <Toggle label="Quote form desired" checked={brief.demoConversionUx.quoteFormDesired} onChange={(checked) => updateSection("demoConversionUx", { quoteFormDesired: checked })} />
        <Toggle label="Booking CTA desired" checked={brief.demoConversionUx.bookingCtaDesired} onChange={(checked) => updateSection("demoConversionUx", { bookingCtaDesired: checked })} />
        <Toggle label="Portfolio emphasis" checked={brief.demoConversionUx.portfolioEmphasis} onChange={(checked) => updateSection("demoConversionUx", { portfolioEmphasis: checked })} />
        <Toggle label="Review emphasis" checked={brief.demoConversionUx.reviewEmphasis} onChange={(checked) => updateSection("demoConversionUx", { reviewEmphasis: checked })} />
        <Toggle label="Sticky mobile CTA" checked={brief.demoConversionUx.stickyMobileCta} onChange={(checked) => updateSection("demoConversionUx", { stickyMobileCta: checked })} />
        <Toggle label="Persistent header CTA" checked={brief.demoConversionUx.persistentHeaderCta} onChange={(checked) => updateSection("demoConversionUx", { persistentHeaderCta: checked })} />
      </Grid>
      <SelectField label="Desired form complexity" value={brief.demoConversionUx.formComplexity} options={FORM_COMPLEXITIES.map((value) => ({ value, label: humanizeToken(value) }))} onChange={(value) => updateSection("demoConversionUx", { formComplexity: value as DesignBrief["demoConversionUx"]["formComplexity"] })} />
      <Scale label="Creative authority" value={brief.creativeAuthority.level} onChange={(value) => updateSection("creativeAuthority", { level: value })} />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{CREATIVE_AUTHORITY_LEVELS.find((level) => level.level === brief.creativeAuthority.level)?.description}</p>
    </Section>
  );
}

function ReviewStep({
  brief,
  update,
  updateSection,
}: SectionProps & {
  update: <K extends keyof DesignBrief>(key: K, value: DesignBrief[K]) => void;
}) {
  return (
    <Section title="Review">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Summary</p>
        <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          {buildDesignBriefSummary(brief)}
        </pre>
      </div>
      <Grid>
        <TextArea label="Must include" value={brief.hardConstraints.mustInclude.join("\n")} onChange={(value) => updateSection("hardConstraints", { mustInclude: lines(value) })} />
        <TextArea label="Must preserve" value={brief.hardConstraints.mustPreserve.join("\n")} onChange={(value) => updateSection("hardConstraints", { mustPreserve: lines(value) })} />
        <TextArea label="Must not include" value={brief.hardConstraints.mustNotInclude.join("\n")} onChange={(value) => updateSection("hardConstraints", { mustNotInclude: lines(value) })} />
        <TextArea label="Existing brand requirements" value={brief.hardConstraints.brandRequirements.join("\n")} onChange={(value) => updateSection("hardConstraints", { brandRequirements: lines(value) })} />
        <TextArea label="Accessibility/design considerations" value={brief.hardConstraints.accessibilityConsiderations.join("\n")} onChange={(value) => updateSection("hardConstraints", { accessibilityConsiderations: lines(value) })} />
        <TextArea label="Other non-negotiables" value={brief.hardConstraints.otherNonNegotiables.join("\n")} onChange={(value) => updateSection("hardConstraints", { otherNonNegotiables: lines(value) })} />
      </Grid>
      <TextArea label="Creative Director notes" value={brief.creativeDirectorNotes} onChange={(value) => update("creativeDirectorNotes", value)} />
    </Section>
  );
}

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} className={inputClasses} />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClasses} resize-y`} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClasses}>
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-zinc-900" />
    </label>
  );
}

function ChipMulti({ label, options, selected, onChange }: { label: string; options: { value: string; label: string }[]; selected: string[]; onChange: (selected: string[]) => void }) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${selected.includes(option.value) ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Scale({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{value}/5</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={`h-9 flex-1 rounded-lg border text-sm font-medium transition ${level === value ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"}`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}

function BrandColorList({ colors, onChange }: { colors: BrandColor[]; onChange: (colors: BrandColor[]) => void }) {
  const updateColor = (index: number, patch: Partial<BrandColor>) => {
    onChange(colors.map((color, i) => (i === index ? { ...color, ...patch } : color)));
  };
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Existing brand colors</label>
      <div className="space-y-2">
        {colors.map((color, index) => (
          <div key={index} className="flex items-center gap-2">
            <input type="color" value={color.hex} onChange={(event) => updateColor(index, { hex: event.target.value })} className="h-9 w-12 rounded border border-zinc-300 bg-white" />
            <input type="text" value={color.label} placeholder="Label" onChange={(event) => updateColor(index, { label: event.target.value })} className={inputClasses} />
            <button type="button" onClick={() => onChange(colors.filter((_, i) => i !== index))} className="text-sm text-zinc-400 hover:text-red-600">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...colors, { label: "", hex: "#000000" }])} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">+ Add color</button>
      </div>
    </div>
  );
}

function InspirationList({ references, onChange }: { references: InspirationReference[]; onChange: (references: InspirationReference[]) => void }) {
  const update = (index: number, patch: Partial<InspirationReference>) => {
    onChange(references.map((ref, i) => (i === index ? { ...ref, ...patch } : ref)));
  };
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Inspiration references</label>
      <div className="space-y-3">
        {references.map((ref, index) => (
          <div key={index} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="text" placeholder="URL" value={ref.url} onChange={(event) => update(index, { url: event.target.value })} className={inputClasses} />
              <input type="text" placeholder="Name" value={ref.name} onChange={(event) => update(index, { name: event.target.value })} className={inputClasses} />
            </div>
            <ChipMulti label="Liked aspects" options={ASPECTS.map((value) => ({ value, label: humanizeToken(value) }))} selected={ref.likedAspects} onChange={(likedAspects) => update(index, { likedAspects })} />
            <textarea rows={2} placeholder="Notes" value={ref.notes} onChange={(event) => update(index, { notes: event.target.value })} className={`${inputClasses} mt-2 resize-y`} />
            <button type="button" onClick={() => onChange(references.filter((_, i) => i !== index))} className="mt-2 text-sm text-zinc-400 hover:text-red-600">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...references, { url: "", name: "", likedAspects: [], notes: "" }])} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">+ Add reference</button>
      </div>
    </div>
  );
}

function AntiInspirationList({ entries, onChange }: { entries: AntiInspirationEntry[]; onChange: (entries: AntiInspirationEntry[]) => void }) {
  const update = (index: number, patch: Partial<AntiInspirationEntry>) => {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Anti-references</label>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={index} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="text" placeholder="URL" value={entry.url} onChange={(event) => update(index, { url: event.target.value })} className={inputClasses} />
              <input type="text" placeholder="Name" value={entry.name} onChange={(event) => update(index, { name: event.target.value })} className={inputClasses} />
            </div>
            <ChipMulti label="Disliked aspects" options={ASPECTS.map((value) => ({ value, label: humanizeToken(value) }))} selected={entry.dislikedAspects} onChange={(dislikedAspects) => update(index, { dislikedAspects })} />
            <textarea rows={2} placeholder="Notes" value={entry.notes} onChange={(event) => update(index, { notes: event.target.value })} className={`${inputClasses} mt-2 resize-y`} />
            <button type="button" onClick={() => onChange(entries.filter((_, i) => i !== index))} className="mt-2 text-sm text-zinc-400 hover:text-red-600">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...entries, { url: "", name: "", dislikedAspects: [], notes: "" }])} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">+ Add anti-reference</button>
      </div>
    </div>
  );
}
