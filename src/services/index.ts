import { mockServices } from './mock';
import type { Services } from './types';

export type * from './types';
export { loadDb } from './mock/db';

/**
 * Single entry point for data access. Replace `mockServices` with a
 * Supabase-backed implementation of `Services` to go to production.
 */
export const api: Services = mockServices;
