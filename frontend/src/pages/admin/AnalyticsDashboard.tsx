import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  useTheme,
  alpha,
  LinearProgress,
} from '@mui/material'
import {
  People as PeopleIcon,
  VoiceOverOff as VoiceIcon,
  Error as ErrorIcon,
  Speed as PerformanceIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { 
  getUserAnalytics, 
  getVoiceAnalytics, 
  getPerformanceAnalytics, 
  getErrorAnalytics,
  getSystemHealth,
  generateAnalyticsReport
} from '../../services/analyticsService'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import ErrorMessage from '../../components/feedback/ErrorMessage'
import DataDisplayWidget from '../../components/data/DataDisplayWidget'
import { useAnalytics, useSystemMetrics, useInsights } from '../../hooks/useDataGenerator'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`analytics-tabpanel-${index}`}
    aria-labelledby={`analytics-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
)

const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState(0)
  const [dateRange, setDateRange] = useState('7d')
  const [granularity, setGranularity] = useState('day')

  // Date range options
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
      granularity: granularity as 'hour' | 'day' | 'week' | 'month'
    }
  }

  const query = getDateRange()

  // Analytics queries
  const { data: userAnalytics, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['analytics', 'users', query],
    queryFn: () => getUserAnalytics(query),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: voiceAnalytics, isLoading: voiceLoading, error: voiceError } = useQuery({
    queryKey: ['analytics', 'voice', query],
    queryFn: () => getVoiceAnalytics(query),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: performanceAnalytics, isLoading: performanceLoading, error: performanceError } = useQuery({
    queryKey: ['analytics', 'performance', query],
    queryFn: () => getPerformanceAnalytics(query),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: errorAnalytics, isLoading: errorLoading, error: errorError } = useQuery({
    queryKey: ['analytics', 'errors', query],
    queryFn: () => getErrorAnalytics(query),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: systemHealth, isLoading: systemLoading } = useQuery({
    queryKey: ['analytics', 'system'],
    queryFn: getSystemHealth,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      const reportType = ['users', 'voice', 'performance', 'errors'][activeTab] as 'users' | 'voice' | 'performance' | 'errors'
      const blob = await generateAnalyticsReport(reportType, format, query)
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${reportType}-${dateRange}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      enqueueSnackbar(`Report exported successfully as ${format.toUpperCase()}`, { variant: 'success' })
    } catch (error) {
      enqueueSnackbar('Failed to export report', { variant: 'error' })
    }
  }

  const handleRefresh = () => {
    enqueueSnackbar('Refreshing analytics data...', { variant: 'info' })
    window.location.reload()
  }

  const isLoading = userLoading || voiceLoading || performanceLoading || errorLoading || systemLoading

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading analytics dashboard..." />
  }

  const tabs = [
    { label: 'Users', icon: <PeopleIcon /> },
    { label: 'Voice Commands', icon: <VoiceIcon /> },
    { label: 'Performance', icon: <PerformanceIcon /> },
    { label: 'Errors', icon: <ErrorIcon /> },
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
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive system analytics and insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
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
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Granularity</InputLabel>
            <Select
              value={granularity}
              label="Granularity"
              onChange={(e) => setGranularity(e.target.value)}
            >
              <MenuItem value="hour">Hour</MenuItem>
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Report">
            <IconButton onClick={() => handleExport('pdf')} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>


      {/* System Health Overview */}
      {systemHealth && (
        <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)` }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PerformanceIcon color="primary" />
              System Health Overview
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ textAlign: 'center', minWidth: '200px', flex: '1 1 200px' }}>
                <Typography variant="h3" color={systemHealth.systemHealth === 'healthy' ? 'success.main' : systemHealth.systemHealth === 'warning' ? 'warning.main' : 'error.main'} fontWeight="bold">
                  {systemHealth.uptime.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  System Uptime
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: '200px', flex: '1 1 200px' }}>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {systemHealth.resources.memory.percentage.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Memory Usage
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={systemHealth.resources.memory.percentage} 
                  sx={{ mt: 1 }}
                  color={systemHealth.resources.memory.percentage > 80 ? 'error' : systemHealth.resources.memory.percentage > 60 ? 'warning' : 'primary'}
                />
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: '200px', flex: '1 1 200px' }}>
                <Typography variant="h3" color="secondary" fontWeight="bold">
                  {systemHealth.resources.cpu.usage.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CPU Usage
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={systemHealth.resources.cpu.usage} 
                  sx={{ mt: 1 }}
                  color={systemHealth.resources.cpu.usage > 80 ? 'error' : systemHealth.resources.cpu.usage > 60 ? 'warning' : 'secondary'}
                />
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: '200px', flex: '1 1 200px' }}>
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {systemHealth.resources.disk.percentage.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Disk Usage
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={systemHealth.resources.disk.percentage} 
                  sx={{ mt: 1 }}
                  color={systemHealth.resources.disk.percentage > 80 ? 'error' : systemHealth.resources.disk.percentage > 60 ? 'warning' : 'success'}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Data Widgets */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="analytics" title="Quick Analytics" compact />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="system" title="System Health" compact />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="insights" title="AI Insights" compact />
        </Box>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
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

        {/* Users Tab */}
        <TabPanel value={activeTab} index={0}>
          {userError ? (
            <ErrorMessage message="Failed to load user analytics" />
          ) : userAnalytics ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>User Growth</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userAnalytics.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke={theme.palette.primary.main} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>User Distribution by Role</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={userAnalytics.userDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {userAnalytics.userDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={theme.palette.primary.main} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ width: '100%' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>User Statistics</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary" fontWeight="bold">
                            {userAnalytics.totalUsers}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Users
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main" fontWeight="bold">
                            {userAnalytics.activeUsers}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Active Users
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main" fontWeight="bold">
                            {userAnalytics.newUsers}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            New Users
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main" fontWeight="bold">
                            {userAnalytics.returningUsers}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Returning Users
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          ) : null}
        </TabPanel>

        {/* Voice Commands Tab */}
        <TabPanel value={activeTab} index={1}>
          {voiceError ? (
            <ErrorMessage message="Failed to load voice analytics" />
          ) : voiceAnalytics ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '2 1 500px', minWidth: '500px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Voice Command Trends</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={voiceAnalytics.commandTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Area type="monotone" dataKey="count" stackId="1" stroke={theme.palette.primary.main} fill={alpha(theme.palette.primary.main, 0.3)} />
                        <Area type="monotone" dataKey="successRate" stackId="2" stroke={theme.palette.success.main} fill={alpha(theme.palette.success.main, 0.3)} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Top Commands</Typography>
                    {voiceAnalytics.topCommands.slice(0, 5).map((command, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ flex: 1, mr: 1 }}>
                          {command.command}
                        </Typography>
                        <Chip 
                          label={`${command.count}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Box>
            </Box>
          ) : null}
        </TabPanel>

        {/* Performance Tab */}
        <TabPanel value={activeTab} index={2}>
          {performanceError ? (
            <ErrorMessage message="Failed to load performance analytics" />
          ) : performanceAnalytics ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>API Performance</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={performanceAnalytics.apiPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="endpoint" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="averageTime" fill={theme.palette.primary.main} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary" fontWeight="bold">
                            {performanceAnalytics.averageResponseTime.toFixed(0)}ms
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Response Time
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main" fontWeight="bold">
                            {performanceAnalytics.systemUptime.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            System Uptime
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main" fontWeight="bold">
                            {performanceAnalytics.errorRate.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Error Rate
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main" fontWeight="bold">
                            {performanceAnalytics.throughput.toFixed(0)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Throughput (req/s)
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          ) : null}
        </TabPanel>

        {/* Errors Tab */}
        <TabPanel value={activeTab} index={3}>
          {errorError ? (
            <ErrorMessage message="Failed to load error analytics" />
          ) : errorAnalytics ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '2 1 500px', minWidth: '500px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Error Trends</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={errorAnalytics.errorTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke={theme.palette.error.main} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Error Categories</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={errorAnalytics.errorCategories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {errorAnalytics.errorCategories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={theme.palette.error.main} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          ) : null}
        </TabPanel>
      </Card>
    </Box>
  )
}

export default AnalyticsDashboard
