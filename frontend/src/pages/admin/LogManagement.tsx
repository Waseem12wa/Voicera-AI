import React, { useState, useEffect } from 'react'
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
  Divider,
  Badge,
  useTheme,
  alpha,
  Alert,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  CheckCircle as ResolveIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Dangerous as CriticalIcon,
  Person as PersonIcon,
  VoiceOverOff as VoiceIcon,
  Speed as PerformanceIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { format } from 'date-fns'
import { useBreakpoints } from '../../utils/responsive'
import { 
  getUserSessions, 
  getVoiceCommands, 
  getSystemErrors, 
  getLogStats,
  exportLogs,
  resolveError,
  terminateSession
} from '../../services/loggingService'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import ErrorMessage from '../../components/feedback/ErrorMessage'
import DataDisplayWidget from '../../components/data/DataDisplayWidget'
import { useNotifications, useSystemMetrics, useStatistics } from '../../hooks/useDataGenerator'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`logs-tabpanel-${index}`}
    aria-labelledby={`logs-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
)

const LogManagement: React.FC = () => {
  const theme = useTheme()
  const { isMobile } = useBreakpoints()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [selectedError, setSelectedError] = useState<any>(null)
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState('7d')

  const dateRanges = {
    '1d': { label: 'Last 24 Hours', days: 1 },
    '7d': { label: 'Last 7 Days', days: 7 },
    '30d': { label: 'Last 30 Days', days: 30 },
    '90d': { label: 'Last 90 Days', days: 90 },
  }

  const getDateRange = () => {
    const days = dateRanges[dateRange as keyof typeof dateRanges].days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  }

  const query = {
    ...getDateRange(),
    search: searchTerm || undefined,
    level: selectedLevel || undefined,
    category: selectedCategory || undefined,
    limit: 50,
  }

  // Queries
  const { data: logStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'log-stats'],
    queryFn: () => getLogStats(query),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = useQuery({
    queryKey: ['admin', 'sessions', query],
    queryFn: () => getUserSessions(query),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: voiceCommands, isLoading: voiceLoading, error: voiceError } = useQuery({
    queryKey: ['admin', 'voice-commands', query],
    queryFn: () => getVoiceCommands(query),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: errors, isLoading: errorsLoading, error: errorsError } = useQuery({
    queryKey: ['admin', 'errors', query],
    queryFn: () => getSystemErrors(query),
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Mutations
  const resolveErrorMutation = useMutation({
    mutationFn: ({ errorId, resolvedBy }: { errorId: string; resolvedBy: string }) =>
      resolveError(errorId, resolvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'errors'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'log-stats'] })
      enqueueSnackbar('Error resolved successfully', { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to resolve error', { variant: 'error' })
    },
  })

  const terminateSessionMutation = useMutation({
    mutationFn: (sessionId: string) => terminateSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'log-stats'] })
      enqueueSnackbar('Session terminated successfully', { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to terminate session', { variant: 'error' })
    },
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleSearch = () => {
    // Trigger refetch with new search parameters
    queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'voice-commands'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'errors'] })
  }

  const handleExport = async (type: 'sessions' | 'voice-commands' | 'errors', format: 'csv' | 'pdf') => {
    try {
      const blob = await exportLogs(type, format, query)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}-${dateRange}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      enqueueSnackbar(`Exported ${type} as ${format.toUpperCase()}`, { variant: 'success' })
    } catch (error) {
      enqueueSnackbar('Failed to export logs', { variant: 'error' })
    }
  }

  const handleViewSession = (session: any) => {
    setSelectedSession(session)
    setSessionDialogOpen(true)
  }

  const handleViewError = (error: any) => {
    setSelectedError(error)
    setErrorDialogOpen(true)
  }

  const handleResolveError = (errorId: string) => {
    resolveErrorMutation.mutate({ errorId, resolvedBy: 'current-user' })
    setErrorDialogOpen(false)
  }

  const handleTerminateSession = (sessionId: string) => {
    terminateSessionMutation.mutate(sessionId)
    setSessionDialogOpen(false)
  }

  const getErrorIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <CriticalIcon color="error" />
      case 'error':
        return <ErrorIcon color="error" />
      case 'warning':
        return <WarningIcon color="warning" />
      default:
        return <InfoIcon color="info" />
    }
  }

  const getErrorColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'error'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      default:
        return 'info'
    }
  }

  const isLoading = statsLoading || sessionsLoading || voiceLoading || errorsLoading

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading log management..." />
  }

  const tabs = [
    { label: 'User Sessions', icon: <PersonIcon />, count: sessions?.length || 0 },
    { label: 'Voice Commands', icon: <VoiceIcon />, count: voiceCommands?.length || 0 },
    { label: 'System Errors', icon: <ErrorIcon />, count: errors?.length || 0 },
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
            Log Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage system logs, sessions, and errors
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
      {logStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Sessions</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {logStats.totalSessions} total
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {logStats.activeSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Now
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <VoiceIcon color="secondary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Voice Commands</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {logStats.voiceCommands} processed
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="secondary" fontWeight="bold">
                  {logStats.averageSessionDuration.toFixed(0)}m
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Session Duration
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ErrorIcon color="error" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Errors</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {logStats.totalErrors} total
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="error" fontWeight="bold">
                  {logStats.criticalErrors}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critical Errors
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PerformanceIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Error Rate</Typography>
                    <Typography variant="body2" color="text.secondary">
                      System health indicator
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color={logStats.errorRate > 5 ? 'error' : 'success'} fontWeight="bold">
                  {logStats.errorRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Rate
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
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Date Range"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  {Object.entries(dateRanges).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Level</InputLabel>
                <Select
                  value={selectedLevel}
                  label="Level"
                  onChange={(e) => setSelectedLevel(e.target.value)}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="authentication">Authentication</MenuItem>
                  <MenuItem value="api">API</MenuItem>
                  <MenuItem value="database">Database</MenuItem>
                  <MenuItem value="voice">Voice</MenuItem>
                  <MenuItem value="ui">UI</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                fullWidth
              >
                Search
              </Button>
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
          <DataDisplayWidget type="system" title="System Status" compact />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="statistics" title="Log Statistics" compact />
        </Box>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="logs tabs">
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

        {/* User Sessions Tab */}
        <TabPanel value={activeTab} index={0}>
          {sessionsError ? (
            <ErrorMessage message="Failed to load user sessions" />
          ) : sessions ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Session Start</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((session: any) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {session.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {session.userRole}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(new Date(session.sessionStart), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {session.duration ? `${Math.round(session.duration / 60)}m` : 'Active'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={session.deviceType}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {session.location ? `${session.location.city}, ${session.location.country}` : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={session.status}
                          size="small"
                          color={session.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewSession(session)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {session.status === 'active' && (
                          <Tooltip title="Terminate Session">
                            <IconButton
                              size="small"
                              onClick={() => handleTerminateSession(session.id)}
                              color="error"
                            >
                              <ResolveIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </TabPanel>

        {/* Voice Commands Tab */}
        <TabPanel value={activeTab} index={1}>
          {voiceError ? (
            <ErrorMessage message="Failed to load voice commands" />
          ) : voiceCommands ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Command</TableCell>
                    <TableCell>Intent</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Response</TableCell>
                    <TableCell>Success</TableCell>
                    <TableCell>Processing Time</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {voiceCommands.map((command: any) => (
                    <TableRow key={command.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {command.command}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={command.intent}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {(command.confidence * 100).toFixed(1)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={command.confidence * 100}
                            sx={{ width: 60, height: 4 }}
                            color={command.confidence > 0.8 ? 'success' : command.confidence > 0.6 ? 'warning' : 'error'}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {command.response}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={command.success ? 'Success' : 'Failed'}
                          size="small"
                          color={command.success ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        {command.processingTime}ms
                      </TableCell>
                      <TableCell>
                        {format(new Date(command.timestamp), 'MMM dd, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </TabPanel>

        {/* System Errors Tab */}
        <TabPanel value={activeTab} index={2}>
          {errorsError ? (
            <ErrorMessage message="Failed to load system errors" />
          ) : errors ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Level</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errors.map((error: any) => (
                    <TableRow key={error.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getErrorIcon(error.level)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {error.level.toUpperCase()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={error.category}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {error.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {error.userId ? `User ${error.userId}` : 'System'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(error.timestamp), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={error.resolved ? 'Resolved' : 'Open'}
                          size="small"
                          color={error.resolved ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewError(error)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {!error.resolved && (
                          <Tooltip title="Resolve Error">
                            <IconButton
                              size="small"
                              onClick={() => handleResolveError(error.id)}
                              color="success"
                            >
                              <ResolveIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </TabPanel>
      </Card>

      {/* Session Details Dialog */}
      <Dialog
        open={sessionDialogOpen}
        onClose={() => setSessionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Session Details</DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedSession.userName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Role:</strong> {selectedSession.userRole}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Session ID:</strong> {selectedSession.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Session Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Start:</strong> {format(new Date(selectedSession.sessionStart), 'PPpp')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {selectedSession.duration ? `${Math.round(selectedSession.duration / 60)} minutes` : 'Active'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedSession.status}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    Device Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Device:</strong> {selectedSession.deviceType}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Browser:</strong> {selectedSession.browser}
                  </Typography>
                  <Typography variant="body2">
                    <strong>OS:</strong> {selectedSession.os}
                  </Typography>
                  <Typography variant="body2">
                    <strong>IP Address:</strong> {selectedSession.ipAddress}
                  </Typography>
                </Grid>
                {selectedSession.location && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Location
                    </Typography>
                    <Typography variant="body2">
                      <strong>Country:</strong> {selectedSession.location.country}
                    </Typography>
                    <Typography variant="body2">
                      <strong>City:</strong> {selectedSession.location.city}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Timezone:</strong> {selectedSession.location.timezone}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialogOpen(false)}>Close</Button>
          {selectedSession?.status === 'active' && (
            <Button
              onClick={() => handleTerminateSession(selectedSession.id)}
              color="error"
              variant="contained"
            >
              Terminate Session
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Error Details Dialog */}
      <Dialog
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Error Details</DialogTitle>
        <DialogContent>
          {selectedError && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Error Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Level:</strong> {selectedError.level.toUpperCase()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Category:</strong> {selectedError.category}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Timestamp:</strong> {format(new Date(selectedError.timestamp), 'PPpp')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Resolved:</strong> {selectedError.resolved ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Context
                  </Typography>
                  <Typography variant="body2">
                    <strong>User ID:</strong> {selectedError.userId || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Session ID:</strong> {selectedError.sessionId || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Request ID:</strong> {selectedError.requestId || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    Message
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedError.message}
                  </Typography>
                  {selectedError.stack && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary">
                        Stack Trace
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          backgroundColor: 'grey.100',
                          p: 2,
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.75rem',
                        }}
                      >
                        {selectedError.stack}
                      </Box>
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialogOpen(false)}>Close</Button>
          {!selectedError?.resolved && (
            <Button
              onClick={() => handleResolveError(selectedError?.id)}
              color="success"
              variant="contained"
            >
              Resolve Error
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LogManagement
