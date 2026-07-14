export type Department = {
    id: string
    name: string
    description: string | null
    isActive: boolean
    isDeleted: boolean
    branchId: string | null
    createdAt: string
    updatedAt: string
    _count?: {
        users: number
    }
    users?: Array<{
        id: string
        name: string | null
        email: string
        status: string
    }>
    branch?: {
        id: string
        name: string
        code: string
    } | null
}

export type DepartmentStats = {
    department: {
        id: string
        name: string
        description: string | null
        isActive: boolean
        createdAt: string
    }
    counts: {
        users: number
    }
    userStats: {
        total: number
        active: number
        inactive: number
        pending: number
        disabled: number
        withRole: number
        withoutRole: number
        loggedInLast30Days: number
    }
}

export type CreateDepartmentData = {
    name: string
    description?: string | null
    isActive?: boolean
    branchId?: string | null
}

export type UpdateDepartmentData = Partial<CreateDepartmentData>