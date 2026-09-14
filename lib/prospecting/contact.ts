import type {
  ContactDiscoveryProvider,
  ContactDiscoveryResult,
  NormalizedCandidate,
  WebsiteInspectionResult,
} from "./types";

function firstDefined(
  values: Array<string | null | undefined>,
): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
}

/**
 * Extracts only contact data that is already present on the candidate record
 * or in the inspected public website HTML. It never guesses or synthesizes
 * addresses.
 */
export class PublicWebsiteContactProvider implements ContactDiscoveryProvider {
  readonly name = "public-website";

  discover(
    candidate: NormalizedCandidate,
    website: WebsiteInspectionResult,
  ): ContactDiscoveryResult {
    const notes: string[] = [];

    const emailCandidates = [
      website.emailLinks[0],
      candidate.publicEmail,
    ].filter((value): value is string => Boolean(value));
    const email = firstDefined(emailCandidates);
    const emailFound = Boolean(email && isValidEmail(email));

    if (emailCandidates.length > 0 && !emailFound) {
      notes.push("An email-like value was found but was not a valid address.");
    }

    const phoneCandidates = [
      website.phoneLinks[0],
      candidate.phone,
    ].filter((value): value is string => Boolean(value));
    const phone = firstDefined(phoneCandidates);
    const phoneFound = Boolean(phone);

    const contactPageUrl = firstDefined([
      website.contactPageUrl,
      candidate.contactPageUrl,
    ]);
    const contactPageFound = Boolean(contactPageUrl);

    return {
      email: emailFound ? email : null,
      emailFound,
      emailSourceUrl: emailFound ? candidate.websiteUrl ?? null : null,
      phone: phoneFound ? phone : null,
      phoneFound,
      contactPageUrl,
      contactPageFound,
      notes,
    };
  }
}

export function noGuessedEmail(): ContactDiscoveryResult {
  return {
    email: null,
    emailFound: false,
    emailSourceUrl: null,
    phone: null,
    phoneFound: false,
    contactPageUrl: null,
    contactPageFound: false,
    notes: ["Email discovery only accepts public, already-discovered addresses."],
  };
}

