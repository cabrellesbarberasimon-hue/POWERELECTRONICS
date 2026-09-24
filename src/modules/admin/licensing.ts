import type { LicenseTier } from '@/types/domain';

export function tierForEmployees(tiers: LicenseTier[], employees: number): LicenseTier {
  const sorted = [...tiers].sort((a, b) => a.minEmployees - b.minEmployees);
  return (
    sorted.find((t) => employees >= t.minEmployees && (t.maxEmployees === null || employees < t.maxEmployees)) ??
    sorted[sorted.length - 1]
  );
}

export interface ProjectionYear {
  year: number;
  companies: number;
  costs: number;
  revenue: number;
  profit: number;
  cumulative: number;
}

/**
 * Reproduces DIARIO Tabla 3: year 1 is development (no revenue); from year 2
 * `newCompaniesPerYear` companies are added each year at `monthlyEur`.
 */
export function projection(opts: {
  investmentYear1: number;
  yearlyCostFromYear2: number;
  newCompaniesPerYear: number;
  monthlyEur: number;
  horizonYears: number;
}): ProjectionYear[] {
  const rows: ProjectionYear[] = [];
  let cumulative = 0;
  for (let year = 1; year <= opts.horizonYears; year++) {
    const companies = year === 1 ? 0 : (year - 1) * opts.newCompaniesPerYear;
    const costs = year === 1 ? opts.investmentYear1 : opts.yearlyCostFromYear2;
    const revenue = companies * opts.monthlyEur * 12;
    const profit = revenue - costs;
    cumulative += profit;
    rows.push({ year, companies, costs, revenue, profit, cumulative });
  }
  return rows;
}

/** First year with non-negative yearly profit, and first year with non-negative cumulative balance. */
export function breakEven(rows: ProjectionYear[]) {
  return {
    yearlyBreakEven: rows.find((r) => r.profit >= 0)?.year ?? null,
    paybackYear: rows.find((r) => r.cumulative >= 0)?.year ?? null,
  };
}
