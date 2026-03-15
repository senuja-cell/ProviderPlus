import apiClient from "./apiClient";


interface Category {
    _id: string;
    name: string;
    slug: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const fetchCategories = async (): Promise<Category[]> => {
    const res = await apiClient.get('/category-search/category-names');
    return res.data;
};

export const signupProvider = async (formData: FormData): Promise<{ access_token: string; provider_id: string }> => {
    const res = await apiClient.post('/auth/provider/signup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export const uploadProfileImage = async (token: string, imageUri: string): Promise<void> => {
    const filename = imageUri.split('/').pop() ?? 'profile.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const fd = new FormData();
    fd.append('file', { uri: imageUri, name: filename, type: mimeType } as any);

    await apiClient.post('/auth/provider/upload-profile-image', fd, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
        },
    });
};
