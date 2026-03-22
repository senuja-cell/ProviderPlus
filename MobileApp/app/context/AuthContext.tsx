import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Role type — add new roles here ───────────────────────────────────
export type UserRole = 'user' | 'provider' | 'admin' | null;

interface AuthContextType {
    role: UserRole;
    userId: string | null;
    setRole: (role: UserRole) => void;
    signOut: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    role: null,
    userId: null,
    setRole: () => {},
    signOut: () => {},
    isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [role, setRoleState] = useState<UserRole>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount: restore saved role from storage
    useEffect(() => {
        AsyncStorage.multiGet(['userRole', 'userId']).then((pairs) => {
            const savedRole = pairs[0][1] as UserRole;
            const savedUserId = pairs[1][1];
            if (savedRole) setRoleState(savedRole);
            if (savedUserId) setUserId(savedUserId);
            setIsLoading(false);
        });
    }, []);

    const setRole = (newRole: UserRole) => {
        setRoleState(newRole);
        if (newRole) {
            AsyncStorage.setItem('userRole', newRole);
        } else {
            AsyncStorage.removeItem('userRole');
        }
    };

    const signOut = () => {
        setRoleState(null);
        setUserId(null);
        AsyncStorage.multiRemove(['userRole', 'userId', 'auth_token', 'user_data']);
    };

    return (
        <AuthContext.Provider value={{ role, userId, setRole, signOut, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
