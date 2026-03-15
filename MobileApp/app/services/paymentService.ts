import apiClient from './apiClient';

// --- TYPES ---
export interface PaymentSheetParams {
    paymentIntent: string;
    ephemeralKey: string;
    customer: string;
}

// --- PAYMENT SERVICE ---
export const fetchPaymentSheetParams = async (): Promise<PaymentSheetParams> => {
    const response = await apiClient.post('/payment/payment-sheet');
    return response.data;
};

export const confirmBooking =  async (bookingId: string) => {
    const response  = await apiClient.patch(`/messaging/booking/${bookingId}/confirm`)
    return response.data;
}

