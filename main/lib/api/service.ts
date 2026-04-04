import { apiRequest } from '../api';
import toast from 'react-hot-toast';

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

export interface BulkOperationResult {
    serviceCode: string;
    status: 'success' | 'error';
    message: string;
    connected?: boolean;
}

export interface ServiceAnalytics {
    totalServices: number;
    activeServices: number;
    configuredServices: number;
    servicesByCategory: Array<{ category: string; _count: { id: number } }>;
    recentActivities: Array<{
        id: number;
        serviceName: string;
        serviceCode: string;
        status: string;
        lastUpdated: string;
        isConfigured: boolean;
    }>;
    analytics: {
        configurationRate: number;
        activationRate: number;
    };
}

export interface TestAllResult {
    serviceCode: string;
    serviceName: string;
    connected: boolean;
    message: string;
    timestamp: string;
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

// API Service - COMPLETE WITH ALL ENDPOINTS
export const ServicesAPI = {
    // ==================== SERVICE CATALOG ====================
    async getServicesCatalog(filters?: { category?: ServiceCategory; search?: string }) {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);

        const query = params.toString() ? `?${params.toString()}` : '';
        return apiRequest<{ success: boolean; data: Service[] }>(`/services/catalog${query}`);
    },

    async getServiceByCode(code: string) {
        return apiRequest<{ success: boolean; data: Service }>(`/services/catalog/${code}`);
    },

    // ==================== ISP SERVICE MANAGEMENT ====================
    async getISPServices(includeInactive = false) {
        const query = includeInactive ? '?includeInactive=true' : '';
        return apiRequest<{ success: boolean; data: ISPService[] }>(`/services/isp${query}`);
    },

    async configureService(data: {
        serviceCode: string;
        baseUrl?: string;
        apiVersion?: string;
        config?: any;
        isActive?: boolean;
    }) {
        return apiRequest<{ success: boolean; data: ISPService; message: string }>('/services/isp/configure', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async setServiceCredentials(serviceCode: string, credentials: any[]) {
        return apiRequest<{ success: boolean; message: string }>(
            `/services/isp/${serviceCode}/credentials`,
            {
                method: 'POST',
                body: JSON.stringify({ credentials }),
            }
        );
    },

    async testServiceConnection(serviceCode: string) {
        return apiRequest<{ success: boolean; connected: boolean; message: string; timestamp?: string }>(
            `/services/isp/${serviceCode}/test`
        );
    },

    async getServiceStatus(serviceCode: string) {
        return apiRequest<{ success: boolean; data: ServiceStatus }>(
            `/services/isp/status/${serviceCode}`
        );
    },

    async getAllServiceStatuses() {
        return apiRequest<{ success: boolean; data: ServiceStatus[] }>('/services/isp/status');
    },

    async toggleServiceActivation(serviceCode: string, isActive: boolean) {
        return apiRequest<{ success: boolean; data: ISPService; message: string }>(
            `/services/isp/${serviceCode}/activation`,
            {
                method: 'PATCH',
                body: JSON.stringify({ isActive }),
            }
        );
    },

    // ==================== PROVISIONING & BULK OPERATIONS ====================
    async provisionDefaultServices() {
        return apiRequest<{ success: boolean; message: string; data: any }>('/services/provision/default', {
            method: 'POST'
        });
    },

    async enableAllServices() {
        return apiRequest<{ success: boolean; message: string }>('/services/enable-all', {
            method: 'POST'
        });
    },

    async disableAllServices() {
        return apiRequest<{ success: boolean; message: string }>('/services/disable-all', {
            method: 'POST'
        });
    },

    async testAllServices() {
        return apiRequest<{
            success: boolean;
            data: TestAllResult[];
            summary: {
                total: number;
                connected: number;
                failed: number;
                successRate: number;
            }
        }>('/services/test-all', {
            method: 'POST'
        });
    },

    async bulkOperations(operation: string, serviceCodes: string[]) {
        return apiRequest<{
            success: boolean;
            data: BulkOperationResult[];
            summary: {
                total: number;
                success: number;
                failed: number;
            }
        }>('/services/bulk-operations', {
            method: 'POST',
            body: JSON.stringify({ operation, serviceCodes })
        });
    },

    async getServiceAnalytics() {
        return apiRequest<{ success: boolean; data: ServiceAnalytics }>('/services/analytics');
    },

    // ==================== SERVICE-SPECIFIC OPERATIONS ====================

    // NetTV Operations
    async getNetTVSubscribers(page = 1, perPage = 20, search?: string) {
        const params = new URLSearchParams({
            page: page.toString(),
            perPage: perPage.toString(),
        });
        if (search) params.append('search', search);

        return apiRequest<{ success: boolean; data: any }>(
            `/services/nettv/subscribers?${params.toString()}`
        );
    },

    async getNetTVSubscriber(username: string) {
        return apiRequest<{ success: boolean; data: any }>(
            `/services/nettv/subscribers/${username}`
        );
    },

    async createNetTVSubscriber(subscriberData: any) {
        return apiRequest<{ success: boolean; data: any }>('/services/nettv/subscribers', {
            method: 'POST',
            body: JSON.stringify(subscriberData)
        });
    },

    // Mikrotik Operations
    async getMikrotikResources() {
        return apiRequest<{ success: boolean; data: any }>('/services/mikrotik/resources');
    },

    async getMikrotikInterfaces() {
        return apiRequest<{ success: boolean; data: any }>('/services/mikrotik/interfaces');
    },

    async getMikrotikDHCPLeases() {
        return apiRequest<{ success: boolean; data: any }>('/services/mikrotik/dhcp-leases');
    },

    // Yeastar Operations
    async getYeastarExtensions() {
        return apiRequest<{ success: boolean; data: any }>('/services/yeastar/extensions');
    },

    async getYeastarActiveCalls() {
        return apiRequest<{ success: boolean; data: any }>('/services/yeastar/active-calls');
    },

    async getYeastarSystemInfo() {
        return apiRequest<{ success: boolean; data: any }>('/services/yeastar/system-info');
    },

    // Tshul Operations
    async getTshulCustomers(page = 1, limit = 20) {
        return apiRequest<{ success: boolean; data: any }>(
            `/services/tshul/customers?page=${page}&limit=${limit}`
        );
    },

    async createTshulCustomer(customerData: any) {
        return apiRequest<{ success: boolean; data: any }>('/services/tshul/customers', {
            method: 'POST',
            body: JSON.stringify(customerData)
        });
    },

    // Radius Operations
    async getRadiusUsers(limit = 100, offset = 0) {
        return apiRequest<{ success: boolean; data: any }>(
            `/services/radius/users?limit=${limit}&offset=${offset}`
        );
    },

    async createRadiusUser(username: string, password: string, attributes?: any) {
        return apiRequest<{ success: boolean; data: any }>('/services/radius/users', {
            method: 'POST',
            body: JSON.stringify({ username, password, attributes })
        });
    },

    async deleteRadiusUser(username: string) {
        return apiRequest<{ success: boolean; data: any }>(
            `/services/radius/users/${username}`,
            { method: 'DELETE' }
        );
    },

    // eSewa Operations
    async processEsewaPayment(paymentData: any) {
        return apiRequest<{ success: boolean; data: any }>('/services/esewa/payment', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    },

    async verifyEsewaPayment(transactionId: string) {
        return apiRequest<{ success: boolean; data: any }>(
            `/services/esewa/payment/verify/${transactionId}`
        );
    },

    // Khalti Operations
    async processKhaltiPayment(paymentData: any) {
        return apiRequest<{ success: boolean; data: any }>('/services/khalti/payment', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    },

    async verifyKhaltiPayment(token: string) {
        return apiRequest<{ success: boolean; data: any }>(
            `/services/khalti/payment/verify/${token}`
        );
    },

    // Health Check
    async getServicesHealth() {
        return apiRequest<{
            status: string;
            timestamp: string;
            version: string;
            services: Record<string, string>;
        }>('/services/health');
    }
};