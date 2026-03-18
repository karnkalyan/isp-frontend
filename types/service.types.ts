// types/service.types.ts
// Add this file if it doesn't exist
export interface Service {
    id: number;
    name: string;
    code: string;
    description: string;
    iconUrl?: string;
    category: ServiceCategory;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        ispServices: number;
    };
}

export interface ISPService {
    id: number;
    ispId: number;
    serviceId: number;
    isActive: boolean;
    isEnabled: boolean;
    isDeleted: boolean;
    baseUrl?: string;
    apiVersion: string;
    config?: any;
    createdAt: string;
    updatedAt: string;
    service: Service;
    credentials: ServiceCredential[];
    credentialCount: number;
}

export interface ServiceCredential {
    id: number;
    credentialType: CredentialType;
    key: string;
    value: string;
    label?: string;
    isEncrypted: boolean;
    description?: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceStatus {
    code: string;
    serviceName?: string;
    enabled: boolean;
    configured: boolean;
    baseUrl?: string;
    isActive?: boolean;
    isEnabled?: boolean;
    hasCredentials?: boolean;
    hasValidCredentials?: boolean;
    message?: string;
    error?: string;
}

export interface ServiceTestResult {
    connected: boolean;
    message: string;
    timestamp: string;
    data?: any;
}

export type ServiceCategory =
    | 'BILLING'
    | 'AUTHENTICATION'
    | 'PAYMENT'
    | 'STREAMING'
    | 'NETWORK'
    | 'VOIP'
    | 'SECURITY'
    | 'COMMUNICATION'
    | 'OTHER';

export type CredentialType =
    | 'api_key'
    | 'username_password'
    | 'app_key_secret'
    | 'oauth2'
    | 'token'
    | 'ssh_key';