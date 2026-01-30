// types/service.types.ts
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

export interface ServiceCredential {
    id?: number;
    credentialType: CredentialType;
    key: string;
    value: string;
    label: string;
    isEncrypted: boolean;
    description?: string;
    isActive?: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Service {
    id: number;
    name: string;
    code: string;
    description: string;
    iconUrl: string;
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
    config?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    service: Service;
    credentials: ServiceCredential[];
    credentialCount: number;
}

export interface ServiceStatus {
    code: string;
    name?: string;
    enabled: boolean;
    configured: boolean;
    isActive?: boolean;
    isEnabled?: boolean;
    baseUrl?: string;
    hasCredentials?: boolean;
    hasValidCredentials?: boolean;
    serviceName?: string;
    lastUpdated?: string;
    error?: string;
    message?: string;
}

export interface ServiceTestResult {
    connected: boolean;
    message: string;
    data?: any;
    timestamp: string;
}

export interface ServiceCatalogFilters {
    category?: ServiceCategory;
    search?: string;
    isActive?: boolean;
}

export interface ServiceConnectionConfig {
    serviceCode: string;
    baseUrl?: string;
    apiVersion?: string;
    config?: Record<string, any>;
    isActive?: boolean;
}