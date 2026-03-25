import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProviderData {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    category: { id: string; name: string; slug: string };
    description: string;
    profile_image: string | null;
    portfolio_images: string[];
    is_verified: boolean;
    rating: number;
    tags: string[];
    location: { type: string; coordinates: [number, number] } | null;
    total_documents: number;
    verified_documents: number;
    pending_documents: number;
    rejected_documents: number;
    // ── New fields returned by the updated /me/profile endpoint ──────────────
    completed_jobs: number;   // total count of completed bookings
    member_since: string | null;  // year string e.g. "2023"
}

export interface ProfileUpdatePayload {
    name?:         string;
    phone_number?: string;
    description?:  string;
    category_id?:  string;
    tags?:         string[];
    latitude?:     number;
    longitude?:    number;
}

// ─── Token helper ─────────────────────────────────────────────────────────────

async function getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) throw new Error('Not logged in — please log in first');
    return { Authorization: `Bearer ${token}` };
}

// ─── GET my profile ───────────────────────────────────────────────────────────

/**
 * Fetches the logged-in provider's full profile.
 * Called on ProviderProfileEdit mount to pre-fill all fields.
 *
 * Backend: GET /api/category-search/provider/me/profile
 */
export async function getMyProfile(): Promise<ProviderData> {
    const headers = await getAuthHeader();
    const response = await apiClient.get(
        'category-search/provider/me/profile/',
        { headers }
    );
    return response.data;
}

// ─── PATCH text fields ────────────────────────────────────────────────────────

/**
 * Saves text fields: name, phone, description, skills, location, category.
 * Only the fields you pass will be updated on the backend.
 *
 * Backend: PATCH /api/category-search/provider/me/profile
 */
export async function updateMyProfile(
    payload: ProfileUpdatePayload,
): Promise<{ message: string }> {
    const headers = await getAuthHeader();
    const response = await apiClient.patch(
        'category-search/provider/me/profile/',
        payload,
        { headers }
    );
    return response.data;
}

// ─── Upload profile image ─────────────────────────────────────────────────────

/**
 * Uploads a new profile picture.
 * Pass the local file URI returned by expo-image-picker.
 *
 * Backend: POST /api/category-search/provider/me/profile-image
 */
export async function uploadProfileImage(
    fileUri: string,
): Promise<{ profile_image: string; message: string }> {
    const headers = await getAuthHeader();

    const formData = new FormData();
    formData.append('file', {
        uri:  fileUri,
        name: `profile_${Date.now()}.jpg`,
        type: 'image/jpeg',
    } as any);

    const response = await apiClient.post(
        'category-search/provider/me/profile-image/',
        formData,
        { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
}

// ─── Upload portfolio images ──────────────────────────────────────────────────

/**
 * Uploads one or more portfolio images to Cloudinary.
 *
 * Backend: POST /api/category-search/provider/me/portfolio-images
 */
export async function uploadPortfolioImages(
    fileUris: string[],
): Promise<{ uploaded_urls: string[]; all_portfolio: string[]; message: string }> {
    const headers = await getAuthHeader();

    const formData = new FormData();
    fileUris.forEach((uri, index) => {
        formData.append('files', {
            uri,
            name: `portfolio_${Date.now()}_${index}.jpg`,
            type: 'image/jpeg',
        } as any);
    });

    const response = await apiClient.post(
        'category-search/provider/me/portfolio-images/',
        formData,
        { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
}

// ─── Upload NIC or BR certificate ─────────────────────────────────────────────

/**
 * Uploads NIC images or BR certificate files for admin review (GridFS).
 *
 * documentType: "nic" | "br_certificate"
 *
 * Backend: POST /api/category-search/provider/me/documents
 */
export async function uploadIdentityDocument(
    documentType: 'nic' | 'br_certificate',
    files: { uri: string; name: string; mimeType: string }[],
): Promise<{ uploaded: object[]; message: string }> {
    const headers = await getAuthHeader();

    const formData = new FormData();
    formData.append('document_type', documentType);

    files.forEach(({ uri, name, mimeType }) => {
        formData.append('files', { uri, name, type: mimeType } as any);
    });

    const response = await apiClient.post(
        'category-search/provider/me/documents/',
        formData,
        { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
}

// ─── Existing public function  ─────────────────────────────────────

export async function getProviderById(providerId: string): Promise<ProviderData> {
    const response = await apiClient.get(`category-search/provider/${providerId}/`);
    return response.data;
}
