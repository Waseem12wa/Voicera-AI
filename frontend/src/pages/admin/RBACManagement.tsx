import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  ContentCopy as ContentIcon,
  Support as SupportIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { useBreakpoints } from '../../utils/responsive'
import { 
  getRoles, 
  getPermissions, 
  getUserRoles, 
  createRole, 
  updateRole, 
  deleteRole,
  assignRoleToUser,
  removeRoleFromUser,
  getRBACStats,
  SYSTEM_ROLES
} from '../../services/rbacService'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import ErrorMessage from '../../components/feedback/ErrorMessage'
import DataDisplayWidget from '../../components/data/DataDisplayWidget'
import { useUsers, useAnalytics, useSystemMetrics } from '../../hooks/useDataGenerator'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`rbac-tabpanel-${index}`}
    aria-labelledby={`rbac-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
)

const RBACManagement: React.FC = () => {
  const theme = useTheme()
  const { isMobile } = useBreakpoints()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [userRoleDialogOpen, setUserRoleDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    level: 50,
    permissions: [] as string[],
  })

  const [userRoleForm, setUserRoleForm] = useState({
    userId: '',
    roleId: '',
    expiresAt: '',
  })

  // Queries
  const { data: roles, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['admin', 'rbac', 'roles'],
    queryFn: getRoles,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['admin', 'rbac', 'permissions'],
    queryFn: getPermissions,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: userRoles, isLoading: userRolesLoading } = useQuery({
    queryKey: ['admin', 'rbac', 'user-roles'],
    queryFn: () => getUserRoles(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: rbacStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'rbac', 'stats'],
    queryFn: getRBACStats,
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'roles'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'stats'] })
      enqueueSnackbar('Role created successfully', { variant: 'success' })
      setRoleDialogOpen(false)
      resetRoleForm()
    },
    onError: () => {
      enqueueSnackbar('Failed to create role', { variant: 'error' })
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, role }: { roleId: string; role: any }) => updateRole(roleId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'roles'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'stats'] })
      enqueueSnackbar('Role updated successfully', { variant: 'success' })
      setRoleDialogOpen(false)
      resetRoleForm()
    },
    onError: () => {
      enqueueSnackbar('Failed to update role', { variant: 'error' })
    },
  })

  const deleteRoleMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'roles'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'stats'] })
      enqueueSnackbar('Role deleted successfully', { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to delete role', { variant: 'error' })
    },
  })

  const assignRoleMutation = useMutation({
    mutationFn: assignRoleToUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'user-roles'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'stats'] })
      enqueueSnackbar('Role assigned successfully', { variant: 'success' })
      setUserRoleDialogOpen(false)
      resetUserRoleForm()
    },
    onError: () => {
      enqueueSnackbar('Failed to assign role', { variant: 'error' })
    },
  })

  const removeRoleMutation = useMutation({
    mutationFn: removeRoleFromUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'user-roles'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'stats'] })
      enqueueSnackbar('Role removed successfully', { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to remove role', { variant: 'error' })
    },
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleCreateRole = () => {
    setEditingRole(null)
    resetRoleForm()
    setRoleDialogOpen(true)
  }

  const handleEditRole = (role: any) => {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      description: role.description,
      level: role.level,
      permissions: role.permissions.map((p: any) => p.id),
    })
    setRoleDialogOpen(true)
  }

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteRoleMutation.mutate(roleId)
    }
  }

  const handleSaveRole = () => {
    if (editingRole) {
      updateRoleMutation.mutate({
        roleId: editingRole.id,
        role: roleForm,
      })
    } else {
      createRoleMutation.mutate(roleForm)
    }
  }

  const handleAssignRole = () => {
    assignRoleMutation.mutate({
      userId: userRoleForm.userId,
      roleId: userRoleForm.roleId,
      expiresAt: userRoleForm.expiresAt || undefined,
    })
  }

  const handleRemoveRole = (userRoleId: string) => {
    if (window.confirm('Are you sure you want to remove this role assignment?')) {
      removeRoleMutation.mutate(userRoleId)
    }
  }

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      level: 50,
      permissions: [],
    })
  }

  const resetUserRoleForm = () => {
    setUserRoleForm({
      userId: '',
      roleId: '',
      expiresAt: '',
    })
  }

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'super admin':
        return <AdminIcon color="error" />
      case 'system administrator':
        return <SecurityIcon color="primary" />
      case 'content manager':
        return <ContentIcon color="success" />
      case 'support analyst':
        return <SupportIcon color="info" />
      default:
        return <PersonIcon color="default" />
    }
  }

  const getRoleColor = (level: number) => {
    if (level >= 90) return 'error'
    if (level >= 70) return 'primary'
    if (level >= 50) return 'success'
    return 'default'
  }

  const filteredRoles = roles?.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const isLoading = rolesLoading || permissionsLoading || userRolesLoading || statsLoading

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading RBAC management..." />
  }

  const tabs = [
    { label: 'Roles', icon: <SecurityIcon /> },
    { label: 'User Assignments', icon: <PersonIcon /> },
    { label: 'Permissions', icon: <AdminIcon /> },
  ]

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            RBAC Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage roles, permissions, and user access control
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => window.location.reload()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Statistics Overview */}
      {rbacStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Total Users</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rbacStats.totalUsers} registered
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {rbacStats.totalUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon color="secondary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Roles</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rbacStats.totalRoles} total
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="secondary" fontWeight="bold">
                  {rbacStats.activeRoles}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Roles
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AdminIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Permissions</Typography>
                    <Typography variant="body2" color="text.secondary">
                      System permissions
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="success" fontWeight="bold">
                  {permissions?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckIcon color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Assignments</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active role assignments
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="info" fontWeight="bold">
                  {userRoles?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateRole}
                >
                  Create Role
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PersonIcon />}
                  onClick={() => setUserRoleDialogOpen(true)}
                >
                  Assign Role
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Widgets */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="users" title="User Overview" compact />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="analytics" title="Access Analytics" compact />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="system" title="Security Status" compact />
        </Box>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="rbac tabs">
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Roles Tab */}
        <TabPanel value={activeTab} index={0}>
          {rolesError ? (
            <ErrorMessage message="Failed to load roles" />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Role</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell>Users</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRoles.map((role: any) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getRoleIcon(role.name)}
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {role.name}
                            </Typography>
                            {role.isSystem && (
                              <Chip label="System" size="small" color="primary" />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {role.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`Level ${role.level}`}
                          size="small"
                          color={getRoleColor(role.level)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {role.permissions?.length || 0} permissions
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {userRoles?.filter((ur: any) => ur.roleId === role.id).length || 0} users
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Role">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRole(role)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {!role.isSystem && (
                          <Tooltip title="Delete Role">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRole(role.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* User Assignments Tab */}
        <TabPanel value={activeTab} index={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Assigned By</TableCell>
                  <TableCell>Assigned At</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userRoles?.map((userRole: any) => (
                  <TableRow key={userRole.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        User {userRole.userId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getRoleIcon(userRole.role.name)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {userRole.role.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {userRole.assignedBy}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(userRole.assignedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {userRole.expiresAt ? new Date(userRole.expiresAt).toLocaleDateString() : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={userRole.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={userRole.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Remove Assignment">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveRole(userRole.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Permissions Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={2}>
            {permissions?.map((permission: any) => (
              <Grid item xs={12} sm={6} md={4} key={permission.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {permission.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {permission.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={permission.resource}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={permission.action}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                      <Chip
                        label={permission.category}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Card>

      {/* Role Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRole ? 'Edit Role' : 'Create New Role'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role Name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Level"
                type="number"
                value={roleForm.level}
                onChange={(e) => setRoleForm({ ...roleForm, level: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Permissions
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {permissions?.map((permission: any) => (
                  <FormControlLabel
                    key={permission.id}
                    control={
                      <Checkbox
                        checked={roleForm.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleForm({
                              ...roleForm,
                              permissions: [...roleForm.permissions, permission.id]
                            })
                          } else {
                            setRoleForm({
                              ...roleForm,
                              permissions: roleForm.permissions.filter(id => id !== permission.id)
                            })
                          }
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {permission.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {permission.resource}:{permission.action}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveRole}
            variant="contained"
            disabled={!roleForm.name || !roleForm.description}
          >
            {editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Role Assignment Dialog */}
      <Dialog
        open={userRoleDialogOpen}
        onClose={() => setUserRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Role to User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="User ID"
                value={userRoleForm.userId}
                onChange={(e) => setUserRoleForm({ ...userRoleForm, userId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userRoleForm.roleId}
                  label="Role"
                  onChange={(e) => setUserRoleForm({ ...userRoleForm, roleId: e.target.value })}
                >
                  {roles?.map((role: any) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name} (Level {role.level})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expires At (Optional)"
                type="datetime-local"
                value={userRoleForm.expiresAt}
                onChange={(e) => setUserRoleForm({ ...userRoleForm, expiresAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignRole}
            variant="contained"
            disabled={!userRoleForm.userId || !userRoleForm.roleId}
          >
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RBACManagement
