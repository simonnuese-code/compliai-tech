import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { View, ActivityIndicator } from 'react-native';

function RootLayoutNav() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            // If user is not signed in and not in auth group, redirect to login
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            // If user is signed in but in auth group, redirect to dashboard
            router.replace('/(app)/dashboard');
        }
    }, [user, segments, isLoading]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', items: 'center' }}>
                <ActivityIndicator size="large" color="#0891b2" />
            </View>
        );
    }

    return <Slot />;
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
