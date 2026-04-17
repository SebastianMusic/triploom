import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';

import { TripTabBar } from '@/components/layout/trip-tab-bar';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useProfileStore } from '@/store/profile.store';
import { useThemeStore } from '@/store/theme.store';

export default function TripLayout() {
	const router = useRouter();
	const toggleMode = useThemeStore((state) => state.toggleMode);
	const setSelectedTrip = useProfileStore((state) => state.setSelectedTrip);
	const {
		theme: { colors, spacing, radius },
	} = useAppTheme();
	const navButtonSize = spacing.l + spacing.s / 2;
	const backIconSize = spacing.m;
	const actionIconSize = radius.m;
	const tabIconSize = radius.m;
	const headerHeight = spacing.xl + spacing.m + spacing.s / 2;

	return (
		<Tabs
			tabBar={(props) => <TripTabBar {...props} />}
			screenOptions={{
				headerShown: true,
				sceneStyle: {
					backgroundColor: colors.bg,
				},
				headerStyle: {
					backgroundColor: colors.bg,
					height: headerHeight,
					shadowColor: colors.shadow,
					shadowOpacity: 0.12,
					shadowRadius: 14,
					shadowOffset: { width: 0, height: 8 },
					elevation: 6,
				},
				headerShadowVisible: true,
				headerTitle: '',
				headerTitleAlign: 'left',
				headerLeftContainerStyle: {
					paddingLeft: spacing.m,
					paddingTop: spacing.s,
				},
				headerLeft: () => (
					<Pressable
						onPress={async () => {
							await setSelectedTrip(null);
							router.replace('/(app)/(no-trip)');
						}}
						style={{
							marginLeft: spacing.s / 3,
							width: navButtonSize,
							height: navButtonSize,
							borderRadius: radius.full,
							alignItems: 'center',
							justifyContent: 'center',
						}}>
							<Ionicons name="chevron-back" size={backIconSize} color={colors.text} />
						</Pressable>
				),
				headerRightContainerStyle: {
					paddingRight: spacing.m,
					paddingTop: spacing.s,
				},
				headerRight: () => (
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
						<Pressable
							onPress={toggleMode}
							style={{
								width: navButtonSize,
								height: navButtonSize,
								borderRadius: radius.full,
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: colors.bgLight,
							}}>
							<Ionicons name="contrast-outline" size={actionIconSize} color={colors.textMuted} />
						</Pressable>
						<Pressable
							onPress={() => router.push('/(app)/(trip)/profile')}
							style={{
								width: navButtonSize,
								height: navButtonSize,
								borderRadius: radius.full,
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: colors.bgLight,
							}}>
							<Ionicons name="person-outline" size={actionIconSize} color={colors.textMuted} />
						</Pressable>
					</View>
				),
				tabBarActiveTintColor: colors.secondary,
				tabBarInactiveTintColor: colors.textMuted,
				tabBarShowLabel: false,
			}}>
			<Tabs.Screen
				name="home/index"
				options={{
					title: 'Home',
					tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={tabIconSize} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="events/index"
				options={{
					title: 'Events',
					tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={tabIconSize} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="tasks/index"
				options={{
					title: 'Tasks',
					tabBarIcon: ({ color }) => <Ionicons name="checkmark-done-outline" size={tabIconSize} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="chat/index"
				options={{
					title: 'Chat',
					tabBarIcon: ({ color }) => <Ionicons name="chatbubble-outline" size={tabIconSize} color={color} />,
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
