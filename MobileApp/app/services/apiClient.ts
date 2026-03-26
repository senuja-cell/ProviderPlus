import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- CONFIGURATION ---
export const LAPTOP_IP = '192.168.1.4';

const IS_LOCAL = true;

const BASE_URL = IS_LOCAL
    ? `http://${LAPTOP_IP}:8001/api`
    : `https://providerplus-production.up.railway.app/api`;

console.log("🔗 Connecting to Backend at:", BASE_URL);

// 3. Create the Axios Instance
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 70000, // Wait 10 seconds before failing
    headers: {
        'Content-Type': 'application/json',
    }
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default apiClient;
