
import { StatusBar } from 'expo-status-bar';
import { Text, View, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { styled } from 'nativewind';
import { Lock, ArrowRight } from 'lucide-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function App() {
  return (
    <StyledView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />

      <SafeAreaView className="flex-1 px-6 justify-center">

        {/* Logo Area */}
        <StyledView className="items-center mb-12">
          <StyledView className="h-20 w-20 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-3xl shadow-xl shadow-cyan-500/30 items-center justify-center mb-6">
            <Lock color="white" size={32} strokeWidth={2.5} />
          </StyledView>
          <StyledText className="text-3xl font-bold text-slate-900 mb-2">CompliAI</StyledText>
          <StyledText className="text-slate-500 text-center text-base leading-relaxed">
            Der AI Act Compliance Copilot{'\n'}für die Hosentasche.
          </StyledText>
        </StyledView>

        {/* Buttons */}
        <StyledView className="space-y-4 w-full">
          <StyledTouchableOpacity
            className="bg-slate-900 py-4 rounded-2xl shadow-lg shadow-slate-900/20 flex-row items-center justify-center space-x-2 active:scale-95 transition-transform"
            onPress={() => console.log("Login")}
          >
            <StyledText className="text-white font-bold text-lg">Einloggen</StyledText>
            <ArrowRight color="white" size={20} />
          </StyledTouchableOpacity>

          <StyledTouchableOpacity
            className="bg-white py-4 rounded-2xl border border-slate-200 flex-row items-center justify-center active:scale-95 transition-transform"
            onPress={() => console.log("Register")}
          >
            <StyledText className="text-slate-900 font-bold text-lg">Konto erstellen</StyledText>
          </StyledTouchableOpacity>
        </StyledView>

        <StyledView className="mt-12 items-center">
          <StyledText className="text-slate-400 text-xs text-center">
            Durch die Anmeldung akzeptieren Sie unsere{'\n'}AGB und Datenschutzbestimmungen.
          </StyledText>
        </StyledView>

      </SafeAreaView>
    </StyledView>
  );
}
