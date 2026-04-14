import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useThemeStore } from '@/store/theme.store';

export default function TripLayout() {
	const router = useRouter();
	const toggleMode = useThemeStore((state) => state.toggleMode);
	const {
		theme: { colors, spacing, radius, typography },
	} = useAppTheme();

	return (
		<Tabs
			screenOptions={{
				headerShown: true,
				headerStyle: {
					backgroundColor: colors.bg,
				},
				headerShadowVisible: false,
				headerTitle: '',
				headerTitleAlign: 'left',
				headerLeft: () => (
					<Pressable
						onPress={() => {
							if (router.canGoBack()) {
								router.back();
								return;
							}
							router.replace('/(app)/(trip)/home');
						}}
						style={{
							marginLeft: spacing.s,
							width: 36,
							height: 36,
							borderRadius: radius.full,
							alignItems: 'center',
							justifyContent: 'center',
						}}>
						<Ionicons name="chevron-back" size={22} color={colors.text} />
					</Pressable>
				),
				headerRight: () => (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s, marginRight: spacing.s }}>
						<Pressable
							onPress={toggleMode}
							style={{
								width: 36,
								height: 36,
								borderRadius: radius.full,
								alignItems: 'center',
								justifyContent: 'center',
								borderWidth: 1,
								borderColor: colors.borderMuted,
								backgroundColor: colors.bgLight,
							}}>
							<Ionicons name="contrast-outline" size={18} color={colors.textMuted} />
						</Pressable>
						<Pressable
							onPress={() => router.push('/(app)/(trip)/profile')}
							style={{
								width: 36,
								height: 36,
								borderRadius: radius.full,
								alignItems: 'center',
								justifyContent: 'center',
								borderWidth: 1,
								borderColor: colors.borderMuted,
								backgroundColor: colors.bgLight,
							}}>
							<Ionicons name="person-outline" size={18} color={colors.textMuted} />
						</Pressable>
					</View>
				),
				tabBarStyle: {
					backgroundColor: colors.bg,
					borderTopColor: colors.border,
					borderTopWidth: 1,
					height: 66,
					paddingBottom: 10,
					paddingTop: 10,
				},
				tabBarActiveTintColor: colors.secondary,
				tabBarInactiveTintColor: colors.textMuted,
				tabBarShowLabel: false,
				tabBarItemStyle: {
					paddingHorizontal: 6,
				},
			}}>
			<Tabs.Screen
				name="home/index"
				options={{
					title: 'Home',
					tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={20} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="events/index"
				options={{
					title: 'Events',
					tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={20} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="tasks/index"
				options={{
					title: 'Tasks',
					tabBarIcon: ({ color }) => <Ionicons name="checkmark-done-outline" size={20} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="chat/index"
				options={{
					title: 'Chat',
					tabBarIcon: ({ color }) => <Ionicons name="chatbubble-outline" size={20} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="profile/index"
				options={{
					href: null,
				}}
			/>
		</Tabs>
	);
}
