import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext'; // ✏️ adjust path if needed


export function useRoleBack() {
    const router = useRouter();
    const { role } = useAuth();

    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener('hardwareBackPress', () => {
                if (role === 'provider') {
                    router.replace('/(tabs)/ProviderDash'); // ✏️ update if your path differs
                } else {
                    router.replace('/(tabs)');
                }
                return true; // swallow the default back behaviour
            });
            return () => sub.remove();
        }, [role])
    );
}
