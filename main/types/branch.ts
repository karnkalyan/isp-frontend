export type Branch = {
    id: string
    name: string
    code: string
    email: string | null
    phoneNumber: string | null
    address: string | null
    city: string | null
    state: string | null
    zipCode: string | null
    country: string | null
    contactPerson: string | null
    logoUrl: string | null
    isActive: boolean
    isDeleted: boolean
    createdAt: string
    updatedAt: string
    ispId: string
}

export type BranchStats = {
    branch: {
        id: string
        name: string
        code: string
    }
    counts: {
        users: number
        customers: number
        leads: number
        olts: number
        onts: number
        splitters: number
        memberships: number
    }
    customerStats: {
        total: number
        active: number
        pending: number
        draft: number
    }
    leadStats: {
        total: number
        new: number
        contacted: number
        converted: number
    }
}

export type CreateBranchData = {
    name: string
    code: string
    email?: string | null
    phoneNumber?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    zipCode?: string | null
    country?: string | null
    contactPerson?: string | null
    logoUrl?: string | null
    isActive?: boolean
}

export type UpdateBranchData = Partial<CreateBranchData>