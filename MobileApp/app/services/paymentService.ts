import apiClient from './apiClient';

// --- TYPES ---
export interface PaymentSheetParams {
    paymentIntent: string;
    ephemeralKey: string;
    customer: string;
}

// --- PAYMENT SERVICE ---
const fetchPaymentSheetParams = async (): Promise<PaymentSheetParams> => {
    const response = await apiClient.post('/payment/payment-sheet');
    return response.data;
};

export default { fetchPaymentSheetParams };