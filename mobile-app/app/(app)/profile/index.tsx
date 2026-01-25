import { View, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function ProfileScreen() {
    const { signOut } = useAuth();

    return (
        <StyledView className="flex-1 bg-slate-50 items-center justify-center">
            <SafeAreaView className="items-center">
                <StyledText className="text-xl font-bold text-slate-900 mb-8">Mein Profil</StyledText>

                <StyledTouchableOpacity
                    className="bg-rose-50 px-8 py-3 rounded-full border border-rose-200"
                    onPress={signOut}
                >
                    <StyledText className="text-rose-600 font-bold">Abmelden</StyledText>
                </StyledTouchableOpacity>
            </SafeAreaView>
        </StyledView>
    );
}
