/**
 * lib/moderation.ts
 * Client-side content moderation engine.
 * Normalizes text and checks against the word list tiers.
 */

import { HARD_BLOCK_TERMS, SOFT_FLAG_TERMS } from './moderation-words';

export type ModerationResult =
    | { allowed: true; flagged: false }
    | { allowed: false; flagged: true; tier: 'hard'; matches: string[] }
    | { allowed: true; flagged: true; tier: 'soft'; matches: string[] };

/**
 * Normalize text to defeat common evasion tactics:
 *   l33tspeak, extra spaces, repeated chars, zero-width chars, etc.
 */
function normalize(text: string): string {
    return text
        .toLowerCase()
        // Remove zero-width and invisible chars
        .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
        // Collapse repeated chars (heeell → hel, fuuuck → fuk)
        .replace(/(.)\1{2,}/g, '$1$1')
        // Common leetspeak substitutions
        .replace(/@/g, 'a')
        .replace(/4/g, 'a')
        .replace(/3/g, 'e')
        .replace(/1/g, 'i')
        .replace(/!/g, 'i')
        .replace(/0/g, 'o')
        .replace(/5/g, 's')
        .replace(/\$/g, 's')
        .replace(/7/g, 't')
        .replace(/\+/g, 't')
        .replace(/\|/g, 'l')
        // Strip punctuation used as separators (f.u.c.k → fuck)
        .replace(/[.\-_*]/g, '')
        // Collapse spaces
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Check if normalized text contains any of the given terms.
 * Uses word-boundary-aware matching where possible.
 */
function findMatches(normalizedText: string, terms: string[]): string[] {
    const found: string[] = [];
    for (const term of terms) {
        // Use word boundary for single words, plain include for phrases
        const isPhrase = term.includes(' ');
        const matched = isPhrase
            ? normalizedText.includes(term)
            : new RegExp(`\\b${term.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(normalizedText);
        if (matched) found.push(term);
    }
    return found;
}

/**
 * Main entry point. Call before any community post or comment submission.
 */
export function checkContent(text: string): ModerationResult {
    const normalized = normalize(text);

    const hardMatches = findMatches(normalized, HARD_BLOCK_TERMS);
    if (hardMatches.length > 0) {
        return { allowed: false, flagged: true, tier: 'hard', matches: hardMatches };
    }

    const softMatches = findMatches(normalized, SOFT_FLAG_TERMS);
    if (softMatches.length > 0) {
        return { allowed: true, flagged: true, tier: 'soft', matches: softMatches };
    }

    return { allowed: true, flagged: false };
}

/**
 * Human-readable error message for the UI.
 */
export function getModerationMessage(result: ModerationResult): string | null {
    if (!result.flagged) return null;
    if (result.tier === 'hard') {
        return "Your post contains language that isn't allowed in this community. Please edit it before sharing.";
    }
    return null; // soft flags are silent to the user, only go to admin review
}
