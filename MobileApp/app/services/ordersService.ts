import apiClient from '../services/apiClient';


export type Booking = {
    booking_id:    string;
    provider_id:   string;
    provider_name: string;
    category_name: string;
    summary:       string;
    date:          string;
    time:          string;
    status:        'pending' | 'confirmed' | 'completed' | 'cancelled';
    created_at:    string;
    rating?:       number | null;
    review_text?:  string | null;
    rated_at?:     string | null;
};

export const fetchMyBookings = async (): Promise<Booking[]> => {
    const res = await apiClient.get('/messaging/booking/my');
    return res.data;
};

export interface ProviderBooking {
    booking_id: string;
    conversation_id: string;
    user_id: string;
    user_name: string;
    category_name: string;
    summary: string;
    date: string;       // YYYY-MM-DD
    time: string;       // HH:MM
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    created_at: string;
    user_latitude: number | null;
    user_longitude: number | null;
}

export const fetchProviderBookings = async (): Promise<ProviderBooking[]> => {
    const res = await apiClient.get('/messaging/booking/provider');
    return res.data;
};


export const completeBooking = async (bookingId: string): Promise<void> => {
    await apiClient.patch(`/messaging/booking/${bookingId}/complete/`);
};


export async function submitRating(
    bookingId: string,
    payload: { rating: number; review_text?: string },
): Promise<void> {
    await apiClient.post(`bookings/${bookingId}/rate`, payload);
}
