import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
	ActivityIndicator,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { Link } from 'expo-router';
import GeneralCamera from '@/components/camera/general-camera';
import { signUpSchema } from '@/types/auth.types';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';

export default function SignupScreen() {
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [avatarUri, setAvatarUri] = useState<string | null>(null);
	const [showAvatarOptions, setShowAvatarOptions] = useState(false);
	const [showCamera, setShowCamera] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pendingConfirmation, setPendingConfirmation] = useState(false);

	const { signUp, isLoading } = useAuthStore();
	const { saveProfileChanges } = useProfileStore();

	async function handlePickFromLibrary() {
		setShowAvatarOptions(false);
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') return;
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});
		if (!result.canceled && result.assets[0]) {
			setAvatarUri(result.assets[0].uri);
		}
	}

	async function handleSignUp() {
		setError(null);
		const result = signUpSchema.safeParse({ fullName, email, password });
		if (!result.success) {
			setError(result.error.issues[0].message);
			return;
		}
		try {
			const session = await signUp(result.data);
			if (!session) {
				setPendingConfirmation(true);
				return;
			}
			if (avatarUri) {
				await saveProfileChanges({ localImageUri: avatarUri });
			}
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'Sign up failed. Please try again.');
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
		<View style={{ flex: 1 }}>
			<Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
				<GeneralCamera
					onPhotoTaken={(uri) => { setAvatarUri(uri); setShowCamera(false); }}
					onClose={() => setShowCamera(false)}
				/>
			</Modal>

			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					<Text style={styles.title}>Create account</Text>
					<Text style={styles.subtitle}>Join Triploom</Text>

					<View style={styles.avatarContainer}>
						<Pressable
							accessibilityRole="button"
							onPress={() => setShowAvatarOptions(true)}
							style={({ pressed }) => [styles.avatarButton, pressed && { opacity: 0.8 }]}
						>
							{avatarUri ? (
								<Image source={{ uri: avatarUri }} style={styles.avatarImage} />
							) : (
								<View style={styles.avatarPlaceholder}>
									<Ionicons name="person" size={40} color="#bbb" />
								</View>
							)}
							<View style={styles.avatarCameraIcon}>
								<Ionicons name="camera" size={14} color="#fff" />
							</View>
						</Pressable>
						<Text style={styles.avatarLabel}>Profile picture (optional)</Text>
					</View>

					<TextInput
						style={styles.input}
						placeholder="Full name"
						value={fullName}
						onChangeText={setFullName}
						autoCapitalize="words"
						textContentType="name"
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
				</ScrollView>
			</KeyboardAvoidingView>

			{showAvatarOptions && (
				<>
					<Pressable
						style={[StyleSheet.absoluteFill, styles.overlay]}
						onPress={() => setShowAvatarOptions(false)}
					/>
					<View style={styles.sheet}>
						<View style={styles.sheetHandle} />
						<Text style={styles.sheetTitle}>Profile photo</Text>
						<Pressable
							style={({ pressed }) => [styles.sheetOption, pressed && { opacity: 0.6 }]}
							onPress={() => { setShowAvatarOptions(false); setShowCamera(true); }}
						>
							<Ionicons name="camera-outline" size={20} color="#333" />
							<Text style={styles.sheetOptionText}>Take photo</Text>
						</Pressable>
						<Pressable
							style={({ pressed }) => [styles.sheetOption, pressed && { opacity: 0.6 }]}
							onPress={handlePickFromLibrary}
						>
							<Ionicons name="images-outline" size={20} color="#333" />
							<Text style={styles.sheetOptionText}>Choose from library</Text>
						</Pressable>
						<Pressable
							style={({ pressed }) => [styles.sheetOption, pressed && { opacity: 0.6 }]}
							onPress={() => setShowAvatarOptions(false)}
						>
							<Ionicons name="close-outline" size={20} color="#999" />
							<Text style={[styles.sheetOptionText, { color: '#999' }]}>Cancel</Text>
						</Pressable>
					</View>
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
	scrollContent: {
		flexGrow: 1,
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
	avatarContainer: {
		alignItems: 'center',
		marginBottom: 24,
	},
	avatarButton: {
		position: 'relative',
	},
	avatarImage: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: '#f0f0f0',
	},
	avatarPlaceholder: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: '#f0f0f0',
		alignItems: 'center',
		justifyContent: 'center',
	},
	avatarCameraIcon: {
		position: 'absolute',
		right: 2,
		bottom: 2,
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: '#3b82f6',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: '#fff',
	},
	avatarLabel: {
		marginTop: 8,
		fontSize: 12,
		color: '#999',
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
	overlay: {
		backgroundColor: 'rgba(0,0,0,0.4)',
	},
	sheet: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: '#fff',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingTop: 8,
		paddingBottom: 40,
	},
	sheetHandle: {
		alignSelf: 'center',
		width: 38,
		height: 4,
		borderRadius: 2,
		backgroundColor: '#ddd',
		marginBottom: 8,
	},
	sheetTitle: {
		textAlign: 'center',
		fontWeight: '600',
		fontSize: 14,
		paddingBottom: 4,
		color: '#333',
	},
	sheetOption: {
		minHeight: 56,
		paddingHorizontal: 20,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	sheetOptionText: {
		fontSize: 16,
		color: '#333',
	},
});
