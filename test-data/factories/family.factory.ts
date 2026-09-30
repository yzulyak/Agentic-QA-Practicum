import { faker } from '@faker-js/faker';

/** Typed payload for the Dashboard "Set up your family" form (Family name field). */
export type FamilyPayload = {
  /** Accessible name on the live form: "Family name" (required, maxlength 100). */
  familyName: string;
};

/** Builds a unique family-create payload using Faker and Date.now(). */
export function buildFamily(overrides: Partial<FamilyPayload> = {}): FamilyPayload {
  const stamp = Date.now();
  // Live helper copy: e.g. "The Gorfels"; keep under maxlength 100.
  const familyName = `The ${faker.person.lastName()}s-${stamp}`.slice(0, 100);

  return {
    familyName,
    ...overrides,
  };
}
