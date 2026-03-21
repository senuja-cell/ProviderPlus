import apiClient from './apiClient';
import * as FileSystem from 'expo-file-system/legacy';


// Get pending providers
export const getPendingProviders = async () => {
    try {
        const response = await apiClient.get(`/admin/providers/pending`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching pending providers:', error);
        throw error;
    }
};

// Get provider details
export const getProviderDetails = async (providerId: string) => {
    try {
        const response = await apiClient.get(`/admin/providers/${providerId}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching provider details:', error);
        throw error;
    }
};

// Get document URL for viewing - returns full URL for Linking.openURL
export const getDocumentUrl = async (providerId: string, fileId: string): Promise<string> => {
    const baseURL = apiClient.defaults.baseURL || 'http://192.168.1.5:8001/api';
    const remoteUrl = `${baseURL}/admin/providers/${providerId}/documents/${fileId}`;
    const localUri = FileSystem.cacheDirectory + `doc_${fileId}.pdf`;

    const result = await FileSystem.downloadAsync(remoteUrl, localUri);

    if (result.status !== 200) {
        throw new Error(`Failed to download document: ${result.status}`);
    }

    return result.uri;
};

// Verify a document
export const verifyDocument = async (providerId: string, documentIndex: number) => {
    try {
        const response = await apiClient.put(
            `/admin/providers/${providerId}/verify-document`,
            {
                document_index: documentIndex,
                action: 'verify'
            }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error verifying document:', error);
        throw error;
    }
};

// Reject a document
export const rejectDocument = async (providerId: string, documentIndex: number, reason: string) => {
    try {
        const response = await apiClient.put(
            `/admin/providers/${providerId}/verify-document`,
            {
                document_index: documentIndex,
                action: 'reject',
                rejection_reason: reason
            }
        );
        return response.data;
    } catch (error: any) {
        console.error('Error rejecting document:', error);
        throw error;
    }
};

// Approve provider
export const approveProvider = async (providerId: string) => {
    try {
        const response = await apiClient.put(
            `/admin/providers/${providerId}/approve`,
            {}
        );
        return response.data;
    } catch (error: any) {
        console.error('Error approving provider:', error);
        throw error;
    }
};
