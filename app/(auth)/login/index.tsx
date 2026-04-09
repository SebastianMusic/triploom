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
import { signInSchema } from '@/types/auth.types';
import { useAuthStore } from '@/store/auth.store';

export default function LoginScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);

	const { signIn, isLoading } = useAuthStore();

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
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
		>
			<Text style={styles.title}>Welcome back</Text>
			<Text style={styles.subtitle}>Sign in to Triploom</Text>

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
				textContentType="password"
				placeholderTextColor="#999"
			/>

			{error && <Text style={styles.error}>{error}</Text>}

			<Pressable
				style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
				onPress={handleSignIn}
				disabled={isLoading}
			>
				{isLoading
					? <ActivityIndicator color="#fff" />
					: <Text style={styles.buttonText}>Sign in</Text>
				}
			</Pressable>

			<Link href="/(auth)/signup" style={styles.link}>
				Don't have an account? Sign up
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
