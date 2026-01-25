import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Lock, Mail, Key, ArrowRight, Loader2 } from 'lucide-react-native';
import { styled } from 'nativewind';
import { useAuth } from '../../lib/auth-context';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben.');
            return;
        }

        setLoading(true);

        try {
            // 1. Call your EXISTING Next.js API
            const response = await fetch('https://compliai.tech/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login fehlgeschlagen');
            }

            // 2. Save session (we simulate a session object here as the API mostly returns message/success)
            // For a real app, you might want your API to return a token or user object.
            // Assuming successful login means we are good to go.

            // Ideally, the API should return user details.
            // If it sets a cookie, that's tricky in React Native without WebView.
            // WORKAROUND: For this MVP, if login is success, we treat user as logged in locally.

            await signIn({ email, name: 'User' }); // Store minimal session

            // Router redirect happens automatically via _layout.tsx

        } catch (error: any) {
            Alert.alert('Login fehlgeschlagen', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-slate-50"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar style="dark" />

                <StyledView className="px-8 w-full max-w-md mx-auto">

                    {/* Header */}
                    <StyledView className="items-center mb-10">
                        <StyledView className="h-16 w-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/30 items-center justify-center mb-6">
                            <Lock color="white" size={28} />
                        </StyledView>
                        <StyledText className="text-3xl font-bold text-slate-900 mb-1">Willkommen.</StyledText>
                        <StyledText className="text-slate-500 text-base">Melden Sie sich an.</StyledText>
                    </StyledView>

                    {/* Inputs */}
                    <StyledView className="space-y-4">
                        <StyledView>
                            <StyledText className="text-slate-700 font-medium mb-1.5 ml-1">E-Mail</StyledText>
                            <StyledView className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14 focus:border-cyan-500">
                                <Mail size={20} color="#64748b" />
                                <StyledTextInput
                                    className="flex-1 ml-3 text-slate-900 text-base h-full"
                                    placeholder="name@firma.de"
                                    placeholderTextColor="#94a3b8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </StyledView>
                        </StyledView>

                        <StyledView>
                            <StyledText className="text-slate-700 font-medium mb-1.5 ml-1">Passwort</StyledText>
                            <StyledView className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 h-14 focus:border-cyan-500">
                                <Key size={20} color="#64748b" />
                                <StyledTextInput
                                    className="flex-1 ml-3 text-slate-900 text-base h-full"
                                    placeholder="••••••••"
                                    placeholderTextColor="#94a3b8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </StyledView>
                        </StyledView>
                    </StyledView>

                    {/* Action Button */}
                    <StyledTouchableOpacity
                        className={`mt-8 bg-slate-900 h-14 rounded-xl flex-row items-center justify-center shadow-lg shadow-slate-900/20 active:scale-95 transition-transform ${loading ? 'opacity-80' : ''}`}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <StyledText className="text-white font-bold text-lg">Laden...</StyledText>
                        ) : (
                            <>
                                <StyledText className="text-white font-bold text-lg mr-2">Login</StyledText>
                                <ArrowRight color="white" size={20} />
                            </>
                        )}
                    </StyledTouchableOpacity>

                    <StyledView className="mt-8 flex-row justify-center">
                        <StyledText className="text-slate-500">Noch kein Konto? </StyledText>
                        <StyledTouchableOpacity onPress={() => {/* Link to web register? */ }}>
                            <StyledText className="text-cyan-600 font-bold">Registrieren</StyledText>
                        </StyledTouchableOpacity>
                    </StyledView>

                </StyledView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
