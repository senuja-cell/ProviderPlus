import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { wsService, Message } from './services/websocketService';
import { getMessageHistory, markMessageRead } from './services/messagingApi';

// ---------------------------------------------------------------------------
// TEMPORARY TEST CONSTANT
// Replace this with your actual conversation ID from the Postman test
// This will be removed once the conversations list screen is built
// ---------------------------------------------------------------------------
const TEST_CONVERSATION_ID = '699da706c18f47b24fab4d23';

const ProviderChat = () => {
    const router = useRouter();

    // ---------------------------------------------------------------------------
    // In the future these will come from Expo Router params like:
    // const { conversationId, providerName, providerRole } = useLocalSearchParams();
    // For now we use the test constant above
    // ---------------------------------------------------------------------------
    const conversationId = TEST_CONVERSATION_ID;
    const providerName = 'Nimal';
    const providerRole = 'Plumber';

    // ---------------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------------
    const [messages, setMessages] = useState<Message[]>([]);   // All messages in the thread
    const [inputText, setInputText] = useState('');             // What the user is typing
    const [isLoading, setIsLoading] = useState(true);          // Show spinner while loading history
    const [isConnected, setIsConnected] = useState(false);     // WebSocket connection status
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); // To tell sent vs received

    const scrollViewRef = useRef<ScrollView>(null);  // Used to auto-scroll to the latest message

    // ---------------------------------------------------------------------------
    // On screen open — load history + connect WebSocket
    // ---------------------------------------------------------------------------
    useEffect(() => {
        setupChat();

        // On screen close — disconnect WebSocket cleanly
        // This marks the user as offline on the server
        return () => {
            wsService.disconnect();
        };
    }, []);

    const setupChat = async () => {
        // Get the current user's ID from storage so we know which messages are "ours"
        const userId = await AsyncStorage.getItem('user_id');
        setCurrentUserId(userId);

        // Step 1 — Load message history from the backend
        try {
            const history = await getMessageHistory(conversationId);
            setMessages(history);
        } catch (error) {
            console.error('Failed to load message history:', error);
        } finally {
            setIsLoading(false);
        }

        // Step 2 — Connect to WebSocket for real-time delivery
        await wsService.connect(
            conversationId,

            // Called every time a new message arrives through the WebSocket
            (newMessage: Message) => {
                setMessages(prev => [...prev, newMessage]);

                // Mark it as read immediately since the user has the chat open
                markMessageRead(newMessage.id).catch(() => {});

                // Scroll to the new message
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            },

            // Called when WebSocket connection opens
            () => setIsConnected(true),

            // Called when WebSocket connection closes
            () => setIsConnected(false)
        );
    };

    // ---------------------------------------------------------------------------
    // Auto-scroll when messages load
    // ---------------------------------------------------------------------------
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
        }
    }, [messages.length === 0 ? 0 : 1]); // Only fires when going from empty to loaded

    // ---------------------------------------------------------------------------
    // Send a message
    // ---------------------------------------------------------------------------
    const handleSend = () => {
        const content = inputText.trim();
        if (!content) return;  // Don't send empty messages

        // Clear the input immediately for a snappy feel
        setInputText('');

        // Send through WebSocket — the backend will save it and
        // push it back to us + the recipient
        wsService.sendMessage(content);

        // Optimistic update — add the message to our list immediately
        // without waiting for the server echo, so the UI feels instant
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,   // Temporary ID until server responds
            conversation_id: conversationId,
            sender_id: currentUserId ?? '',
            recipient_id: '',
            content,
            sent_at: new Date().toISOString(),
            delivered: false,
            read_at: null
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------
    return (
        <LinearGradient colors={['#00C6FF', '#0072FF']} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >

                    {/* Navigation Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="chevron-back" size={28} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerRight}>
                            <TouchableOpacity>
                                <Ionicons name="ellipsis-horizontal" size={24} color="#fff" style={{ marginRight: 20 }} />
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Ionicons name="share-social-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Provider Info Card */}
                    <View style={styles.glassCard}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={require('../assets/images/8fd666c5ddf277987fa36fc615f6f73a3587c900.jpg')}
                                style={styles.avatar}
                                resizeMode="cover"
                            />
                            {/* Green dot shows actual WebSocket connection status */}
                            {isConnected && <View style={styles.onlineIndicator} />}
                        </View>
                        <View style={styles.profileTextContainer}>
                            <Text style={styles.nameText}>{providerName}</Text>
                            <Text style={styles.roleText}>{providerRole}</Text>
                            <View style={styles.statusRow}>
                                <View style={[
                                    styles.smallOnlineDot,
                                    { backgroundColor: isConnected ? '#39FF14' : '#aaa' }
                                ]} />
                                <Text style={styles.statusText}>
                                    {isConnected ? 'Online' : 'Connecting...'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.shieldWrapper}>
                            <Ionicons name="shield-checkmark-outline" size={22} color="#fff" />
                        </View>
                    </View>

                    {/* Chat Messages Area */}
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#fff" />
                        </View>
                    ) : (
                        <ScrollView
                            ref={scrollViewRef}
                            style={styles.messageList}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {messages.length === 0 && (
                                <Text style={styles.emptyText}>
                                    No messages yet. Say hello!
                                </Text>
                            )}

                            {messages.map((msg) => {
                                const isOwnMessage = msg.sender_id === currentUserId;
                                return (
                                    <View
                                        key={msg.id}
                                        style={[
                                            styles.msgBubble,
                                            isOwnMessage ? styles.outgoingMsg : styles.incomingMsg
                                        ]}
                                    >
                                        <Text style={styles.msgText}>{msg.content}</Text>
                                        <Text style={styles.timeText}>
                                            {new Date(msg.sent_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* Message Input */}
                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder="Ask From Servy..."
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={handleSend}
                            returnKeyType="send"
                            multiline={false}
                        />
                        <TouchableOpacity
                            style={styles.sendBtn}
                            onPress={handleSend}
                            disabled={!inputText.trim()}
                        >
                            <Ionicons
                                name="send"
                                size={24}
                                color={inputText.trim() ? '#fff' : 'rgba(255,255,255,0.4)'}
                            />
                        </TouchableOpacity>
                    </View>

                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    glassCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        marginHorizontal: 20,
        borderRadius: 25,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarContainer: { width: 66, height: 66, position: 'relative' },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 44,
        backgroundColor: '#444'
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#39FF14',
        borderWidth: 2,
        borderColor: '#2bb0ff'
    },
    profileTextContainer: { marginLeft: 15, flex: 1 },
    nameText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    roleText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    smallOnlineDot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
    statusText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    shieldWrapper: {
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    messageList: { flex: 1, paddingHorizontal: 20, marginTop: 30 },
    emptyText: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14
    },
    msgBubble: {
        padding: 15,
        borderRadius: 20,
        marginBottom: 20,
        maxWidth: '80%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    incomingMsg: { alignSelf: 'flex-start', borderBottomLeftRadius: 5 },
    outgoingMsg: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.15)'
    },
    msgText: { color: '#fff', fontSize: 16, lineHeight: 22 },
    timeText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end'
    },
    input: { flex: 1, color: '#fff', fontSize: 18 },
    inputWrapper: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 20,
        marginBottom: 30,
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    sendBtn: { marginLeft: 10 }
});

export default ProviderChat;
