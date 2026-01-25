import { Tabs } from 'expo-router';
import { Home, LayoutDashboard, User, ShieldCheck } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function AppLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#e2e8f0',
                    height: Platform.OS === 'ios' ? 90 : 70,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: '#0891b2', // Cyan-600
                tabBarInactiveTintColor: '#94a3b8', // Slate-400
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                    marginTop: 2,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Cockpit',
                    tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="check"
                options={{
                    title: 'Check',
                    tabBarIcon: ({ active }) => (
                        <ShieldCheck
                            size={28}
                            color={active ? '#0891b2' : '#94a3b8'}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
