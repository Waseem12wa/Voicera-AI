import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  Alert,
  AlertTitle
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Notifications as NotificationsIcon,
  Computer as ComputerIcon,
  Insights as InsightsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon
} from '@mui/icons-material'
import { generateRandomData } from '../../services/dataGeneratorService'
import type { AnalyticsData, SystemMetrics, NotificationData } from '../../services/dataGeneratorService'

interface DataDisplayWidgetProps {
  type: 'analytics' | 'users' | 'courses' | 'notifications' | 'system' | 'insights' | 'statistics'
  title?: string
  refreshInterval?: number
  showRefreshButton?: boolean
  compact?: boolean
}

export const DataDisplayWidget: React.FC<DataDisplayWidgetProps> = ({
  type,
  title,
  refreshInterval = 30000, // 30 seconds
  showRefreshButton = true,
  compact = false
}) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = async () => {
    setLoading(true)
    try {
      let newData
      switch (type) {
        case 'analytics':
          newData = generateRandomData.analytics()
          break
        case 'users':
          newData = generateRandomData.users(5)
          break
        case 'courses':
          newData = generateRandomData.courses(5)
          break
        case 'notifications':
          newData = generateRandomData.notifications(5)
          break
        case 'system':
          newData = generateRandomData.systemMetrics()
          break
        case 'insights':
          newData = generateRandomData.insights()
          break
        case 'statistics':
          newData = generateRandomData.statistics()
          break
        default:
          newData = null
      }
      setData(newData)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [type, refreshInterval])

  const renderAnalytics = (analytics: AnalyticsData) => (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">{analytics.totalUsers.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">Total Users</Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <SchoolIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">{analytics.totalCourses}</Typography>
            <Typography variant="body2" color="text.secondary">Courses</Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <TrendingUpIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">${analytics.totalRevenue.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">Revenue</Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <SpeedIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">{analytics.completionRate.toFixed(1)}%</Typography>
            <Typography variant="body2" color="text.secondary">Completion Rate</Typography>
          </Paper>
        </Box>
      </Box>
      
      {!compact && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>Recent Activity</Typography>
          <List dense>
            {analytics.recentActivity.slice(0, 3).map((activity) => (
              <ListItem key={activity.id}>
                <ListItemText
                  primary={activity.description}
                  secondary={`${activity.user} • ${new Date(activity.timestamp).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  )

  const renderUsers = (users: any[]) => (
    <List>
      {users.map((user, index) => (
        <React.Fragment key={user.id}>
          <ListItem>
            <ListItemAvatar>
              <Avatar src={user.avatar} alt={user.name} />
            </ListItemAvatar>
            <ListItemText
              primary={user.name}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {user.email} • {user.role}
                  </Typography>
                  <Chip
                    size="small"
                    label={user.status}
                    color={user.status === 'active' ? 'success' : 'default'}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              }
            />
          </ListItem>
          {index < users.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  )

  const renderCourses = (courses: any[]) => (
    <List>
      {courses.map((course, index) => (
        <React.Fragment key={course.id}>
          <ListItem>
            <ListItemText
              primary={course.title}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {course.instructor} • {course.students} students
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip size="small" label={course.level} />
                    <Chip size="small" label={course.category} />
                    <Chip size="small" label={`${course.rating}⭐`} color="warning" />
                  </Box>
                </Box>
              }
            />
          </ListItem>
          {index < courses.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  )

  const renderNotifications = (notifications: NotificationData[]) => (
    <List>
      {notifications.map((notification, index) => (
        <React.Fragment key={notification.id}>
          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">{notification.title}</Typography>
                  {!notification.read && (
                    <Chip size="small" label="New" color="primary" />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notification.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
          {index < notifications.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  )

  const renderSystemMetrics = (metrics: SystemMetrics) => (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              CPU Usage
            </Typography>
            <LinearProgress
              variant="determinate"
              value={metrics.cpuUsage}
              color={metrics.cpuUsage > 80 ? 'error' : metrics.cpuUsage > 60 ? 'warning' : 'primary'}
            />
            <Typography variant="caption" color="text.secondary">
              {metrics.cpuUsage.toFixed(1)}%
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Memory Usage
            </Typography>
            <LinearProgress
              variant="determinate"
              value={metrics.memoryUsage}
              color={metrics.memoryUsage > 80 ? 'error' : metrics.memoryUsage > 60 ? 'warning' : 'primary'}
            />
            <Typography variant="caption" color="text.secondary">
              {metrics.memoryUsage.toFixed(1)}%
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Disk Usage
            </Typography>
            <LinearProgress
              variant="determinate"
              value={metrics.diskUsage}
              color={metrics.diskUsage > 80 ? 'error' : metrics.diskUsage > 60 ? 'warning' : 'primary'}
            />
            <Typography variant="caption" color="text.secondary">
              {metrics.diskUsage.toFixed(1)}%
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Uptime
            </Typography>
            <Typography variant="h6" color="success.main">
              {metrics.uptime.toFixed(1)}%
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  const renderInsights = (insights: string[]) => (
    <Box>
      {insights.map((insight, index) => (
        <Alert key={index} severity="info" sx={{ mb: 1 }}>
          <Typography variant="body2">{insight}</Typography>
        </Alert>
      ))}
    </Box>
  )

  const renderStatistics = (stats: any) => (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.totalFiles.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">Files</Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.totalQuizzes}</Typography>
            <Typography variant="body2" color="text.secondary">Quizzes</Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.totalDownloads.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">Downloads</Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{stats.averageSessionTime}m</Typography>
            <Typography variant="body2" color="text.secondary">Avg Session</Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  )

  const renderContent = () => {
    if (loading) {
      return <LinearProgress />
    }

    if (!data) {
      return (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          Failed to load data
        </Alert>
      )
    }

    switch (type) {
      case 'analytics':
        return renderAnalytics(data)
      case 'users':
        return renderUsers(data)
      case 'courses':
        return renderCourses(data)
      case 'notifications':
        return renderNotifications(data)
      case 'system':
        return renderSystemMetrics(data)
      case 'insights':
        return renderInsights(data)
      case 'statistics':
        return renderStatistics(data)
      default:
        return null
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'analytics':
        return <TrendingUpIcon />
      case 'users':
        return <PeopleIcon />
      case 'courses':
        return <SchoolIcon />
      case 'notifications':
        return <NotificationsIcon />
      case 'system':
        return <ComputerIcon />
      case 'insights':
        return <InsightsIcon />
      case 'statistics':
        return <SecurityIcon />
      default:
        return <InsightsIcon />
    }
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getIcon()}
            <Typography variant="h6">
              {title || type.charAt(0).toUpperCase() + type.slice(1)}
            </Typography>
          </Box>
          {showRefreshButton && (
            <Tooltip title="Refresh data">
              <IconButton onClick={fetchData} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        {renderContent()}
        
        <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default DataDisplayWidget
