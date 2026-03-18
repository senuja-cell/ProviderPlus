import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Animated,
    Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { sendChatMessage } from './services/chatService';

// --- TYPES ---
interface Message {
    id: string;
    text?: string;
    sender: 'user' | 'bot';
    type: 'text' | 'cards' | 'typing';
    data?: any[];
}

const App = () => {
    const router = useRouter();
    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const flatListRef = useRef<FlatList>(null);

    const suggestions = [
        "Find a Top Rated provider",
        "Fix a leaking tap",
        "Emergency pipe repair"
    ];

    // --- HANDLERS ---
    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        // 1. Add User Message with animation
        const userMsg: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            type: 'text'
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText("");

        // Auto-scroll after user message
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        // 2. Show "Typing..." while we wait for python
        const typingId = 'typing-' + Date.now();
        const typingMsg: Message = {
            id: typingId,
            sender: 'bot',
            type: 'typing'
        };
        setMessages(prev => [...prev, typingMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);

        try{
            // 3. call the python backend - the bridge
            const response = await sendChatMessage(text);

            // remove typing indicator
            setMessages(prev => prev.filter(m => m.id !== typingId));

            // 4. create the bot's text message from python's reply
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: response.ai_reply,
                sender: 'bot',
                type: 'text'
            };

            const newMessages = [botResponse];

            // if python sent 'providers', show the cards
            // this maps provider list to the frontend
            if(response.providers && response.providers.length > 0){
                const cardResults: Message = {
                    id: (Date.now() + 2).toString(),
                    sender: 'bot',
                    type: 'cards',
                    data: response.providers
                };
                newMessages.push(cardResults);
            }
            setMessages(prev => [...prev, ...newMessages]);
        }
        catch(error){
            setMessages(prev => prev.filter(m => m.id !== typingId));
            const errorMsg: Message = {
                id: Date.now().toString(),
                text: "I'm having trouble connecting to the server. Please check your internet.",
                sender: 'bot',
                type: 'text'
            };
            setMessages(prev => [...prev, errorMsg]);
        }
        setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 200);
    };

    return (
        <LinearGradient colors={['#00ADF5', '#0072FF']} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior ={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>

                    {/* --- HEADER --- */}
                    <View style={styles.header}>
                      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backArrow}>‹</Text>
                      </TouchableOpacity>
                      <Text style={styles.headerTitle}>Survy</Text>
                      <View style={{ width: 38 }} />
                      <Image
                            source={require('../assets/images/survy.png')}
                            style={{ width: 40, height: 40, tintColor: 'white' }}
                            resizeMode="contain"
                          />
                    </View>
                    <View style={styles.headerSeparator} />

                    {/* --- CHAT AREA --- */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Image source={require('../assets/images/provider-logo.png')} style={styles.largeLogo} />
                                <Text style={styles.welcomeTitle}>Hello! Im Survy</Text>
                                <Text style={styles.welcomeSub}>What service do you need today?</Text>
                                <View style={styles.suggestionGrid}>
                                    {suggestions.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.suggestionBtn}
                                            onPress={() => handleSend(item)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.suggestionText}>{item}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                        renderItem={({ item, index }) => {
                            if (item.type === 'typing') {
                                return <TypingIndicator />;
                            } else if (item.type === 'text') {
                                return <AnimatedMessageBubble message={item} index={index} />;
                            } else {
                                return <AnimatedCardList data={item.data} router={router} />;
                            }
                        }}
                    />

                    {/* --- INPUT --- */}
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.bottomWrapper}>
                        <BlurView intensity={40} tint="light" style={styles.inputGlassContainer}>
                            <TextInput
                                placeholder="Ask From Servy..."
                                placeholderTextColor="rgba(255,255,255,0.7)"
                                style={styles.input}
                                value={inputText}
                                onChangeText={setInputText}
                            />
                            <TouchableOpacity
                                style={styles.sendBtn}
                                onPress={() => handleSend(inputText)}
                                activeOpacity={0.7}
                            >
                                <Image source={require('../assets/images/f07bde08f3fa0fba4685ffa38ab849d5cba51896.png')} style={styles.sendIcon} />
                            </TouchableOpacity>
                        </BlurView>
                    </KeyboardAvoidingView>
                </KeyboardAvoidingView>

            </SafeAreaView>
        </LinearGradient>
    );
};

// --- ANIMATED COMPONENTS ---

// Typing Indicator Component
const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: -8,
                        duration: 400,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 400,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animate(dot1, 0);
        animate(dot2, 150);
        animate(dot3, 300);
    }, []);

    return (
        <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
                <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
                <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
                <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
            </View>
        </View>
    );
};

// Animated Message Bubble Component
const AnimatedMessageBubble = ({ message, index }: { message: Message; index: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const isUser = message.sender === 'user';

    return (
        <Animated.View
            style={[
                isUser ? styles.userBubble : styles.botBubble,
                {
                    opacity: fadeAnim,
                    transform: [
                        {
                            translateX: slideAnim.interpolate({
                                inputRange: [0, 30],
                                outputRange: [0, isUser ? 30 : -30]
                            })
                        }
                    ],
                }
            ]}
        >
            <Text style={styles.bubbleText}>{message.text}</Text>
        </Animated.View>
    );
};

// Animated Card List Component
const AnimatedCardList = ({ data, router }: { data: any[] | undefined; router: any }) => {
    if (!data) return null;

    return (
        <View>
            {data.map((provider, index) => (
                <AnimatedCard key={provider._id} provider={provider} index={index} router={router} />
            ))}
        </View>
    );
};

// Individual Animated Card Component
const AnimatedCard = ({ provider, index, router }: { provider: any; index: number; router: any }) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 200, // Stagger effect
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                delay: index * 200,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.cardContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                }
            ]}
        >
            <BlurView intensity={30} tint="light" style={styles.glassCard}>
                <Image source={require('../assets/images/8fd666c5ddf277987fa36fc615f6f73a3587c900.jpg')} style={styles.avatar} />
                <View style={styles.cardInfo}>
                    <Text style={styles.providerName}>{provider.name}</Text>
                    <Text style={styles.rating}>
                        {"⭐".repeat(Math.round(provider.rating || 5))}
                    </Text>
                    <TouchableOpacity
                        style={styles.bookBtnContainer}
                        onPress={() => router.push({ pathname: '/ProviderProfile', params: { id: provider._id } })}
                        activeOpacity={0.8}
                    >
                        <LinearGradient colors={['#E440FF', '#5A1F63']} style={styles.bookBtnGradient}>
                            <Text style={styles.bookText}>Book Now</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </BlurView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 10 : 40,
      paddingBottom: 12,
    },
    headerTitle: {
      color: 'white',
      fontSize: 28,
      fontWeight: 'bold',
      position: 'absolute',
      left: 0,
      right: 0,
      textAlign: 'center',
      paddingTop:30,
    },
    headerSeparator: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.3)',
      marginHorizontal: 0,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    backArrow: { color: 'white', fontSize: 30, fontWeight: '300', marginTop: -6 },
    listContent: { paddingTop: 120, paddingBottom: 100, flexGrow: 1 },
    botBubble: { backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: 15, marginHorizontal: 20, marginVertical: 8, borderRadius: 20, borderBottomLeftRadius: 5, alignSelf: 'flex-start', maxWidth: '80%', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
    userBubble: { backgroundColor: 'rgba(255, 255, 255, 0.3)', padding: 15, marginHorizontal: 20, marginVertical: 8, borderRadius: 20, borderBottomRightRadius: 5, alignSelf: 'flex-end', maxWidth: '80%', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)' },
    bubbleText: { color: 'white', fontSize: 15 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
    largeLogo: { width: 115, height: 150, padding:40},
    welcomeTitle: { color: 'white', fontSize: 26, fontWeight: '900' },
    welcomeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 30 },
    suggestionGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    suggestionBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 15, margin: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    suggestionText: { color: 'white', fontSize: 12, fontWeight: '600' },
    cardContainer: { marginHorizontal: 20, marginVertical: 10, borderRadius: 20, overflow: 'hidden' },
    glassCard: { flexDirection: 'row', padding: 15, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
    avatar: { width: 80, height: 80, borderRadius: 12 },
    cardInfo: { marginLeft: 15, flex: 1, justifyContent: 'center' },
    providerName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    rating: { fontSize: 14, marginTop: 4 },
    bookBtnContainer: { alignSelf: 'flex-end', marginTop: 10, borderRadius: 20, overflow: 'hidden' },
    bookBtnGradient: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
    bookText: { color: 'white', fontSize: 12, fontWeight: '700' },
    bottomWrapper: { position: 'absolute', bottom: 0, width: '100%', padding: 30 },
    inputGlassContainer: { flexDirection: 'row', height: 60, borderRadius: 30, paddingHorizontal: 20, alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', overflow: 'hidden' },
    input: { flex: 1, color: 'white', fontSize: 16 },
    sendBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    sendIcon: { width: 24, height: 24, tintColor: 'white' },
    // Typing Indicator Styles
    typingContainer: { marginHorizontal: 20, marginVertical: 8, alignSelf: 'flex-start' },
    typingBubble: { backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: 15, borderRadius: 20, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.8)' },
});

export default App;
