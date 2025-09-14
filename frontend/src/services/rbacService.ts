import { apiClient } from './apiClient'

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string
  category: 'system' | 'content' | 'users' | 'analytics' | 'logs'
}

export interface Role {
  id: string
  name: string
  description: string
  level: number
  permissions: Permission[]
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface UserRole {
  id: string
  userId: string
  roleId: string
  role: Role
  assignedBy: string
  assignedAt: string
  expiresAt?: string
  isActive: boolean
}

export interface RBACStats {
  totalUsers: number
  totalRoles: number
  activeRoles: number
  permissionDistribution: Array<{ permission: string; count: number }>
  roleDistribution: Array<{ role: string; count: number }>
}

// Predefined system roles
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    level: 100,
    permissions: ['*'] // All permissions
  },
  SYSTEM_ADMIN: {
    name: 'System Administrator',
    description: 'System administration and monitoring',
    level: 90,
    permissions: [
      'system:monitor',
      'system:configure',
      'logs:read',
      'logs:export',
      'analytics:read',
      'users:read',
      'users:manage',
      'content:read',
      'content:manage'
    ]
  },
  CONTENT_MANAGER: {
    name: 'Content Manager',
    description: 'Content and application text management',
    level: 70,
    permissions: [
      'content:read',
      'content:create',
      'content:update',
      'content:delete',
      'pages:read',
      'pages:create',
      'pages:update',
      'pages:delete',
      'voice:commands:read',
      'voice:commands:manage'
    ]
  },
  SUPPORT_ANALYST: {
    name: 'Support Analyst',
    description: 'User support and basic monitoring',
    level: 50,
    permissions: [
      'users:read',
      'logs:read',
      'analytics:read',
      'sessions:read',
      'errors:read',
      'errors:resolve'
    ]
  }
}

// Permissions
export const getPermissions = async (): Promise<Permission[]> => {
  const response = await apiClient.get('/admin/rbac/permissions')
  return response.data
}

export const createPermission = async (permission: Omit<Permission, 'id'>): Promise<Permission> => {
  const response = await apiClient.post('/admin/rbac/permissions', permission)
  return response.data
}

export const updatePermission = async (id: string, permission: Partial<Permission>): Promise<Permission> => {
  const response = await apiClient.put(`/admin/rbac/permissions/${id}`, permission)
  return response.data
}

export const deletePermission = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/rbac/permissions/${id}`)
}

// Roles
export const getRoles = async (): Promise<Role[]> => {
  const response = await apiClient.get('/admin/rbac/roles')
  return response.data
}

export const getRoleById = async (roleId: string): Promise<Role> => {
  const response = await apiClient.get(`/admin/rbac/roles/${roleId}`)
  return response.data
}

export const createRole = async (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> => {
  const response = await apiClient.post('/admin/rbac/roles', role)
  return response.data
}

export const updateRole = async (roleId: string, role: Partial<Role>): Promise<Role> => {
  const response = await apiClient.put(`/admin/rbac/roles/${roleId}`, role)
  return response.data
}

export const deleteRole = async (roleId: string): Promise<void> => {
  await apiClient.delete(`/admin/rbac/roles/${roleId}`)
}

export const assignPermissionsToRole = async (roleId: string, permissionIds: string[]): Promise<void> => {
  await apiClient.post(`/admin/rbac/roles/${roleId}/permissions`, { permissionIds })
}

// User Roles
export const getUserRoles = async (userId?: string): Promise<UserRole[]> => {
  const response = await apiClient.get('/admin/rbac/user-roles', { 
    params: userId ? { userId } : {} 
  })
  return response.data
}

export const assignRoleToUser = async (userId: string, roleId: string, expiresAt?: string): Promise<UserRole> => {
  const response = await apiClient.post('/admin/rbac/user-roles', {
    userId,
    roleId,
    expiresAt
  })
  return response.data
}

export const removeRoleFromUser = async (userRoleId: string): Promise<void> => {
  await apiClient.delete(`/admin/rbac/user-roles/${userRoleId}`)
}

export const updateUserRole = async (userRoleId: string, updates: Partial<UserRole>): Promise<UserRole> => {
  const response = await apiClient.put(`/admin/rbac/user-roles/${userRoleId}`, updates)
  return response.data
}

// RBAC Statistics
export const getRBACStats = async (): Promise<RBACStats> => {
  try {
    const response = await apiClient.get('/admin/rbac/stats')
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return {
        totalUsers: 0,
        totalRoles: 0,
        activeRoles: 0,
        permissionDistribution: [],
        roleDistribution: []
      }
    }
    throw error
  }
}

// Permission checking utilities
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  if (userPermissions.includes('*')) return true
  return userPermissions.includes(requiredPermission)
}

export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  if (userPermissions.includes('*')) return true
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}

export const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  if (userPermissions.includes('*')) return true
  return requiredPermissions.every(permission => userPermissions.includes(permission))
}

// Role level checking
export const hasRoleLevel = (userRoleLevel: number, requiredLevel: number): boolean => {
  return userRoleLevel >= requiredLevel
}

// Resource-based permission checking
export const canAccessResource = (
  userPermissions: string[],
  resource: string,
  action: string
): boolean => {
  const permission = `${resource}:${action}`
  return hasPermission(userPermissions, permission) || hasPermission(userPermissions, '*')
}
