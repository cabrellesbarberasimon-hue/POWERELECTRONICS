import { licenseTiers, economicModel } from '@/data/admin';
import { breakEven, projection, tierForEmployees } from '@/modules/admin/licensing';

describe('licensing', () => {
  it('maps employees to tiers (0-500, 500-1500, >1500)', () => {
    expect(tierForEmployees(licenseTiers, 120).id).toBe('small');
    expect(tierForEmployees(licenseTiers, 500).id).toBe('medium');
    expect(tierForEmployees(licenseTiers, 1500).id).toBe('large');
    expect(tierForEmployees(licenseTiers, 25000).id).toBe('large');
  });

  it('reproduces DIARIO Tabla 3 at 2,000 €/month', () => {
    const rows = projection({ ...economicModel, monthlyEur: 2000 });
    expect(rows.map((r) => r.revenue)).toEqual([0, 72000, 144000, 216000, 288000, 360000]);
    expect(rows.map((r) => r.profit)).toEqual([-115200, -72000, 0, 72000, 144000, 216000]);
    // The document says the investment is recovered in year 3; that is only
    // the yearly break-even. Cumulative payback happens in year 5.
    expect(breakEven(rows)).toEqual({ yearlyBreakEven: 3, paybackYear: 5 });
  });
});
