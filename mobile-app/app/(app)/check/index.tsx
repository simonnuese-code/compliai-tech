import { View, Text } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function CheckScreen() {
    return (
        <StyledView className="flex-1 bg-slate-50 items-center justify-center">
            <SafeAreaView>
                <StyledText className="text-xl font-bold text-slate-900">Neuer Check</StyledText>
                <StyledText className="text-slate-500 mt-2">Funktion folgt...</StyledText>
            </SafeAreaView>
        </StyledView>
    );
}
