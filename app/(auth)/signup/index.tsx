import { useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { signUpSchema } from '@/types/auth.types';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { KeyboardScreenView } from '@/components/ui/keyboard-screen-view';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

export default function SignupScreen() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pendingConfirmation, setPendingConfirmation] = useState(false);

	const { signUp, isLoading } = useAuthStore();
  const {
    theme: { colors, spacing, typography },
  } = useAppTheme();

	async function handleSignUp() {
		setError(null);

		const result = signUpSchema.safeParse({ username, email, password });
		if (!result.success) {
			setError(result.error.issues[0].message);
			return;
		}

		try {
			const session = await signUp(result.data);
			// If session is null, Supabase requires email confirmation before sign-in
			if (!session) setPendingConfirmation(true);
		} catch (e: any) {
			setError(e?.message ?? 'Sign up failed. Please try again.');
		}
	}

	if (pendingConfirmation) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', padding: spacing.md, backgroundColor: colors.background }}>
				<AppText variant="title">Check your email</AppText>
				<AppText tone="muted">
					We sent a confirmation link to {email}.{'\n'}
					Click it to activate your account.
				</AppText>
				<Link href="/(auth)/login" style={{ color: colors.primary, textAlign: 'center', marginTop: spacing.md, ...typography.body }}>
					Back to sign in
				</Link>
			</View>
		);
	}

	return (
		<KeyboardScreenView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl }}>
      <Container>
        <Stack space="sm">
          <View style={{ gap: spacing.xs }}>
            <AppText variant="title">Create account</AppText>
            <AppText tone="muted">Join Triploom</AppText>
          </View>

          <Input
            label="Username"
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            textContentType="username"
          />
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
            textContentType="newPassword"
          />

          {error ? <AppText tone="error">{error}</AppText> : null}

          <Button label="Create account" fullWidth loading={isLoading} onPress={handleSignUp} />

          <Link href="/(auth)/login" style={{ color: colors.primary, textAlign: 'center', ...typography.body }}>
            Already have an account? Sign in
          </Link>
        </Stack>
      </Container>
		</KeyboardScreenView>
	);
}
