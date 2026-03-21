import apiClient from './apiClient';

// ── Get current user profile ──────────────────────────────────────────
export const getUserProfile = async () => {
    try {
        const response = await apiClient.get('/auth/me');
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.error || 'Failed to get profile'
        );
    }
};

// ── Update current user profile ───────────────────────────────────────
export const updateUserProfile = async (updateData: {
    full_name?: string;
    phone_number?: string;
    birthday?: string;
    gender?: string;
}) => {
    try {
        const response = await apiClient.put('/auth/me', updateData);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.error || 'Failed to update profile'
        );
    }
};