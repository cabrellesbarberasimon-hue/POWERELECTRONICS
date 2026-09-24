import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { economicModel } from '@/data/admin';
import { useLicense, useSetEmployees, useUpdateTierPrice } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { breakEven, projection } from '@/modules/admin/licensing';
import { ProfitChart } from '@/modules/admin/ProfitChart';
import { Card, Header, Loading, Screen, SectionTitle } from '@/shared/components';
import { useUser } from '@/stores/session';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';
import type { LicenseTier } from '@/types/domain';

/** Licence tiers (0-500 / 500-1500 / >1500) and the economic model of DIARIO Tablas 1-3. */
export default function License() {
  const { t, formatEur, formatDate } = useI18n();
  const me = useUser();
  const { width } = useWindowDimensions();
  const license = useLicense();
  const updatePrice = useUpdateTierPrice();
  const setEmployees = useSetEmployees();
  const [employees, setEmployeesText] = useState('');

  useEffect(() => {
    if (license.data) setEmployeesText(String(license.data.license.employees));
  }, [license.data]);

  if (me.role !== 'admin') return <Redirect href="/admin" />;
  if (!license.data) return <Loading />;
  const { tiers, license: lic } = license.data;
  const current = tiers.find((x) => x.id === lic.tierId)!;
  const large = tiers.find((x) => x.id === 'large')!;
  const rows = projection({ ...economicModel, monthlyEur: large.monthlyEur });
  const be = breakEven(rows);
  const range = (tier: LicenseTier) => (tier.maxEmployees === null ? `> ${tier.minEmployees}` : `${tier.minEmployees}–${tier.maxEmployees}`);

  return (
    <Screen header={<Header title={t('admin.license')} />}>
      <Card style={styles.current}>
        <Text style={styles.company}>{lic.company}</Text>
        <Text style={styles.muted}>{t('admin.renews', { date: formatDate(lic.renewsAt) })}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t('admin.employees')}</Text>
          <TextInput
            value={employees}
            onChangeText={setEmployeesText}
            onEndEditing={() => setEmployees.mutate(Number(employees) || 1)}
            onBlur={() => setEmployees.mutate(Number(employees) || 1)}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('admin.currentTier')}</Text>
          <Text style={styles.value}>{range(current)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('admin.monthly')}</Text>
          <Text style={styles.value}>{formatEur(current.monthlyEur)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('admin.yearly')}</Text>
          <Text style={styles.value}>{formatEur(current.monthlyEur * 12)}</Text>
        </View>
      </Card>

      <SectionTitle>{t('admin.tiers')}</SectionTitle>
      {tiers.map((tier) => (
        <TierRow key={tier.id} tier={tier} active={tier.id === current.id} label={range(tier)} onSave={(v) => updatePrice.mutate({ tierId: tier.id, monthlyEur: v })} />
      ))}
      <Text style={styles.note}>{t('admin.placeholderPrices')}</Text>

      <SectionTitle>{t('admin.projection')}</SectionTitle>
      <ProfitChart rows={rows} width={width - spacing.lg * 2} />
      <Text style={styles.breakEven}>{t('admin.breakEven', { yearly: be.yearlyBreakEven ?? '—', payback: be.paybackYear ?? '—' })}</Text>

      <View style={styles.table}>
        <View style={[styles.tr, styles.th]}>
          {[t('admin.year'), t('admin.companies'), t('admin.revenue'), t('admin.profit'), t('admin.cumulative')].map((h) => (
            <Text key={h} style={[styles.td, styles.thText]}>
              {h}
            </Text>
          ))}
        </View>
        {rows.map((r) => (
          <View key={r.year} style={styles.tr}>
            <Text style={styles.td}>{r.year}</Text>
            <Text style={styles.td}>{r.companies}</Text>
            <Text style={styles.td}>{Math.round(r.revenue / 1000)}k</Text>
            <Text style={styles.td}>{Math.round(r.profit / 1000)}k</Text>
            <Text style={[styles.td, { fontFamily: fonts.semibold }]}>{Math.round(r.cumulative / 1000)}k</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function TierRow({ tier, active, label, onSave }: { tier: LicenseTier; active: boolean; label: string; onSave: (v: number) => void }) {
  const { t } = useI18n();
  const [value, setValue] = useState(String(tier.monthlyEur));
  const commit = () => {
    const v = Number(value);
    if (!Number.isNaN(v) && v !== tier.monthlyEur) onSave(v);
  };
  return (
    <View style={[styles.tier, active && styles.tierOn]}>
      <Text style={styles.tierRange}>{label}</Text>
      <TextInput value={value} onChangeText={setValue} onEndEditing={commit} onBlur={commit} keyboardType="number-pad" style={[styles.input, { width: 90 }]} accessibilityLabel={`${label} €`} />
      <Text style={styles.muted}>{t('admin.perMonth')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  current: { gap: spacing.sm },
  company: { fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.navy },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  value: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, height: 36, minWidth: 90, textAlign: 'right', fontFamily: fonts.medium },
  tier: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  tierOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  tierRange: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  note: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, fontStyle: 'italic' },
  breakEven: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.navy, marginVertical: spacing.md },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#F0F0F0' },
  th: { backgroundColor: colors.surfaceAlt },
  td: { flex: 1, paddingVertical: 6, paddingHorizontal: 4, fontFamily: fonts.regular, fontSize: 11, color: colors.text, textAlign: 'center' },
  thText: { fontFamily: fonts.semibold, color: colors.textMuted },
});
