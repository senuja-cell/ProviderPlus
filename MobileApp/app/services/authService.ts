import apiClient from "./apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SignupData{
    email: string;
    password: string;
    full_name: string;
    phone_number: string;
    role: 'customer' | 'provider';
}

interface LoginData{
    email: string;
    password: string;
}

interface AuthResponse{
    access_token: string;
    token_type: string;
    user_id: string;
    role: string;
    user_name: string;
}

const TOKEN_KEY  = 'auth_token';
const USER_KEY = 'user_data';

// THIS IS FOR SIGN UP
export const signupUser = async(data: SignupData):  Promise<AuthResponse>  =>  {
    try{
        const response = await apiClient.post<AuthResponse>('/auth/signup', data);

        await AsyncStorage.setItem(TOKEN_KEY, response.data.access_token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify({
            user_id: response.data.user_id,
            user_name: response.data.user_name,
            role: response.data.role,
        }));

        return response.data
    }
    catch (error: any){
        if(error.response){
            throw new Error(error.response.data.detail || "Signup failed");
        }
        else if(error.request){
            throw new Error("Cannot connect to the server. Please check your internet connection");
        }
        else{
            throw new Error("An unexpected error occurred");
        }
    }
}

// THIS IS FOR LOGIN
export const loginUser = async(data: LoginData): Promise<AuthResponse> => {

    try{

        const response = await apiClient.post<AuthResponse>('auth/login', data);

        await AsyncStorage.setItem(TOKEN_KEY, response.data.access_token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify({
            user_id: response.data.user_id,
            user_name: response.data.user_name,
            role: response.data.role
        }))
        return response.data

    }
    catch(error: any){
        if(error.response){
            throw new Error(error.response.data.detail || "Login failed");
        }
        else if(error.request){
            throw new Error("Cannot connect to the server. Please check your internet connection.");
        }
        else{
            throw new Error("An unexpected error occurred");
        }
    }
}


// THIS IS FOR LOGOUT
export const logoutUser = async(): Promise<void> => {
    try{
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
    }
    catch(error){
        console.error("error during logout: ", error);
    }
}


// THIS IS FOR GETTING THE TOKEN
export const getAuthToken =  async(): Promise<string | null> => {
    try{
        return await AsyncStorage.getItem(TOKEN_KEY);
    }
    catch(error){
        console.error("error getting token: ", error);
        return null;
    }
}


// THIS IS FOR GETTING USER DATA
export const getUserData = async(): Promise<any | null> => {
    try{
        const userData = await AsyncStorage.getItem(USER_KEY);
        return userData ? JSON.parse(userData) : null;
    }
    catch(error){
        console.error('error getting user data: ', error);
        return null;
    }
}


// THIS IS FOR CHECKING IF LOGGED IN
export  const isLoggedIn = async(): Promise<boolean> => {
    try{
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        return token !== null;
    }
    catch(error){
        return false;
    }
}



