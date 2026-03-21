import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- CONFIGURATION ---
// 1. REPLACE THIS with the IP you found in Step 1
// This is safe for dev because it's a local address.
export const LAPTOP_IP = '192.168.8.168'; //

// 2. LOGIC:
// - Android Emulator uses '10.0.2.2' (special alias for host loopback).
// - Physical Device / iOS uses your real LAN IP.
const BASE_URL = Platform.OS === 'android' && !Platform.isTV
    ? `http://${LAPTOP_IP}:8001/api`
    : `http://${LAPTOP_IP}:8001/api`;

console.log("🔗 Connecting to Backend at:", BASE_URL);

// 3. Create the Axios Instance
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 70000, // Wait 10 seconds before failing
    headers: {
        'Content-Type': 'application/json',
    }
});

let cachedToken: string | null = null;

export const setTokenCache = (token: string | null) => { cachedToken = token; };

apiClient.interceptors.request.use(
    async (config) => {
        if (!cachedToken) {
            cachedToken = await AsyncStorage.getItem('auth_token');
        }
        if (cachedToken) {
            config.headers.Authorization = `Bearer ${cachedToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default apiClient;
