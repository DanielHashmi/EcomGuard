import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_BACKEND_PORT = '8000';

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '');

const getExpoHost = () => {
  const constants = Constants as any;
  const hostUri =
    constants.expoConfig?.hostUri ||
    constants.manifest2?.extra?.expoClient?.hostUri ||
    constants.manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') {
    return null;
  }

  return hostUri.replace(/^https?:\/\//, '').split(':')[0] || null;
};

export const getApiUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  console.log('[API Config] EXPO_PUBLIC_API_URL:', configuredUrl);
  console.log('[API Config] Platform.OS:', Platform.OS);
  
  if (configuredUrl) {
    console.log('[API Config] Using configured URL:', configuredUrl);
    return trimTrailingSlash(configuredUrl);
  }

  if (Platform.OS === 'web') {
    const url = `http://localhost:${DEFAULT_BACKEND_PORT}`;
    console.log('[API Config] Using web default:', url);
    return url;
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    const url = `http://${expoHost}:${DEFAULT_BACKEND_PORT}`;
    console.log('[API Config] Using Expo host:', url);
    return url;
  }

  const fallbackUrl = `http://localhost:${DEFAULT_BACKEND_PORT}`;
  console.log('[API Config] Using fallback:', fallbackUrl);
  return fallbackUrl;
};

export const API_URL = getApiUrl();
console.log('[API Config] Final API_URL:', API_URL);
