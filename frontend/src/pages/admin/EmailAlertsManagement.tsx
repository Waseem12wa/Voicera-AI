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
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  Science as TestIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as CriticalIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { useBreakpoints } from '../../utils/responsive'
import { 
  getEmailAlerts, 
  getAlertTemplates,
  getAlertHistory,
  createEmailAlert,
  updateEmailAlert,
  deleteEmailAlert,
  toggleEmailAlert,
  testEmailAlert,
  getEmailConfig,
  updateEmailConfig,
  testEmailConfig,
  getAlertStats,
  PREDEFINED_ALERTS
} from '../../services/emailAlertsService'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import ErrorMessage from '../../components/feedback/ErrorMessage'
import DataDisplayWidget from '../../components/data/DataDisplayWidget'
import { useNotifications, useAnalytics, useSystemMetrics } from '../../hooks/useDataGenerator'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`alerts-tabpanel-${index}`}
    aria-labelledby={`alerts-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
)

const EmailAlertsManagement: React.FC = () => {
  const theme = useTheme()
  const { isMobile } = useBreakpoints()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Form states
  const [alertForm, setAlertForm] = useState({
    name: '',
    description: '',
    type: 'error',
    condition: {
      metric: 'error_rate',
      operator: 'greater_than',
      threshold: 5,
      duration: 5,
    },
    recipients: [] as string[],
    template: '',
    isActive: true,
    cooldown: 15,
  })

  const [configForm, setConfigForm] = useState({
    smtp: {
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
    },
    from: {
      name: '',
      email: '',
    },
    replyTo: '',
  })

  const [testForm, setTestForm] = useState({
    testRecipients: [] as string[],
  })

  // Queries
  const { data: emailAlerts, isLoading: alertsLoading, error: alertsError } = useQuery({
    queryKey: ['admin', 'alerts', 'email', { type: selectedType, isActive: selectedStatus, search: searchTerm }],
    queryFn: () => getEmailAlerts({ type: selectedType, isActive: selectedStatus, search: searchTerm }),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: alertTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ['admin', 'alerts', 'templates'],
    queryFn: getAlertTemplates,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: alertHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['admin', 'alerts', 'history'],
    queryFn: () => getAlertHistory({}),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: emailConfig, isLoading: configLoading } = useQuery({
    queryKey: ['admin', 'alerts', 'email-config'],
    queryFn: getEmailConfig,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: alertStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'alerts', 'stats'],
    queryFn: () => getAlertStats({}),
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Mutations
  const createAlertMutation = useMutation({
    mutationFn: createEmailAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'email'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'stats'] })
      enqueueSnackbar('Email alert created successfully', { variant: 'success' })
      setAlertDialogOpen(false)
      resetAlertForm()
    },
    onError: () => {
      enqueueSnackbar('Failed to create email alert', { variant: 'error' })
    },
  })

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, alert }: { id: string; alert: any }) => updateEmailAlert(id, alert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'email'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'stats'] })
      enqueueSnackbar('Email alert updated successfully', { variant: 'success' })
      setAlertDialogOpen(false)
      resetAlertForm()
    },
    onError: () => {
      enqueueSnackbar('Failed to update email alert', { variant: 'error' })
    },
  })

  const deleteAlertMutation = useMutation({
    mutationFn: deleteEmailAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'email'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'stats'] })
      enqueueSnackbar('Email alert deleted successfully', { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to delete email alert', { variant: 'error' })
    },
  })

  const toggleAlertMutation = useMutation({
    mutationFn: toggleEmailAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'email'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'stats'] })
      enqueueSnackbar('Email alert toggled successfully', { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to toggle email alert', { variant: 'error' })
    },
  })

  const testAlertMutation = useMutation({
    mutationFn: ({ id, testRecipients }: { id: string; testRecipients?: string[] }) => testEmailAlert(id, testRecipients),
    onSuccess: (result) => {
      enqueueSnackbar(`Test email sent successfully to ${result.sentTo.join(', ')}`, { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to send test email', { variant: 'error' })
    },
  })

  const updateConfigMutation = useMutation({
    mutationFn: updateEmailConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts', 'email-config'] })
      enqueueSnackbar('Email configuration updated successfully', { variant: 'success' })
      setConfigDialogOpen(false)
    },
    onError: () => {
      enqueueSnackbar('Failed to update email configuration', { variant: 'error' })
    },
  })

  const testConfigMutation = useMutation({
    mutationFn: testEmailConfig,
    onSuccess: (result) => {
      enqueueSnackbar(result.message, { variant: result.success ? 'success' : 'error' })
    },
    onError: () => {
      enqueueSnackbar('Failed to test email configuration', { variant: 'error' })
    },
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleCreateAlert = () => {
    setEditingAlert(null)
    resetAlertForm()
    setAlertDialogOpen(true)
  }

  const handleEditAlert = (alert: any) => {
    setEditingAlert(alert)
    setAlertForm({
      name: alert.name,
      description: alert.description,
      type: alert.type,
      condition: alert.condition,
      recipients: alert.recipients,
      template: alert.template,
      isActive: alert.isActive,
      cooldown: alert.cooldown,
    })
    setAlertDialogOpen(true)
  }

  const handleDeleteAlert = (alertId: string) => {
    if (window.confirm('Are you sure you want to delete this email alert?')) {
      deleteAlertMutation.mutate(alertId)
    }
  }

  const handleToggleAlert = (alertId: string) => {
    toggleAlertMutation.mutate(alertId)
  }

  const handleTestAlert = (alertId: string) => {
    testAlertMutation.mutate({ id: alertId, testRecipients: testForm.testRecipients })
  }

  const handleSaveAlert = () => {
    if (editingAlert) {
      updateAlertMutation.mutate({
        id: editingAlert.id,
        alert: alertForm,
      })
    } else {
      createAlertMutation.mutate(alertForm)
    }
  }

  const handleSaveConfig = () => {
    updateConfigMutation.mutate(configForm)
  }

  const handleTestConfig = () => {
    testConfigMutation.mutate(testForm.testRecipients)
  }

  const handleCreateFromTemplate = (template: any) => {
    setAlertForm({
      name: template.name,
      description: template.description,
      type: template.type,
      condition: template.condition,
      recipients: [],
      template: template.id,
      isActive: true,
      cooldown: 15,
    })
    setAlertDialogOpen(true)
  }

  const resetAlertForm = () => {
    setAlertForm({
      name: '',
      description: '',
      type: 'error',
      condition: {
        metric: 'error_rate',
        operator: 'greater_than',
        threshold: 5,
        duration: 5,
      },
      recipients: [],
      template: '',
      isActive: true,
      cooldown: 15,
    })
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <ErrorIcon color="error" />
      case 'warning':
        return <WarningIcon color="warning" />
      case 'info':
        return <InfoIcon color="info" />
      case 'critical':
        return <CriticalIcon color="error" />
      default:
        return <NotificationsIcon color="default" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
        return 'info'
      case 'critical':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'triggered':
        return 'error'
      case 'resolved':
        return 'success'
      case 'acknowledged':
        return 'info'
      default:
        return 'default'
    }
  }

  const filteredAlerts = emailAlerts?.filter(alert =>
    alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const isLoading = alertsLoading || templatesLoading || historyLoading || configLoading || statsLoading

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading email alerts management..." />
  }

  const tabs = [
    { label: 'Email Alerts', icon: <EmailIcon />, count: filteredAlerts.length },
    { label: 'Alert History', icon: <NotificationsIcon />, count: alertHistory?.length || 0 },
    { label: 'Templates', icon: <SettingsIcon />, count: alertTemplates?.length || 0 },
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
            Email Alerts Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure and manage system email alerts and notifications
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Email Configuration">
            <IconButton onClick={() => setConfigDialogOpen(true)} color="primary">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => window.location.reload()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Statistics Overview */}
      {alertStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Total Alerts</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alertStats.totalAlerts} configured
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {alertStats.activeAlerts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Alerts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <NotificationsIcon color="error" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Triggered Today</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alertStats.triggeredToday} alerts
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="error" fontWeight="bold">
                  {alertStats.triggeredToday}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Resolved Today</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alertStats.resolvedToday} alerts
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="success" fontWeight="bold">
                  {alertStats.resolvedToday}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SettingsIcon color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Avg Resolution</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alertStats?.averageResolutionTime?.toFixed(1) || '0.0'} minutes
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="info" fontWeight="bold">
                  {alertStats?.averageResolutionTime?.toFixed(0) || '0'}m
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={selectedType}
                  label="Type"
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="voice">Voice</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={5}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateAlert}
                >
                  Create Alert
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Widgets */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="notifications" title="Recent Alerts" compact />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="analytics" title="Alert Analytics" compact />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="system" title="Email System Status" compact />
        </Box>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="alerts tabs">
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

        {/* Email Alerts Tab */}
        <TabPanel value={activeTab} index={0}>
          {alertsError ? (
            <ErrorMessage message="Failed to load email alerts" />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Alert</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Recipients</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Triggered</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAlerts.map((alert: any) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {alert.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alert.description}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getAlertIcon(alert.type)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {alert.type.toUpperCase()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {alert.condition.metric} {alert.condition.operator} {alert.condition.threshold}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Duration: {alert.condition.duration}min
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {alert.recipients.length} recipients
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alert.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={alert.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {alert.lastTriggered ? new Date(alert.lastTriggered).toLocaleDateString() : 'Never'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Count: {alert.triggerCount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditAlert(alert)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Toggle">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleAlert(alert.id)}
                            color={alert.isActive ? 'warning' : 'success'}
                          >
                            {alert.isActive ? <CancelIcon /> : <CheckIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Test">
                          <IconButton
                            size="small"
                            onClick={() => handleTestAlert(alert.id)}
                            color="info"
                          >
                            <TestIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteAlert(alert.id)}
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
          )}
        </TabPanel>

        {/* Alert History Tab */}
        <TabPanel value={activeTab} index={1}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Alert</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Threshold</TableCell>
                  <TableCell>Triggered At</TableCell>
                  <TableCell>Resolved At</TableCell>
                  <TableCell>Recipients</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alertHistory?.map((history: any) => (
                  <TableRow key={history.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {history.alertName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={history.status}
                        size="small"
                        color={getStatusColor(history.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {history.value}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {history.threshold}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(history.triggeredAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {history.resolvedAt ? new Date(history.resolvedAt).toLocaleString() : 'Not resolved'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {history.recipients.length} recipients
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Templates Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={2}>
            {Object.entries(PREDEFINED_ALERTS).map(([key, template]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getAlertIcon(template.type)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {template.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip
                        label={template.type}
                        size="small"
                        color={getAlertColor(template.type)}
                      />
                      <Chip
                        label={`${template.condition.metric} ${template.condition.operator} ${template.condition.threshold}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleCreateFromTemplate(template)}
                      fullWidth
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Card>

      {/* Alert Dialog */}
      <Dialog
        open={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAlert ? 'Edit Email Alert' : 'Create New Email Alert'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alert Name"
                value={alertForm.name}
                onChange={(e) => setAlertForm({ ...alertForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={alertForm.type}
                  label="Type"
                  onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                >
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="voice">Voice</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={alertForm.description}
                onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={alertForm.condition.metric}
                  label="Metric"
                  onChange={(e) => setAlertForm({
                    ...alertForm,
                    condition: { ...alertForm.condition, metric: e.target.value }
                  })}
                >
                  <MenuItem value="error_rate">Error Rate</MenuItem>
                  <MenuItem value="avg_response_time">Average Response Time</MenuItem>
                  <MenuItem value="cpu_usage">CPU Usage</MenuItem>
                  <MenuItem value="memory_usage">Memory Usage</MenuItem>
                  <MenuItem value="failed_logins">Failed Logins</MenuItem>
                  <MenuItem value="voice_command_failure_rate">Voice Command Failure Rate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select
                  value={alertForm.condition.operator}
                  label="Operator"
                  onChange={(e) => setAlertForm({
                    ...alertForm,
                    condition: { ...alertForm.condition, operator: e.target.value }
                  })}
                >
                  <MenuItem value="greater_than">Greater Than</MenuItem>
                  <MenuItem value="less_than">Less Than</MenuItem>
                  <MenuItem value="equals">Equals</MenuItem>
                  <MenuItem value="not_equals">Not Equals</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Threshold"
                type="number"
                value={alertForm.condition.threshold}
                onChange={(e) => setAlertForm({
                  ...alertForm,
                  condition: { ...alertForm.condition, threshold: parseFloat(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={alertForm.condition.duration}
                onChange={(e) => setAlertForm({
                  ...alertForm,
                  condition: { ...alertForm.condition, duration: parseInt(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cooldown (minutes)"
                type="number"
                value={alertForm.cooldown}
                onChange={(e) => setAlertForm({ ...alertForm, cooldown: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recipients (comma-separated emails)"
                value={alertForm.recipients.join(', ')}
                onChange={(e) => setAlertForm({
                  ...alertForm,
                  recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={alertForm.isActive}
                    onChange={(e) => setAlertForm({ ...alertForm, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveAlert}
            variant="contained"
            disabled={!alertForm.name || !alertForm.description || alertForm.recipients.length === 0}
          >
            {editingAlert ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Configuration Dialog */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Email Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>SMTP Settings</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SMTP Host"
                value={configForm.smtp.host}
                onChange={(e) => setConfigForm({
                  ...configForm,
                  smtp: { ...configForm.smtp, host: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SMTP Port"
                type="number"
                value={configForm.smtp.port}
                onChange={(e) => setConfigForm({
                  ...configForm,
                  smtp: { ...configForm.smtp, port: parseInt(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={configForm.smtp.username}
                onChange={(e) => setConfigForm({
                  ...configForm,
                  smtp: { ...configForm.smtp, username: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={configForm.smtp.password}
                onChange={(e) => setConfigForm({
                  ...configForm,
                  smtp: { ...configForm.smtp, password: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configForm.smtp.secure}
                    onChange={(e) => setConfigForm({
                      ...configForm,
                      smtp: { ...configForm.smtp, secure: e.target.checked }
                    })}
                  />
                }
                label="Use SSL/TLS"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>From Settings</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="From Name"
                value={configForm.from.name}
                onChange={(e) => setConfigForm({
                  ...configForm,
                  from: { ...configForm.from, name: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="From Email"
                type="email"
                value={configForm.from.email}
                onChange={(e) => setConfigForm({
                  ...configForm,
                  from: { ...configForm.from, email: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reply-To Email (Optional)"
                type="email"
                value={configForm.replyTo}
                onChange={(e) => setConfigForm({ ...configForm, replyTo: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTestConfig} variant="outlined">
            Test Configuration
          </Button>
          <Button
            onClick={handleSaveConfig}
            variant="contained"
            disabled={!configForm.smtp.host || !configForm.smtp.username || !configForm.from.email}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmailAlertsManagement
