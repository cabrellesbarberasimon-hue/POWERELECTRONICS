import type { CompanyLicense, CourseProgress, LicenseTier } from '@/types/domain';
import { daysAgo, daysFromNow } from './time';

/**
 * Licence tiers from the economic model (Hoja_de_cálculo / DIARIO, Tabla 3).
 * Only the ">1500" price is defined in the documents (2,000 €/month). The two
 * lower tiers are placeholder prices and are editable from the admin panel.
 */
export const licenseTiers: LicenseTier[] = [
  { id: 'small', minEmployees: 0, maxEmployees: 500, monthlyEur: 600 },
  { id: 'medium', minEmployees: 500, maxEmployees: 1500, monthlyEur: 1200 },
  { id: 'large', minEmployees: 1500, maxEmployees: null, monthlyEur: 2000 },
];

export const companyLicense: CompanyLicense = {
  company: 'Power Electronics',
  employees: 2300,
  tierId: 'large',
  since: daysAgo(210),
  renewsAt: daysFromNow(155),
};

/** Economic model (DIARIO Tablas 1–3) used by the licence dashboard. */
export const economicModel = {
  investmentYear1: 115200,
  yearlyCostFromYear2: 144000,
  newCompaniesPerYear: 3,
  horizonYears: 6,
};

export const progress: CourseProgress[] = [
  {
    userId: 'u-trainee',
    courseId: 'c-hem',
    completedStepIds: ['hem-hw-1', 'hem-hw-2', 'hem-sw-1'],
    failedStepIds: ['hem-hw-4'],
    updatedAt: daysAgo(1),
  },
  { userId: 'u-trainee', courseId: 'c-safety', completedStepIds: ['loto-1'], failedStepIds: [], updatedAt: daysAgo(4) },
  {
    userId: 'u-tech',
    courseId: 'c-hem',
    completedStepIds: [
      'hem-hw-1',
      'hem-hw-2',
      'hem-hw-3',
      'hem-hw-4',
      'hem-sw-1',
      'hem-sw-2',
      'hem-sw-3',
      'hem-mt-1',
      'hem-mt-2',
      'hem-mt-3',
    ],
    failedStepIds: [],
    updatedAt: daysAgo(40),
  },
  { userId: 'u-tech', courseId: 'c-hemk-adv', completedStepIds: ['adv-1', 'adv-2'], failedStepIds: ['adv-4'], updatedAt: daysAgo(3) },
  {
    userId: 'u-jorge',
    courseId: 'c-hem',
    completedStepIds: ['hem-hw-1', 'hem-hw-2', 'hem-hw-3', 'hem-hw-4', 'hem-sw-1'],
    failedStepIds: [],
    updatedAt: daysAgo(8),
  },
  {
    userId: 'u-julia',
    courseId: 'c-safety',
    completedStepIds: ['loto-1', 'loto-2', 'loto-3', 'loto-4'],
    failedStepIds: [],
    updatedAt: daysAgo(12),
  },
];
