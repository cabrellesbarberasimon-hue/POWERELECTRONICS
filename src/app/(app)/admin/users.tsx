import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSetUserRole, useUsers } from '@/hooks/api';
import { useI18n } from '@/i18n';
import { Avatar, Chip, Header, Loading, Screen, toast } from '@/shared/components';
import { useSession, useUser } from '@/stores/session';
import { colors, fonts, fontSize, spacing } from '@/theme';
import type { Role } from '@/types/domain';

const ROLES: Role[] = ['employee', 'sat', 'instructor', 'admin'];

export default function AdminUsers() {
  const { t } = useI18n();
  const me = useUser();
  const users = useUsers();
  const setRole = useSetUserRole();
  const setSessionUser = useSession((s) => s.setUser);
  if (me.role !== 'admin') return <Redirect href="/admin" />;
  if (!users.data) return <Loading />;

  return (
    <Screen header={<Header title={t('admin.users')} />}>
      {users.data.map((u) => (
        <View key={u.id} style={styles.row}>
          <View style={styles.head}>
            <Avatar user={u} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.name}</Text>
              <Text style={styles.meta}>
                @{u.username} · {u.department} · {u.country}
              </Text>
            </View>
          </View>
          <View style={styles.roles}>
            {ROLES.map((r) => (
              <Chip
                key={r}
                label={t(`roles.${r}`)}
                active={u.role === r}
                onPress={() =>
                  setRole.mutate(
                    { userId: u.id, role: r },
                    {
                      onSuccess: (updated) => {
                        if (updated.id === me.id) setSessionUser(updated);
                        toast(`${u.name}: ${t(`roles.${r}`)}`, 'success');
                      },
                    },
                  )
                }
              />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: '#F0F0F0', gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
