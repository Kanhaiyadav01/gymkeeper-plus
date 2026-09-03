/**
 * Tenant context.
 *
 * In production this is resolved server-side from the session cookie:
 *   session -> user -> user.gymId
 * The client never supplies gymId, and no gymId is accepted from query
 * params, request bodies, or client state.
 *
 * In this UI prototype the same contract is preserved: the mock repository
 * reads the tenant from here, never from a caller argument.
 */

export interface TenantContext {
  userId: string;
  userName: string;
  gymId: string;
  gymName: string;
  timezone: string;
}

const SESSION: TenantContext = {
  userId: "user_001",
  userName: "Amit Kumar",
  gymId: "gym_001",
  gymName: "Fitking's Academy",
  timezone: "Asia/Kolkata",
};

export function getTenantContext(): TenantContext {
  return SESSION;
}
