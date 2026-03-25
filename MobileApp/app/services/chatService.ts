import apiClient from './apiClient'

interface ChatResponse{
    ai_reply: string;
    providers: any[];
    needs_clarification: boolean;
    clarification_question: string | null;
    search_debug: any;
}


export const sendChatMessage = async (
    userText: string, history: string | null = null
): Promise<ChatResponse> => {
    try{
        console.log("sending message");
        const response = await apiClient.post('/ai-chat/', {
            user_text: userText,
            context_history: history,
        });
        console.log("message received");
        return response.data;
    }
    catch(error){
        console.error("Bridge Error: ", error);
        throw error;
    }
}
