import { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	ActivityIndicator,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { signUpSchema } from '@/types/auth.types';
import { useAuthStore } from '@/store/auth.store';

export default function SignupScreen() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pendingConfirmation, setPendingConfirmation] = useState(false);

	const { signUp, isLoading } = useAuthStore();

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
			<View style={styles.container}>
				<Text style={styles.title}>Check your email</Text>
				<Text style={styles.subtitle}>
					We sent a confirmation link to {email}.{'\n'}
					Click it to activate your account.
				</Text>
				<Link href="/(auth)/login" style={styles.link}>
					Back to sign in
				</Link>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
		>
			<Text style={styles.title}>Create account</Text>
			<Text style={styles.subtitle}>Join Triploom</Text>

			<TextInput
				style={styles.input}
				placeholder="Username"
				value={username}
				onChangeText={setUsername}
				autoCapitalize="none"
				textContentType="username"
				placeholderTextColor="#999"
			/>
			<TextInput
				style={styles.input}
				placeholder="Email"
				value={email}
				onChangeText={setEmail}
				autoCapitalize="none"
				keyboardType="email-address"
				textContentType="emailAddress"
				placeholderTextColor="#999"
			/>
			<TextInput
				style={styles.input}
				placeholder="Password"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
				textContentType="newPassword"
				placeholderTextColor="#999"
			/>

			{error && <Text style={styles.error}>{error}</Text>}

			<Pressable
				style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
				onPress={handleSignUp}
				disabled={isLoading}
			>
				{isLoading
					? <ActivityIndicator color="#fff" />
					: <Text style={styles.buttonText}>Create account</Text>
				}
			</Pressable>

			<Link href="/(auth)/login" style={styles.link}>
				Already have an account? Sign in
			</Link>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: '#666',
		marginBottom: 32,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		marginBottom: 12,
		backgroundColor: '#fff',
		color: '#000',
	},
	error: {
		color: '#e53e3e',
		fontSize: 14,
		marginBottom: 12,
	},
	button: {
		backgroundColor: '#3b82f6',
		borderRadius: 8,
		padding: 14,
		alignItems: 'center',
		marginTop: 4,
	},
	buttonPressed: {
		opacity: 0.8,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	link: {
		textAlign: 'center',
		marginTop: 20,
		color: '#3b82f6',
		fontSize: 14,
	},
});
