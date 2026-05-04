import { useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { signInSchema } from '@/types/auth.types';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { KeyboardScreenView } from '@/components/ui/keyboard-screen-view';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);

	const { signIn, isLoading } = useAuthStore();
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();

	async function handleSignIn() {
		setError(null);

		const result = signInSchema.safeParse({ email, password });
		if (!result.success) {
			setError(result.error.issues[0].message);
			return;
		}

		try {
			await signIn(result.data);
		} catch (e: any) {
			setError(e?.message ?? 'Sign in failed. Please try again.');
		}
	}

	return (
		<KeyboardScreenView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl }}>
      <Container>
        <Stack space="md">
          <View style={{ gap: spacing.xs, alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radius.full,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <AppText variant="subtitle" tone="primary">T</AppText>
            </View>
            <AppText variant="title" style={{ textAlign: 'center' }}>Welcome back</AppText>
            <AppText tone="muted" style={{ textAlign: 'center' }}>Sign in to continue your trip</AppText>
          </View>

          <Card style={{ padding: spacing.md }}>
            <Stack space="sm">
              <Input
                label="Email"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <Input
                label="Password"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
              />

              {error ? <AppText tone="error">{error}</AppText> : null}

              <Button label="Sign in" fullWidth loading={isLoading} onPress={handleSignIn} />
            </Stack>
          </Card>

          <Link href="/(auth)/signup" style={{ color: colors.primary, textAlign: 'center', ...typography.body }}>
            Don&apos;t have an account? Sign up
          </Link>
        </Stack>
      </Container>
		</KeyboardScreenView>
	);
}
