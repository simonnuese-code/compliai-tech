import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { styled } from 'nativewind';
import { Shield, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function Dashboard() {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    // Mock data fetching
    const onRefresh = async () => {
        setRefreshing(true);
        // Here we would fetch real stats from /api/dashboard
        setTimeout(() => setRefreshing(false), 2000);
    };

    return (
        <StyledView className="flex-1 bg-slate-50">
            <StatusBar style="dark" />
            <SafeAreaView edges={['top']} className="flex-1">
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0891b2" />
                    }
                >

                    {/* Header */}
                    <StyledView className="px-6 py-6 flex-row justify-between items-center">
                        <StyledView>
                            <StyledText className="text-slate-500 font-medium text-sm">Cockpit</StyledText>
                            <StyledText className="text-2xl font-bold text-slate-900">Überblick</StyledText>
                        </StyledView>
                        <StyledView className="h-10 w-10 bg-slate-200 rounded-full items-center justify-center border border-white shadow-sm">
                            <StyledText className="font-bold text-slate-600">
                                {(user?.email || 'U').charAt(0).toUpperCase()}
                            </StyledText>
                        </StyledView>
                    </StyledView>

                    {/* AI Act Status Card */}
                    <StyledView className="mx-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-900/20 mb-8">
                        <StyledView className="flex-row items-start justify-between mb-4">
                            <StyledView className="bg-white/10 p-2.5 rounded-xl">
                                <Shield color="white" size={24} />
                            </StyledView>
                            <StyledView className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                                <StyledText className="text-emerald-400 text-xs font-bold">LIVE</StyledText>
                            </StyledView>
                        </StyledView>
                        <StyledText className="text-white text-lg font-bold mb-1">EU AI Act Status</StyledText>
                        <StyledText className="text-slate-400 text-sm leading-relaxed mb-4">
                            Ihr Compliance-Status wird basierend auf Ihren Checks berechnet. Aktuell liegen keine kritischen Risiken vor.
                        </StyledText>

                        <StyledView className="bg-white/5 rounded-xl p-3 flex-row items-center space-x-3">
                            <CheckCircle2 color="#34d399" size={20} />
                            <StyledText className="text-white font-medium text-sm">Alles im grünen Bereich</StyledText>
                        </StyledView>
                    </StyledView>

                    {/* Stats Grid */}
                    <StyledText className="mx-6 text-slate-900 font-bold text-lg mb-4">Statistiken</StyledText>
                    <StyledView className="mx-6 flex-row space-x-4 mb-8">
                        <StyledView className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 items-center">
                            <StyledText className="text-3xl font-bold text-slate-900 mb-1">0</StyledText>
                            <StyledText className="text-slate-500 text-xs text-center font-medium">Offene Checks</StyledText>
                        </StyledView>
                        <StyledView className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 items-center">
                            <StyledText className="text-3xl font-bold text-emerald-600 mb-1">0</StyledText>
                            <StyledText className="text-slate-500 text-xs text-center font-medium">Konform</StyledText>
                        </StyledView>
                    </StyledView>

                    {/* Promo / Action */}
                    <StyledView className="mx-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex-row items-center space-x-4">
                        <StyledView className="h-12 w-12 bg-cyan-50 rounded-full items-center justify-center">
                            <Sparkles color="#0891b2" size={24} />
                        </StyledView>
                        <StyledView className="flex-1">
                            <StyledText className="font-bold text-slate-900 text-base">Neuen Check starten</StyledText>
                            <StyledText className="text-slate-500 text-xs mt-0.5">Prüfen Sie ein neues KI-System in {'<'} 2 Min.</StyledText>
                        </StyledView>
                    </StyledView>

                </ScrollView>
            </SafeAreaView>
        </StyledView>
    );
}
