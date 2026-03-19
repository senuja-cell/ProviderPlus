import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- CONFIGURATION ---
// 1. REPLACE THIS with the IP you found in Step 1
// This is safe for dev because it's a local address.
export const LAPTOP_IP = '192.168.1.5'; //

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
    timeout: 30000, // Wait 10 seconds before failing
    headers: {
        'Content-Type': 'application/json',
    }
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

export default apiClient;
