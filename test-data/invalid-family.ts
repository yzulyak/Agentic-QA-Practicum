/**
 * Invalid Family name inputs for AQPBT-2.
 *
 * AQPBT-2 acceptance criteria do not describe invalid inputs for Create /
 * Family name (family setup is out of scope for that story). This set stays
 * empty until an AC names a concrete invalid value.
 *
 * Open questions (live HTML observed; not AQPBT-2 AC — do not treat as rules):
 * - Is empty Family name invalid? (input has required=""; not in AC 1–9)
 * - Is Family name longer than 100 characters invalid? (maxlength="100"; not in AC)
 * - Is whitespace-only Family name invalid? (not in story or Confluence)
 * - What error copy is shown on failed Create? (Create was not submitted in docs)
 */
export const invalidFamily = {
  // no AC-defined invalid Family name values on AQPBT-2
} as const;
