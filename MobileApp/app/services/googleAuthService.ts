import {GoogleSignin} from "@react-native-google-signin/google-signin";
import apiClient from "../services/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";


const WEB_CLIENT_ID = "999315275608-6iv753scof25lhv0tuo47dmpkpnl9e7m.apps.googleusercontent.com";

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

interface GoogleAuthResponse{
    access_token: string;
    token_type: string;
    user_id: string;
    role: string;
    user_name: string;
    is_new_user: boolean;
}

export const configureGoogleSignIn = () => {
    GoogleSignin.configure({
       webClientId: WEB_CLIENT_ID,
       offlineAccess: true,
       forceCodeForRefreshToken: true,
    });
};


export const signInWithGoogle = async (): Promise<GoogleAuthResponse> => {
    try{
        // check if google play services are available
        await GoogleSignin.hasPlayServices();
        // sign in with google
        const userInfo = await GoogleSignin.signIn();
        // get the ID token
        const idToken = userInfo.data?.idToken;

        if(!idToken){
            throw new Error("No ID token received from Google");
        }

        console.log("google sign in successful, sending to backend");

        // send ID token to the backend  for verification
        const response = await apiClient.post<GoogleAuthResponse>('/auth/google-login',{
           id_token: idToken,
        });
        console.log("backend verification successful");

        // store token  and user data (same as regular login/signup)
        await AsyncStorage.setItem(TOKEN_KEY, response.data.access_token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify({
            user_id: response.data.user_id,
            user_name: response.data.user_name,
            role: response.data.role,
        }));

        return response.data;
    }
    catch (error: any){
        console.error("google sign in error: ", error);

        // Handle different error types
        if (error.code === 'SIGN_IN_CANCELLED') {
            throw new Error('Google sign-in was cancelled');
        } else if (error.code === 'IN_PROGRESS') {
            throw new Error('Google sign-in is already in progress');
        } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
            throw new Error('Google Play Services not available');
        } else if (error.response) {
            // Backend error
            throw new Error(error.response.data.detail || 'Google sign-in failed');
        } else {
            throw new Error(error.message || 'An unexpected error occurred');
        }
    }
}


export const signOutFromGoogle = async(): Promise<void> => {
    try{
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();

        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
    }
    catch (error){
        console.error("error signing out from google: ", error)
    }
}


export const isSignedInWithGoogle = async (): Promise<boolean> =>  {
    try{
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        return token !== null;
    }
    catch (error){
        return false;
    }
}


export const getCurrentGoogleUser = async () => {
    try{
        return await GoogleSignin.getCurrentUser();
    }
    catch (error){
        return null;
    }
}

