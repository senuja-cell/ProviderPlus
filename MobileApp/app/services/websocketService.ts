import AsyncStorage from '@react-native-async-storage/async-storage';
import {LAPTOP_IP} from './apiClient'

const IS_LOCAL = false;

const WS_BASE_URL = IS_LOCAL
    ? `ws://${LAPTOP_IP}:8001/api/messaging/ws`
    : `wss://providerplus-production.up.railway.app/api/messaging/ws`;

// TYPES
export interface Message{
    id: string;
    conversation_id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    sent_at: string;
    delivered: boolean;
    read_at: string | null;
}


// WEBSOCKET SERVICE CLASS
class WebSocketService {
    private socket: WebSocket | null = null;
    private conversationId: string | null = null;
    private onMessageCallback: ((message: Message) => void) | null = null;
    private onConnectedCallback: (() => void) | null = null;
    private onDisconnectedCallback: (() => void) | null = null;

    /**
     * opens a websocket connection for a specific conversation
     * how it works:
     * 1. reads the JWT from asyncstorage (same token your HTTP calls use)
     * 2. builds the websocket URl with the conversation ID and  token as a query parameter
     * 3. opens the connection and sets up listeners for incoming  messages
     *
     * @param conversationId - the conversation to connect to
     * @param onMessage      - callback fired every time a new message arrives
     * @param onConnected    - callback fired when connection is established
     * @param onDisconnected - callback fired when connection closses
     */

    async connect(
        conversationId: string,
        onMessage: (message: Message) => void,
        onConnected?: () => void,
        onDisconnected?: () => void
    ){
        // if already connected to this conversation, do nothing
        if(this.socket && this.conversationId === conversationId)
            return;

        // clean up any existing connection first
        this.disconnect();

        // read the JWT token from storage
        const token = await AsyncStorage.getItem('auth_token');
        // TODO: this should trigger a sign in/signup prompt and probably link to the login page
        if(!token){
            console.error(`[WS] no auth  token found - cannot connect`);
            return;
        }

        this.conversationId = conversationId;
        this.onMessageCallback = onMessage;
        this.onConnectedCallback = onConnected ?? null;
        this.onDisconnectedCallback = onDisconnected ?? null;

        // build the websocket URL - token goes as a query parameter because websocket clients can't
        // send authorization headers like HTTP can
        const url = `${WS_BASE_URL}/${conversationId}?token=${token}`;

        console.log(`[WS] connecting to: `, url);
        this.socket = new WebSocket(url);

        // fired when the connection is successfully established
        this.socket.onopen = () => {
            console.log('[WS] connected to conversation: ', conversationId);
            this.onConnectedCallback?.();
        }

        // fired every time the server pushes a new message to us
        this.socket.onmessage = (event) => {
            try{
                const message: Message = JSON.parse(event.data);
                console.log('[WS] new message received: ', message);
                this.onMessageCallback?.(message);
            }
            catch(error){
                console.error('[WS] failed to parse incoming message: ', error);
            }
        };

        // fired when the connection closes - either we closed it or the server disconnected
        this.socket.onclose = (event) => {
            console.log('[WS] disconnected. code: ', event.code);
            this.onDisconnectedCallback?.();
            this.socket = null;
        };

        // fired if something goes wrong with the connection
        this.socket.onerror = (error) => {
            console.error('[WS] connection error: ', error);
        }

    }

    /**
     * sends a message through the open websocket connection
     * the backend expoexts JSON with a content field - matching the MessageCreate schema
     */
    sendMessage(content: string){
        if(!this.socket || this.socket.readyState !== WebSocket.OPEN){
            console.error('[WS] cannot send. socket is not open');
            return;
        }

        const payload = JSON.stringify({ content });
        this.socket.send(payload);
        console.log('[WS] message sent: ', content);
    }


    /**
     * coses the websocket connection cleanly
     * called when the user leaves the chat screen
     * this is what marks the user as offline on the server
     */

    disconnect(){
        if(this.socket){
            this.socket.close();
            this.socket = null;
            this.conversationId = null;
            console.log('[WS] connection closed');
        }
    };

    /**
     * returns true if the socket is currently open and ready
     * can be used by the UI to show a connection status indicator
     */

    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }
}

export const wsService = new WebSocketService();
