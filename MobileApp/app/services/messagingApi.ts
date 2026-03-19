import apiClient from './apiClient';


// CONVERSATIONS

/**
 * called before opening a chat screen
 * if a conversation betweeen the loggedin user aand this provider already exists, it returns it,
 * if not, it creates one
 * eitheer way you gett back a conversation_id to  usse for everything else
 */

export const getOrCreateConversation = async(
    providerId: string,
    serviceCategory?: string
): Promise<string> => {
    const response = await apiClient.post('/messaging/conversations',
        {
            provider_id: providerId,
            service_category: serviceCategory ?? null
        });
    return response.data.id;
};

/**
 * fetches all conversations for the currently logged in user or  provider
 * used by the conversations list screen
 */
export const getConversations = async(): Promise<any[]> => {
    const response = await apiClient.get('/messaging/conversations');
    return response.data;
};

// MESSAGES

/**
 * loads the full message history for a conversation
 * called when the chat screen opens so  previous messages are shown
 */
export const getMessageHistory = async (conversationId: string): Promise<any[]> => {
    const  response = await apiClient.get(
        `/messaging/conversations/${conversationId}/messages`
    );
    return response.data;
};


/**
 * markss a message as read - triggers tthe 'seen' receipt
 * called when the recipient opens the chat and sees new messages
 */
export const markMessageRead = async(messageId: string): Promise<void> => {
    await apiClient.patch('/messaging/messages/read',  {
        message_id: messageId
    });
};

// push tokens

/**
 * registers the device's expo push token with the backend
 * should be called once when the app starts  up
 * without this, offline  push notifications won't be delivered
 */
export const registerPushToken = async(expoPushToken: string): Promise<void> => {
    await apiClient.post('/messaging/register-token',{
        expo_push_token: expoPushToken
    });
};


// APPOINTMENT ANALYSIS

export interface AppointmentDetails {
    found: boolean;
    date?: string;       // YYYY-MM-DD
    time?: string;       // e.g. "03:00 PM"
    summary?: string;    // short description of the job
}

/**
 * sends the full chat history to the AI for analysis
 * returns extracted appointment details (date, time, job summary)
 * called when the user taps the Confirm button
 */
export const analyzeAppointment = async (messages: string): Promise<AppointmentDetails> => {
    const response = await apiClient.post('/ai-integration/analyze-appointment', { messages });
    return response.data;
};

// BOOKINGS

export interface BookingPayload {
    conversation_id: string;
    provider_id: string;
    date: string;        // YYYY-MM-DD
    time: string;        // HH:MM (24hr)
    summary: string;
    user_latitude?: number;
    user_longitude?: number;
}

export interface BookingResponse {
    booking_id: string;
    status: string;
}

/**
 * creates a booking in the backend
 * called when the user taps "Finalize Booking" in the chat modal
 * returns booking_id and payment details to redirect to the payment screen
 */
export const createBooking = async (payload: BookingPayload): Promise<BookingResponse> => {
    const response = await apiClient.post('/messaging/booking', payload);
    return response.data;
};
