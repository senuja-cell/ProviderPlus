import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    Image, SafeAreaView, StatusBar, ScrollView, ActivityIndicator,
    KeyboardAvoidingView, Platform, Modal, Pressable,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { wsService, Message } from './services/websocketService';
import {
    getMessageHistory, markMessageRead,
    analyzeAppointment, AppointmentDetails,
    createBooking,
} from './services/messagingApi';

// ── helpers ───────────────────────────────────────────────────────────────────
/** Expo Router params can return string | string[] — always get a plain string */
const asString = (v: string | string[] | undefined, fallback = ''): string =>
    Array.isArray(v) ? v[0] : (v ?? fallback);


/** "2025-07-14" → Date object */
const parseDate = (s: string): Date => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
};

/** "03:00 PM" or "15:00" → Date object (today's date, just the time set) */
const parseTime = (s: string): Date => {
    const base = new Date();
    // Try HH:MM 24-hr first
    const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) {
        base.setHours(parseInt(m24[1]), parseInt(m24[2]), 0, 0);
        return base;
    }
    // Try HH:MM AM/PM
    const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m12) {
        let h = parseInt(m12[1]);
        const min = parseInt(m12[2]);
        if (m12[3].toUpperCase() === 'PM' && h < 12) h += 12;
        if (m12[3].toUpperCase() === 'AM' && h === 12) h = 0;
        base.setHours(h, min, 0, 0);
        return base;
    }
    return base;
};

/** Date → "Monday, 14 July 2025" */
const formatDateDisplay = (d: Date): string =>
    d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** Date → "YYYY-MM-DD" for the backend */
const formatDateISO = (d: Date): string =>
    d.toISOString().split('T')[0];

/** Date → "HH:MM" 24-hr for the backend */
const formatTimeISO = (d: Date): string =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Date → "03:00 PM" for display */
const formatTimeDisplay = (d: Date): string =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

// ── component ─────────────────────────────────────────────────────────────────

const Chat = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{
        conversationId: string;
        providerId?: string;
        providerName?: string;
        providerRole?: string;
    }>();
    const conversationId = asString(params.conversationId);
    const providerId     = asString(params.providerId);
    const providerName   = asString(params.providerName, 'Provider');
    const providerRole   = asString(params.providerRole);

    // ── chat state ────────────────────────────────────────────────────────────
    const [messages, setMessages]           = useState<Message[]>([]);
    const [inputText, setInputText]         = useState('');
    const [isLoading, setIsLoading]         = useState(true);
    const [isConnected, setIsConnected]     = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const scrollViewRef                     = useRef<ScrollView>(null);

    // ── booking modal state ───────────────────────────────────────────────────
    const [modalVisible, setModalVisible]   = useState(false);
    const [analyzing, setAnalyzing]         = useState(false);
    const [submitting, setSubmitting]       = useState(false);
    const [analyzeError, setAnalyzeError]   = useState<string | null>(null);

    // Pickers
    const [selectedDate, setSelectedDate]   = useState<Date>(new Date());
    const [selectedTime, setSelectedTime]   = useState<Date>(() => {
        const d = new Date(); d.setHours(9, 0, 0, 0); return d;
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Job summary (only editable field left as text)
    const [bookingSummary, setBookingSummary] = useState('');

    // ── chat setup ────────────────────────────────────────────────────────────
    useEffect(() => {
        setupChat();
        return () => { wsService.disconnect(); };
    }, []);

    const setupChat = async () => {
        const userData = await AsyncStorage.getItem('user_data');
        const userId = userData ? JSON.parse(userData).user_id : null;
        setCurrentUserId(userId);
        try {
            const history = await getMessageHistory(conversationId);
            setMessages(history);

            console.log('[Chat] sample message ids:', history.slice(0,3).map((m: any) => m.id));
//             console.log('[Chat] user_id:', userId);
//             console.log('[Chat] first sender_id:', history[0]?.sender_id);
//             console.log('[Chat] match:', userId === history[0]?.sender_id);

            const unread = history.filter((m: Message) => !m.read_at && m.id && !m.id.startsWith('temp-'));
                for (const msg of unread) {
                  markMessageRead(msg.id).catch(() => {});
                }
        } catch (e) {
            console.error('Failed to load message history:', e);
        } finally {
            setIsLoading(false);
        }
        await wsService.connect(
            conversationId,
            (msg: Message) => {
                setMessages(prev => [...prev, msg]);
                       markMessageRead(msg.id).catch(() => {});
                       setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                   },
            () => setIsConnected(true),
            () => setIsConnected(false),
        );
    };

    useEffect(() => {
        if (messages.length > 0)
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
    }, [messages.length === 0 ? 0 : 1]);

    // ── send message ──────────────────────────────────────────────────────────
    const handleSend = () => {
        const content = inputText.trim();
        if (!content) return;
        setInputText('');
        wsService.sendMessage(content);
        const optimistic: Message = {
            id: `temp-${Date.now()}`,
            conversation_id: conversationId,
            sender_id: currentUserId ?? '',
            recipient_id: '',
            content,
            sent_at: new Date().toISOString(),
            delivered: false,
            read_at: null,
        };
        setMessages(prev => [...prev, optimistic]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    // ── confirm → AI analysis → open modal ───────────────────────────────────
    const handleConfirm = async () => {
        setAnalyzing(true);
        setAnalyzeError(null);

        if (messages.length === 0) {
            setAnalyzeError('No messages yet — please fill in the details manually.');
            setAnalyzing(false);
            setModalVisible(true);
            return;
        }

        const chatText = messages
            .map(m => `${m.sender_id === currentUserId ? 'Client' : 'Provider'}: ${m.content}`)
            .join('\n');

        try {
            const details: AppointmentDetails = await analyzeAppointment(chatText);

            if (details.date)    setSelectedDate(parseDate(details.date));
            if (details.time)    setSelectedTime(parseTime(details.time));
            if (details.summary) setBookingSummary(details.summary);

            if (!details.found)
                setAnalyzeError('No appointment details detected — check and edit below.');
        } catch (e) {
            console.error('AI analysis failed:', e);
            setAnalyzeError('Analysis failed — please fill in the details manually.');
        } finally {
            setAnalyzing(false);
            setModalVisible(true);
        }
    };

    // ── date / time picker callbacks ──────────────────────────────────────────
    const onDateChange = (_: DateTimePickerEvent, date?: Date) => {
        // On Android the picker closes after one selection; on iOS it stays open
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (date) setSelectedDate(date);
    };

    const onTimeChange = (_: DateTimePickerEvent, time?: Date) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (time) setSelectedTime(time);
    };

    // ── finalize booking ──────────────────────────────────────────────────────
    const handleFinalizeBooking = async () => {
        if (!bookingSummary.trim()) {
            setAnalyzeError('Please add a job summary before finalizing.');
            return;
        }
        setSubmitting(true);
        try {
            // Read cached user location — won't prompt user again
            let userLatitude: number | undefined;
            let userLongitude: number | undefined;

            const stored = await AsyncStorage.getItem('user_location');
            if (stored) {
                const parsed = JSON.parse(stored);
                userLatitude  = parsed.latitude;
                userLongitude = parsed.longitude;
            }

            const result = await createBooking({
                conversation_id: conversationId,
                provider_id: providerId,
                date: formatDateISO(selectedDate),
                time: formatTimeISO(selectedTime),
                summary: bookingSummary.trim(),
                user_latitude: userLatitude,
                user_longitude: userLongitude,
            });

            setModalVisible(false);

            // Navigate to payment page with the booking details
            router.push({
                pathname: '/Checkout',
                params: {
                    bookingId:    result.booking_id,
                    providerName,
                    date:         formatDateDisplay(selectedDate),
                    time:         formatTimeDisplay(selectedTime),
                    summary:      bookingSummary.trim(),
                },
            });
        } catch (e) {
            console.error('Booking failed:', e);
            setAnalyzeError('Could not submit booking. Please try again.');
            setSubmitting(false);
        }
    };

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <LinearGradient colors={['#00C6FF', '#0072FF']} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="chevron-back" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Provider card */}
                    <View style={styles.glassCard}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={require('../assets/images/8fd666c5ddf277987fa36fc615f6f73a3587c900.jpg')}
                                style={styles.avatar}
                                resizeMode="cover"
                            />
                        </View>
                        <View style={styles.profileTextContainer}>
                            <Text style={styles.nameText}>{providerName}</Text>
                            <Text style={styles.roleText}>{providerRole}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.confirmBtn, analyzing && styles.confirmBtnDisabled]}
                            onPress={handleConfirm}
                            disabled={analyzing}
                        >
                            {analyzing
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={styles.confirmBtnText}>Confirm</Text>
                            }
                        </TouchableOpacity>
                    </View>

                    {/* Messages */}
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
                                <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
                            )}
                            {messages.map((msg,index) => {
                                const isOwn = msg.sender_id === currentUserId;
                                return (
                                    <View key={msg.id || 'msg-${}index}'} style={[styles.msgBubble, isOwn ? styles.outgoingMsg : styles.incomingMsg]}>
                                        <Text style={styles.msgText}>{msg.content}</Text>
                                        <Text style={styles.timeText}>
                                            {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* Input */}
                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder="Type..."
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={handleSend}
                            returnKeyType="send"
                            multiline={false}
                        />
                        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!inputText.trim()}>
                            <Ionicons name="send" size={24} color={inputText.trim() ? '#fff' : 'rgba(255,255,255,0.4)'} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* ── BOOKING MODAL ─────────────────────────────────────────────── */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalKeyboard}
                >
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />

                        {/* Title */}
                        <View style={styles.modalTitleRow}>
                            <Text style={styles.modalTitle}>Booking Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Reviewed from your conversation. Tap to adjust.</Text>

                        {/* Warning */}
                        {analyzeError && (
                            <View style={styles.warningRow}>
                                <Ionicons name="information-circle-outline" size={16} color="#E65100" />
                                <Text style={styles.warningText}>{analyzeError}</Text>
                            </View>
                        )}

                        {/* Provider — read only */}
                        <Text style={styles.fieldLabel}>Provider</Text>
                        <View style={styles.fieldReadOnly}>
                            <Ionicons name="person-outline" size={16} color="#2E86D4" style={styles.fieldIcon} />
                            <Text style={styles.fieldReadOnlyText}>{providerName}  ·  {providerRole}</Text>
                        </View>

                        {/* ── DATE PICKER ── */}
                        <Text style={styles.fieldLabel}>Date</Text>
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => {
                            setShowTimePicker(false);
                            setShowDatePicker(v => !v);
                        }}>
                            <Ionicons name="calendar-outline" size={16} color="#2E86D4" style={styles.fieldIcon} />
                            <Text style={styles.pickerTriggerText}>{formatDateDisplay(selectedDate)}</Text>
                            <Ionicons name="chevron-down" size={16} color="#aaa" />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                                minimumDate={new Date()}
                                onChange={onDateChange}
                                style={styles.inlinePicker}
                            />
                        )}

                        {/* ── TIME PICKER ── */}
                        <Text style={styles.fieldLabel}>Time</Text>
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => {
                            setShowDatePicker(false);
                            setShowTimePicker(v => !v);
                        }}>
                            <Ionicons name="time-outline" size={16} color="#2E86D4" style={styles.fieldIcon} />
                            <Text style={styles.pickerTriggerText}>{formatTimeDisplay(selectedTime)}</Text>
                            <Ionicons name="chevron-down" size={16} color="#aaa" />
                        </TouchableOpacity>

                        {showTimePicker && (
                            <DateTimePicker
                                value={selectedTime}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                                is24Hour={false}
                                onChange={onTimeChange}
                                style={styles.inlinePicker}
                            />
                        )}

                        {/* Job summary */}
                        <Text style={styles.fieldLabel}>Job Summary</Text>
                        <View style={[styles.fieldRow, styles.fieldRowMultiline]}>
                            <Ionicons name="document-text-outline" size={16} color="#2E86D4" style={[styles.fieldIcon, { marginTop: 3 }]} />
                            <TextInput
                                style={[styles.fieldInput, styles.fieldInputMultiline]}
                                value={bookingSummary}
                                onChangeText={setBookingSummary}
                                placeholder="Describe the job..."
                                placeholderTextColor="#aaa"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Finalize button */}
                        <LinearGradient
                            colors={['#2E86D4', '#1A4F9C']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[styles.finalizeBtn, submitting && { opacity: 0.7 }]}
                        >
                            <TouchableOpacity
                                style={styles.finalizeBtnInner}
                                onPress={handleFinalizeBooking}
                                disabled={submitting}
                            >
                                {submitting
                                    ? <ActivityIndicator color="#fff" />
                                    : <>
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.finalizeBtnText}>Finalize Booking</Text>
                                    </>
                                }
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </LinearGradient>
    );
};

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 54,
        paddingBottom: 15,
    },

    glassCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.25)',
        marginHorizontal: 20, borderRadius: 25, padding: 15,
        alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarContainer: { width: 66, height: 66 },
    avatar: { width: '100%', height: '100%', borderRadius: 44, backgroundColor: '#444' },
    profileTextContainer: { marginLeft: 15, flex: 1 },
    nameText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    roleText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    confirmBtn: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20, minWidth: 80, alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    },
    confirmBtnDisabled: { opacity: 0.6 },
    confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageList: { flex: 1, paddingHorizontal: 20, marginTop: 30 },
    emptyText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 40, fontSize: 14 },
    msgBubble: {
        padding: 15, borderRadius: 20, marginBottom: 20, maxWidth: '80%',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    incomingMsg: { alignSelf: 'flex-start', borderBottomLeftRadius: 5,  backgroundColor: 'rgba(255,255,255,0.25)',  borderColor: 'rgba(255,255,255,0.4)', },
    outgoingMsg: { alignSelf: 'flex-end', borderBottomRightRadius: 5, backgroundColor: 'rgba(0,60,140,0.5)', borderColor: 'rgba(0,60,140,0.6)', },
    msgText: { color: '#fff', fontSize: 16, lineHeight: 22 },
    timeText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    input: { flex: 1, color: '#fff', fontSize: 18, lineheight: 22 },
    inputWrapper: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 20, marginBottom: 1,
        borderRadius: 30, paddingHorizontal: 20, paddingVertical: 15,
        alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    sendBtn: { marginLeft: 10 },

    // Modal
    modalBackdrop: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalKeyboard: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12,
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 }, elevation: 12,
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 20,
    },
    modalTitleRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 4,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
    modalSubtitle: { fontSize: 13, color: '#888', marginBottom: 18 },
    warningRow: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: '#FFF3E0', borderRadius: 10,
        padding: 10, marginBottom: 14, gap: 8,
    },
    warningText: { flex: 1, fontSize: 12, color: '#E65100', lineHeight: 18 },

    // Form
    fieldLabel: {
        fontSize: 11, fontWeight: '700', color: '#888',
        marginBottom: 6, marginTop: 14,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    fieldReadOnly: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F4F8FF', borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 12,
        borderWidth: 1, borderColor: '#E8F0FB',
    },
    fieldReadOnlyText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
    fieldIcon: { marginRight: 8 },

    // Picker trigger button
    pickerTrigger: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F4F8FF', borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 14,
        borderWidth: 1, borderColor: '#E8F0FB',
    },
    pickerTriggerText: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },

    // Inline picker (iOS inline calendar / spinner)
    inlinePicker: {
        backgroundColor: '#F4F8FF',
        borderRadius: 12,
        marginTop: 4,
    },

    // Summary text field
    fieldRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F4F8FF', borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: '#E8F0FB',
    },
    fieldRowMultiline: { alignItems: 'flex-start' },
    fieldInput: { flex: 1, fontSize: 15, color: '#1A1A1A' },
    fieldInputMultiline: { minHeight: 64, textAlignVertical: 'top' },

    // Finalize button
    finalizeBtn: {
        borderRadius: 30, marginTop: 24, overflow: 'hidden',
        shadowColor: '#1A4F9C', shadowOpacity: 0.35, shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    finalizeBtnInner: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 16,
    },
    finalizeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});

export default Chat;
