import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  VoiceOverOff as VoiceIcon,
  Error as ErrorIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { getRealTimeMetrics, subscribeToRealTimeMetrics } from '../../services/analyticsService'
import { getLogStats } from '../../services/loggingService'
import { getRBACStats } from '../../services/rbacService'
import { getContentStats } from '../../services/contentManagementService'
import { getAlertStats } from '../../services/emailAlertsService'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  href: string
  permission?: string
}

const AdminConsole: React.FC = () => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Real-time metrics
  const { data: realTimeMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin', 'real-time-metrics'],
    queryFn: getRealTimeMetrics,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // System statistics
  const { data: logStats, isLoading: logStatsLoading } = useQuery({
    queryKey: ['admin', 'log-stats'],
    queryFn: () => getLogStats(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { isLoading: rbacStatsLoading } = useQuery({
    queryKey: ['admin', 'rbac-stats'],
    queryFn: () => getRBACStats(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { isLoading: contentStatsLoading } = useQuery({
    queryKey: ['admin', 'content-stats'],
    queryFn: () => getContentStats(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: alertStats, isLoading: alertStatsLoading } = useQuery({
    queryKey: ['admin', 'alert-stats'],
    queryFn: () => getAlertStats(),
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Real-time subscription with error handling
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    
    try {
      unsubscribe = subscribeToRealTimeMetrics((metrics) => {
        // Update real-time metrics in the UI
        console.log('Real-time metrics:', metrics)
      })
    } catch (error) {
      console.warn('Real-time metrics subscription failed:', error)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const quickActions: QuickAction[] = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: <PeopleIcon />,
      color: theme.palette.primary.main,
      href: '/admin/users',
      permission: 'users:read'
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'View system analytics and reports',
      icon: <DashboardIcon />,
      color: theme.palette.info.main,
      href: '/admin/analytics',
      permission: 'analytics:read'
    },
    {
      id: 'logs',
      title: 'Log Management',
      description: 'Monitor system logs and errors',
      icon: <ErrorIcon />,
      color: theme.palette.error.main,
      href: '/admin/logs',
      permission: 'logs:read'
    },
    {
      id: 'rbac',
      title: 'RBAC Management',
      description: 'Manage roles and permissions',
      icon: <SecurityIcon />,
      color: theme.palette.warning.main,
      href: '/admin/rbac',
      permission: 'rbac:read'
    },
    {
      id: 'content',
      title: 'Content Management',
      description: 'Manage application content',
      icon: <SettingsIcon />,
      color: theme.palette.success.main,
      href: '/admin/content',
      permission: 'content:read'
    },
    {
      id: 'alerts',
      title: 'Email Alerts',
      description: 'Configure email notifications',
      icon: <NotificationsIcon />,
      color: theme.palette.secondary.main,
      href: '/admin/alerts',
      permission: 'alerts:read'
    }
  ]

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleRefresh = () => {
    enqueueSnackbar('Refreshing data...', { variant: 'info' })
    // Refresh queries would be handled by React Query
  }

  const handleExport = () => {
    enqueueSnackbar('Export functionality coming soon', { variant: 'info' })
  }

  const isLoading = metricsLoading || logStatsLoading || rbacStatsLoading || contentStatsLoading || alertStatsLoading

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Console
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton onClick={handleExport} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="More options">
            <IconButton onClick={handleMenuClick} color="primary">
              <MoreIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRefresh}>
          <RefreshIcon sx={{ mr: 1 }} />
          Refresh All
        </MenuItem>
        <MenuItem onClick={handleExport}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export Data
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
      </Menu>

      {isLoading && <LoadingSpinner />}

      {/* Backend Status Message */}
      {!isLoading && (
        <Card sx={{ mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <CardContent>
            <Typography variant="body1">
              <strong>Note:</strong> Admin API endpoints are not yet implemented. 
              The console is displaying mock data. Real-time metrics and statistics will be available once the backend is connected.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Real-time Metrics Section */}
      {realTimeMetrics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Real-time System Metrics
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {realTimeMetrics.activeUsers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Users
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="secondary" fontWeight="bold">
                  {realTimeMetrics.currentSessions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Sessions
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {realTimeMetrics.requestsPerMinute || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Requests/Min
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="error.main" fontWeight="bold">
                  {realTimeMetrics.errorRate || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Error Rate
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* System Overview Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Card sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <ErrorIcon />
              </Avatar>
              <Typography variant="h6">System Errors</Typography>
            </Box>
            <Typography variant="h4" color="primary" gutterBottom>
              {logStats?.totalErrors || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total errors in the system
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                <VoiceIcon />
              </Avatar>
              <Typography variant="h6">Voice Commands</Typography>
            </Box>
            <Typography variant="h4" color="error.main" gutterBottom>
              {logStats?.voiceCommands || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Voice commands processed
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <NotificationsIcon />
              </Avatar>
              <Typography variant="h6">Active Alerts</Typography>
            </Box>
            <Typography variant="h4" color="warning.main" gutterBottom>
              {alertStats?.totalAlerts || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configured email alerts
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {quickActions.map((action) => (
          <Card
            key={action.id}
            sx={{
              flex: '1 1 300px',
              minWidth: '300px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
            }}
            onClick={() => {
              // Navigate to the action
              window.location.href = action.href
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: action.color, mr: 2 }}>
                  {action.icon}
                </Avatar>
                <Typography variant="h6">{action.title}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {action.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

export default AdminConsole