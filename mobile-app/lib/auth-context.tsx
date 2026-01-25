import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

type AuthType = {
    user: any | null;
    signIn: (data: any) => Promise<void>;
    signOut: () => void;
    isLoading: boolean;
};

const AuthContext = createContext<AuthType>({
    user: null,
    signIn: async () => { },
    signOut: () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored session on app start
        checkSession();
    }, []);

    async function checkSession() {
        try {
            const session = await SecureStore.getItemAsync('session');
            if (session) {
                setUser(JSON.parse(session));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    async function signIn(userData: any) {
        setUser(userData);
        await SecureStore.setItemAsync('session', JSON.stringify(userData));
    }

    function signOut() {
        setUser(null);
        SecureStore.deleteItemAsync('session');
    }

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
