import { faker } from '@faker-js/faker';

/** Payload for POST /api/v1/children (fields observed in api/CATALOG.md). */
export type ChildPayload = {
  firstName: string;
  birthYear: number;
  birthMonth: number;
  avatarKey: string;
  interests: string[];
};

/** Builds a unique child-create payload using Faker and Date.now(). */
export function buildChild(overrides: Partial<ChildPayload> = {}): ChildPayload {
  const stamp = Date.now();
  const firstName = `${faker.person.firstName()}${stamp}`.slice(0, 80);

  return {
    firstName,
    birthYear: 2019,
    birthMonth: 6,
    avatarKey: 'fox',
    interests: [],
    ...overrides,
  };
}
