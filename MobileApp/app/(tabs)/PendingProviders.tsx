import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    Linking,
    SafeAreaView,
    ScrollView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    getPendingProviders,
    getProviderDetails,
    getDocumentUrl,
    verifyDocument,
    rejectDocument,
    approveProvider
} from '../services/adminProviderService';
import { WebView } from 'react-native-webview';

// Types
interface ProviderListItem {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    category: {
        id: string;
        name: string;
        slug: string;
    };
    created_at: string;
    document_status: {
        total: number;
        verified: number;
        pending: number;
        rejected: number;
    };
}

interface BusinessDocument {
    file_id: string;
    filename: string;
    type: string;
    status: 'pending' | 'verified' | 'rejected';
    uploaded_at: string;
    verified_at?: string | null;
    rejection_reason?: string | null;
}

interface ProviderDetails {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    category: {
        id: string;
        name: string;
        slug: string;
    };
    description: string;
    profile_image?: string | null;
    portfolio_images: string[];
    is_verified: boolean;
    business_documents: BusinessDocument[];
    created_at: string;
    updated_at: string;
}

export default function PendingProvidersPage() {
    const [providers, setProviders] = useState<ProviderListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<ProviderDetails | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processingDoc, setProcessingDoc] = useState<number | null>(null);
    const [loadingDocId, setLoadingDocId] = useState<string | null>(null); // track which doc is downloading
    const [pdfUrl, setPdfUrl] = useState('');
    const [pdfVisible, setPdfVisible] = useState(false);
    const [pdfBase64, setPdfBase64] = useState('');
    const [pdfLoading, setPdfLoading] = useState(false);

    // Fetch pending providers
    const fetchProviders = async (retries = 3) => {
        try {
            if (retries === 3) setLoading(true);
            const data = await getPendingProviders();
            setProviders(data);
            setLoading(false);
        } catch (error: any) {
            if (error.code === 'ERR_NETWORK' && retries > 0) {
                console.log(`Network error, retrying... (${retries} left)`);
                setTimeout(() => fetchProviders(retries - 1), 1000);
            } else {
                setLoading(false);
                Alert.alert('Error', 'Failed to fetch pending providers');
            }
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchProviders, 300);
        return () => clearTimeout(timer);
    }, []);

    // Open provider details modal
    const openProviderModal = async (provider: any) => {
        try {
            const details = await getProviderDetails(provider.id);
            setSelectedProvider(details);
            setModalVisible(true);
            setRejectionReason('');
        } catch (error) {
            Alert.alert('Error', 'Failed to load provider details');
        }
    };

    // Close modal
    const closeModal = () => {
        setModalVisible(false);
        setSelectedProvider(null);
        setRejectionReason('');
        setProcessingDoc(null);
    };

    // View document
    const viewDocument = async (fileId: string) => {
        if (!selectedProvider) return;
        try {
            setPdfLoading(true);
            setPdfVisible(true);
            const baseURL = 'http://192.168.1.5:8001/api';
            const url = `${baseURL}/admin/providers/${selectedProvider.id}/documents/${fileId}`;

            const response = await fetch(url);
            const blob = await response.blob();

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                setPdfBase64(base64);
                setPdfLoading(false);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            setPdfLoading(false);
            setPdfVisible(false);
            Alert.alert('Error', 'Failed to load document');
        }
    };

    // Verify a document
    const handleVerifyDocument = async (docIndex: number) => {
        if (!selectedProvider) return;

        try {
            setProcessingDoc(docIndex);
            await verifyDocument(selectedProvider.id, docIndex);
            const updated = await getProviderDetails(selectedProvider.id);
            setSelectedProvider(updated);
            Alert.alert('Success', 'Document verified!');
        } catch (error) {
            Alert.alert('Error', 'Failed to verify document');
        } finally {
            setProcessingDoc(null);
        }
    };

    // Reject a document
    const handleRejectDocument = async (docIndex: number) => {
        if (!selectedProvider) return;

        if (!rejectionReason.trim()) {
            Alert.alert('Required', 'Please provide a rejection reason');
            return;
        }

        try {
            setProcessingDoc(docIndex);
            await rejectDocument(selectedProvider.id, docIndex, rejectionReason);
            const updated = await getProviderDetails(selectedProvider.id);
            setSelectedProvider(updated);
            Alert.alert('Success', 'Document rejected');
            setRejectionReason('');
        } catch (error) {
            Alert.alert('Error', 'Failed to reject document');
        } finally {
            setProcessingDoc(null);
        }
    };

    // Approve entire provider
    const handleApproveProvider = async () => {
        if (!selectedProvider) return;

        try {
            await approveProvider(selectedProvider.id);
            Alert.alert('Success', 'Provider approved!', [
                {
                    text: 'OK',
                    onPress: () => {
                        closeModal();
                        fetchProviders();
                    }
                }
            ]);
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Failed to approve provider';
            Alert.alert('Error', message);
        }
    };

    // Check if all documents are verified
    const allDocsVerified = () => {
        if (!selectedProvider?.business_documents) return false;
        return selectedProvider.business_documents.every((doc: any) => doc.status === 'verified');
    };

    // Render provider card
    const renderProviderCard = ({ item }: any) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => openProviderModal(item)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.providerName}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={24} color="#666" />
            </View>

            <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="construct" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.category.name}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="document-text" size={16} color="#ff9800" />
                    <Text style={styles.detailText}>
                        {item.document_status.pending} documents pending
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.detailText}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Render document item in modal
    const renderDocument = (doc: any, index: number) => {
        const isProcessing = processingDoc === index;
        const isDownloading = loadingDocId === doc.file_id;

        return (
            <View key={index} style={styles.documentCard}>
                <View style={styles.docHeader}>
                    <Ionicons name="document" size={20} color="#0072FF" />
                    <Text style={styles.docFilename}>{doc.filename}</Text>
                </View>

                <View style={styles.docStatus}>
                    <Text style={[
                        styles.statusBadge,
                        doc.status === 'verified' && styles.statusVerified,
                        doc.status === 'rejected' && styles.statusRejected,
                        doc.status === 'pending' && styles.statusPending
                    ]}>
                        {doc.status.toUpperCase()}
                    </Text>
                </View>

                {doc.rejection_reason && (
                    <Text style={styles.rejectionText}>
                        Reason: {doc.rejection_reason}
                    </Text>
                )}

                <View style={styles.docActions}>
                    {/* View PDF Button */}
                    <TouchableOpacity
                        style={[styles.viewBtn, isDownloading && styles.btnDisabled]}
                        onPress={() => viewDocument(doc.file_id)}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <ActivityIndicator size="small" color="#0072FF" />
                        ) : (
                            <Ionicons name="eye" size={18} color="#0072FF" />
                        )}
                        <Text style={styles.viewBtnText}>
                            {isDownloading ? 'Loading...' : 'View PDF'}
                        </Text>
                    </TouchableOpacity>

                    {/* Verify Button */}
                    {doc.status !== 'verified' && (
                        <TouchableOpacity
                            style={[styles.verifyBtn, isProcessing && styles.btnDisabled]}
                            onPress={() => handleVerifyDocument(index)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                    <Text style={styles.verifyBtnText}>Verify</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Reject Button */}
                    {doc.status !== 'rejected' && (
                        <TouchableOpacity
                            style={[styles.rejectBtn, isProcessing && styles.btnDisabled]}
                            onPress={() => handleRejectDocument(index)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="close-circle" size={18} color="#fff" />
                                    <Text style={styles.rejectBtnText}>Reject</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Pending Verifications</Text>
                <TouchableOpacity onPress={() => fetchProviders()}>
                    <Ionicons name="refresh" size={24} color="#0072FF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#0072FF" style={styles.loader} />
            ) : (
                <FlatList
                    data={providers}
                    renderItem={renderProviderCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No pending providers</Text>
                    }
                />
            )}

            {/* Provider Details Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={closeModal}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={closeModal}>
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {selectedProvider?.name}
                        </Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {selectedProvider && (
                            <>
                                {/* Provider Info */}
                                <View style={styles.infoSection}>
                                    <Text style={styles.sectionTitle}>Provider Information</Text>
                                    <Text style={styles.infoText}>📧 {selectedProvider.email}</Text>
                                    <Text style={styles.infoText}>📞 {selectedProvider.phone_number}</Text>
                                    <Text style={styles.infoText}>🔧 {selectedProvider.category.name}</Text>
                                    <Text style={styles.infoText}>📝 {selectedProvider.description}</Text>
                                </View>

                                {/* Documents */}
                                <View style={styles.documentsSection}>
                                    <Text style={styles.sectionTitle}>
                                        Documents ({selectedProvider.business_documents?.length || 0})
                                    </Text>
                                    {selectedProvider.business_documents?.map((doc: any, index: number) =>
                                        renderDocument(doc, index)
                                    )}
                                </View>

                                {/* Rejection Reason Field */}
                                <View style={styles.rejectionSection}>
                                    <Text style={styles.sectionTitle}>Rejection Reason (if rejecting)</Text>
                                    <TextInput
                                        style={styles.rejectionInput}
                                        placeholder="Enter reason for rejection..."
                                        value={rejectionReason}
                                        onChangeText={setRejectionReason}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                {/* Approve Provider Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.approveBtn,
                                        !allDocsVerified() && styles.approveBtnDisabled
                                    ]}
                                    onPress={handleApproveProvider}
                                    disabled={!allDocsVerified()}
                                >
                                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                                    <Text style={styles.approveBtnText}>
                                        {allDocsVerified()
                                            ? 'Approve Provider'
                                            : 'Verify all documents first'
                                        }
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
            <Modal visible={pdfVisible} animationType="slide" onRequestClose={() => setPdfVisible(false)}>
                <SafeAreaView style={{ flex: 1 }}>
                    <TouchableOpacity onPress={() => setPdfVisible(false)} style={{ padding: 15 }}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    {pdfLoading ? (
                        <ActivityIndicator size="large" color="#0072FF" style={{ marginTop: 50 }} />
                    ) : (
                        <WebView
                            source={{
                                html: `
                        <html><body style="margin:0;padding:0;background:#000;">
                            <embed 
                                src="data:application/pdf;base64,${pdfBase64}" 
                                width="100%" 
                                height="100%" 
                                type="application/pdf"
                            />
                        </body></html>
                    `
                            }}
                            style={{ flex: 1 }}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold'
    },
    loader: {
        marginTop: 50
    },
    list: {
        padding: 15
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666'
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    providerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    cardDetails: {
        gap: 8
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    detailText: {
        fontSize: 14,
        color: '#666'
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    modalContent: {
        flex: 1,
        padding: 15
    },
    infoSection: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5
    },
    documentsSection: {
        marginBottom: 20
    },
    documentCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12
    },
    docHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
    },
    docFilename: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1
    },
    docStatus: {
        marginBottom: 8
    },
    statusBadge: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start'
    },
    statusPending: {
        backgroundColor: '#ff9800',
        color: '#fff'
    },
    statusVerified: {
        backgroundColor: '#4CAF50',
        color: '#fff'
    },
    statusRejected: {
        backgroundColor: '#f44336',
        color: '#fff'
    },
    rejectionText: {
        fontSize: 12,
        color: '#f44336',
        fontStyle: 'italic',
        marginBottom: 8
    },
    docActions: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap'
    },
    viewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#0072FF'
    },
    viewBtnText: {
        color: '#0072FF',
        fontSize: 12,
        fontWeight: '600'
    },
    verifyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50'
    },
    verifyBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    rejectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: '#f44336'
    },
    rejectBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    btnDisabled: {
        opacity: 0.5
    },
    rejectionSection: {
        marginBottom: 20
    },
    rejectionInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top'
    },
    approveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0072FF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20
    },
    approveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    approveBtnDisabled: {
        backgroundColor: '#ccc'
    }
});
