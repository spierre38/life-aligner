/**
 * Moderation word list — handles slurs, profanity, and hate speech.
 * Split into two tiers:
 *   HARD_BLOCK  — post is rejected immediately (no bypass)
 *   SOFT_FLAG   — post is allowed but queued for admin review
 */

// ── Tier 1: Hard block (slurs & hate speech) ─────────────────────────────────
// Words are stored as regexable fragments to catch common variations.
// WARNING: This file contains offensive terms for the sole purpose of blocking them.
export const HARD_BLOCK_TERMS: string[] = [
    // racial slurs
    'nigger', 'nigga', 'n1gger', 'nigg', 'kike', 'spic', 'chink', 'gook',
    'wetback', 'coon', 'jigaboo', 'porch monkey', 'cracker', 'honky',
    'zipperhead', 'sand nigger', 'raghead', 'towelhead', 'beaner',
    // homophobic / transphobic slurs
    'faggot', 'fag', 'dyke', 'tranny', 'shemale', 'he-she', 'it',
    'queer', // context-sensitive but on hard list for safety
    // gendered slurs
    'cunt', 'twat', 'whore', 'slut', 'skank',
    // disability slurs
    'retard', 'retarded', 'spaz', 'spastic',
    // general hate
    'nazi', 'white power', 'white supremacy', 'heil hitler', '1488',
    'kill yourself', 'kys', 'go kill',
];

// ── Tier 2: Soft flag (profanity — allowed but reviewed) ─────────────────────
export const SOFT_FLAG_TERMS: string[] = [
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'bastard', 'piss',
    'crap', 'dick', 'cock', 'pussy', 'motherfucker', 'asshole',
];
