import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { fetchPaymentSheetParams, confirmBooking } from './services/paymentService';
import {router, useLocalSearchParams} from 'expo-router';

// --- CONFIGURATION ---
const STRIPE_PUBLISHABLE_KEY = "pk_test_51T4PfEQgnci2gla4O6VjuJUXyHQ2bz8DRGWOh4diuzSr9oYowUg8aGuMKcmUkop4kc3PooHdEZWmV2WRZG91evas00K2MEFZV2";

const PaymentScreenContent: React.FC = () => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState<boolean>(false);
    const [isReady, setIsReady] = useState<boolean>(false);
    const { bookingId, providerName, date, time, summary} = useLocalSearchParams<{
        bookingId:    string;
        providerName: string;
        date:         string;
        time:         string;
        summary:      string;
    }>();

    // 1. Initialize the Stripe Sheet using paymentService
    const initializePaymentSheet = async () => {
        setLoading(true);
        try {
            const params = await fetchPaymentSheetParams();

            const { error } = await initPaymentSheet({
                merchantDisplayName: "Provider+ Ltd.",
                customerId: params.customer,
                customerEphemeralKeySecret: params.ephemeralKey,
                paymentIntentClientSecret: params.paymentIntent,
                allowsDelayedPaymentMethods: true,
                defaultBillingDetails: {
                    name: 'Dinura Munasinghe',
                },
                appearance: {
                    colors: {
                        primary: '#E91E63',
                        background: '#ffffff',
                    },
                    shapes: {
                        borderRadius: 15,
                    }
                }
            });

            if (error) {
                Alert.alert("Stripe Error", error.message);
            } else {
                setIsReady(true);
            }
        } catch (error: any) {
            console.error("Payment init error:", error);
            Alert.alert("Connection Error", "Could not connect to payment server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializePaymentSheet();
    }, []);

    // 2. Open the Stripe Payment Sheet UI
    const handlePayment = async () => {
        const { error } = await presentPaymentSheet();

        if (error) {
            Alert.alert(`Error: ${error.code}`, error.message);
        } else {
            try{
                await confirmBooking(bookingId);
                Alert.alert('Success', 'Payment confirmed! Provider+ service is booked.');
                setIsReady(false);
                // TODO: add the user dashboard page here after booking works
                router.push('../(tabs)/index')
            }
            catch(e){
                console.error('Failed to confirm booking: ', e)
                Alert.alert(
                    'Payment received but booking not confirmed',
                    'Please contact support.'
                )
            }
        }
    };

    return (
        <LinearGradient colors={['#00ADF5', '#0072FF']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>Checkout</Text>

                <BlurView intensity={40} tint="light" style={styles.glassCard}>
                    <Text style={styles.label}>BOOKING FOR</Text>
                    <Text style={styles.serviceName}>Plumber</Text>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Text style={styles.label}>TOTAL</Text>
                        <Text style={styles.priceText}>LKR 500</Text>
                    </View>
                </BlurView>

                <TouchableOpacity
                    onPress={handlePayment}
                    style={[styles.buttonWrapper, (!isReady || loading) && { opacity: 0.6 }]}
                    disabled={!isReady || loading}
                >
                    <LinearGradient
                        colors={['#E91E63', '#C2185B']}
                        style={styles.payButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>PROCEED TO PAY</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.footerNote}>ProviderPlus Sri Lanka</Text>
            </ScrollView>
        </LinearGradient>
    );
};

export default function PaymentScreen() {
    return (
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
            <PaymentScreenContent />
        </StripeProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 25, paddingTop: 80 },
    title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 40, textAlign: 'center' },
    glassCard: {
        padding: 30,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        overflow: 'hidden',
        marginBottom: 50,
    },
    label: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    serviceName: { color: '#fff', fontSize: 22, fontWeight: '600', marginTop: 8, marginBottom: 20 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceText: { color: '#fff', fontSize: 24, fontWeight: '800' },
    buttonWrapper: { shadowColor: '#E91E63', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
    payButton: { paddingVertical: 20, borderRadius: 20, alignItems: 'center', minHeight: 60, justifyContent: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1.5 },
    footerNote: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 20, fontSize: 12 }
});
