/**
 * Central switch for temporarily disabling paid monetization UX/enforcement
 * while freemium onboarding is active.
 */
export const MONETIZATION_ENABLED = false;

export function isMonetizationEnabled(): boolean {
  return MONETIZATION_ENABLED;
}
