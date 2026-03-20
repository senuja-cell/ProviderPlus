import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export function useBlockBack() {
    useFocusEffect(
        useCallback(() => {
            // Intercept Android hardware back button — return true = swallow the event
            const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
            return () => sub.remove();
        }, [])
    );
}
