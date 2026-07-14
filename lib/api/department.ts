import { apiRequest } from "../api"
import { Department, DepartmentStats, CreateDepartmentData, UpdateDepartmentData } from "@/types/department"

export const departmentApi = {
    // Get all departments
    getAll: async (params?: {
        page?: number;
        limit?: number;
        includeInactive?: boolean;
        branchId?: string;
        search?: string;
    }) => {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.includeInactive) queryParams.append('includeInactive', 'true');
        if (params?.branchId) queryParams.append('branchId', params.branchId);
        if (params?.search) queryParams.append('search', params.search);

        const queryString = queryParams.toString();
        const url = queryString ? `/department?${queryString}` : '/department';

        const response = await apiRequest(url);
        return response;
    },


    // Get single department by ID
    async getById(id: string): Promise<Department> {
        return await apiRequest(`/department/${id}`)
    },

    // Create new department
    async create(data: CreateDepartmentData): Promise<Department> {
        return await apiRequest("/department", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    // Update department
    async update(id: string, data: UpdateDepartmentData): Promise<Department> {
        return await apiRequest(`/department/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        })
    },

    // Soft delete department
    async delete(id: string): Promise<{ message: string; id: string; name: string }> {
        return await apiRequest(`/department/${id}`, {
            method: "DELETE",
        })
    },

    // Restore department
    async restore(id: string): Promise<Department> {
        return await apiRequest(`/department/${id}/restore`, {
            method: "POST",
        })
    },

    // Get department statistics
    async getStats(id: string): Promise<DepartmentStats> {
        return await apiRequest(`/department/${id}/stats`)
    },

    // Get deleted departments
    async getDeleted(params?: {
        page?: number;
        limit?: number;
    }) {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const queryString = queryParams.toString();
        const url = queryString ? `/department/deleted?${queryString}` : '/department/deleted';

        const response = await apiRequest(url);
        return response;
    },

    // Toggle department status
    async toggleStatus(id: string): Promise<{ message: string; department: Department }> {
        return await apiRequest(`/department/${id}/toggle-status`, {
            method: "PATCH",
        })
    },

    // Search departments
    async search(query: string, params?: {
        page?: number;
        limit?: number;
        includeInactive?: boolean;
        branchId?: string;
    }) {
        const queryParams = new URLSearchParams();
        queryParams.append('search', query);

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.includeInactive) queryParams.append('includeInactive', 'true');
        if (params?.branchId) queryParams.append('branchId', params.branchId);

        const url = `/department/search?${queryParams.toString()}`;
        const response = await apiRequest(url);
        return response;
    },

    // Add user to department
    async addUser(departmentId: string, userId: string): Promise<any> {
        return await apiRequest(`/department/${departmentId}/users`, {
            method: "POST",
            body: JSON.stringify({ userId }),
        })
    },

    // Remove user from department
    async removeUser(departmentId: string, userId: string): Promise<any> {
        return await apiRequest(`/department/${departmentId}/users`, {
            method: "DELETE",
            body: JSON.stringify({ userId }),
        })
    }
}