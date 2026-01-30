// lib/services.ts
import { apiRequest } from "@/lib/api";
import {
    Service,
    ISPService,
    ServiceStatus,
    ServiceTestResult,
    ServiceCredential,
    ServiceCatalogFilters,
    ServiceConnectionConfig
} from "@/types/service.types";

export class ServicesAPI {
    // Get all services catalog
    static async getServicesCatalog(filters?: ServiceCatalogFilters) {
        const params = new URLSearchParams();

        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

        const query = params.toString() ? `?${params.toString()}` : '';
        return await apiRequest<{ data: Service[]; meta: any }>(`/services/catalog${query}`);
    }

    // Get service by code
    static async getServiceByCode(code: string) {
        return await apiRequest<{ data: Service & { defaultCredentials: any } }>(`/services/catalog/${code}`);
    }

    // Get ISP's active services
    static async getISPServices(includeInactive?: boolean) {
        const query = includeInactive ? '?includeInactive=true' : '';
        return await apiRequest<{ data: ISPService[]; meta: any }>(`/services/isp${query}`);
    }

    // Get all service statuses for ISP
    static async getAllServiceStatuses() {
        return await apiRequest<{ data: ServiceStatus[]; meta: any }>('/services/isp/status');
    }

    // Get specific service status
    static async getServiceStatus(serviceCode: string) {
        return await apiRequest<{ data: ServiceStatus }>(`/services/isp/status/${serviceCode}`);
    }

    // Configure service for ISP
    static async configureService(config: ServiceConnectionConfig) {
        return await apiRequest<{ data: ISPService; message: string }>('/services/isp/configure', {
            method: 'POST',
            body: config
        });
    }

    // Set service credentials
    static async setServiceCredentials(serviceCode: string, credentials: ServiceCredential[]) {
        return await apiRequest(`/services/isp/${serviceCode}/credentials`, {
            method: 'POST',
            body: { credentials }
        });
    }

    // Toggle service activation
    static async toggleServiceActivation(serviceCode: string, isActive: boolean) {
        return await apiRequest<{ data: ISPService; message: string }>(`/services/isp/${serviceCode}/activation`, {
            method: 'PATCH',
            body: { isActive }
        });
    }

    // Test service connection
    static async testServiceConnection(serviceCode: string) {
        return await apiRequest<ServiceTestResult>(`/services/isp/${serviceCode}/test`);
    }

    // Service-specific operations

    // NetTV: Get subscribers
    static async getNetTVSubscribers(page: number = 1, perPage: number = 20, search?: string) {
        const params = new URLSearchParams({
            page: page.toString(),
            perPage: perPage.toString()
        });
        if (search) params.append('search', search);

        return await apiRequest<{ data: any }>(`/services/nettv/subscribers?${params.toString()}`);
    }

    // NetTV: Get subscriber details
    static async getNetTVSubscriber(username: string) {
        return await apiRequest<{ data: any }>(`/services/nettv/subscribers/${username}`);
    }

    // Mikrotik: Get resources
    static async getMikrotikResources() {
        return await apiRequest<{ data: any }>('/services/mikrotik/resources');
    }

    // Yeastar: Get extensions
    static async getYeastarExtensions() {
        return await apiRequest<{ data: any }>('/services/yeastar/extensions');
    }

    // Yeastar: Get active calls
    static async getYeastarActiveCalls() {
        return await apiRequest<{ data: any }>('/services/yeastar/active-calls');
    }

    // Tshul: Get customers
    static async getTshulCustomers(page: number = 1, limit: number = 20) {
        return await apiRequest<{ data: any }>(`/services/tshul/customers?page=${page}&limit=${limit}`);
    }

    // Radius: Get users
    static async getRadiusUsers(limit: number = 100, offset: number = 0) {
        return await apiRequest<{ data: any }>(`/services/radius/users?limit=${limit}&offset=${offset}`);
    }
}