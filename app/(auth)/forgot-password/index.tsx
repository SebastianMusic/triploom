import { Link } from 'expo-router';

import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { KeyboardScreenView } from '@/components/ui/keyboard-screen-view';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

export default function ForgotPasswordScreen() {
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();

  return (
    <KeyboardScreenView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl }}>
      <Container>
        <Stack space="md">
          <ViewLogo radius={radius.full} backgroundColor={colors.primarySoft} />
          <Card style={{ padding: spacing.md }}>
            <Stack space="sm">
              <AppText variant="title" style={{ textAlign: 'center' }}>Forgot password</AppText>
              <AppText tone="muted" style={{ textAlign: 'center' }}>
                Password reset is not wired yet.
              </AppText>
              <Link href="/(auth)/login" style={{ color: colors.primary, textAlign: 'center', ...typography.body }}>
                Back to sign in
              </Link>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </KeyboardScreenView>
  );
}

function ViewLogo({ radius, backgroundColor }: { radius: number; backgroundColor: string }) {
  return (
    <Card
      style={{
        alignSelf: 'center',
        width: 56,
        height: 56,
        borderRadius: radius,
        backgroundColor,
        padding: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <AppText variant="subtitle" tone="primary">T</AppText>
    </Card>
  );
}
