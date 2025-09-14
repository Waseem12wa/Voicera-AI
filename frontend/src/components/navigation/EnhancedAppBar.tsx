import React, { useState, useRef, useEffect } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  Avatar,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Contrast as HighContrastIcon,
} from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../features/auth/authSlice'
import type { RootState } from '../../store/store'
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext'
import { ARIA_LABELS, ARIA_ROLES, handleKeyNavigation } from '../../utils/accessibility'
import { useBreakpoints } from '../../utils/responsive'

interface NavItem {
  label: string
  path: string
  roles?: string[]
  icon?: React.ReactNode
  badge?: number
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', roles: ['admin', 'institution_admin'] },
  { label: 'Admin Console', path: '/admin/console', roles: ['admin', 'institution_admin'] },
  { label: 'Analytics', path: '/admin/analytics', roles: ['admin', 'institution_admin'] },
  { label: 'System Logs', path: '/admin/logs', roles: ['admin', 'institution_admin'] },
  { label: 'RBAC', path: '/admin/rbac', roles: ['admin', 'institution_admin'] },
  { label: 'Content', path: '/admin/content', roles: ['admin', 'institution_admin'] },
  { label: 'Alerts', path: '/admin/alerts', roles: ['admin', 'institution_admin'] },
  { label: 'Developer Portal', path: '/developer', roles: ['admin', 'institution_admin'] },
  { label: 'Institution', path: '/institution', roles: ['admin', 'institution_admin'] },
  { label: 'Programs & Courses', path: '/programs', roles: ['admin', 'institution_admin'] },
  { label: 'Users', path: '/users', roles: ['admin', 'institution_admin'] },
  { label: 'Teacher Dashboard', path: '/teacher', roles: ['teacher'] },
  { label: 'Student Dashboard', path: '/student', roles: ['student'] },
]

const EnhancedAppBar: React.FC = () => {
  const theme = useTheme()
  const { mode, toggleTheme } = useCustomTheme()
  const { isMobile } = useBreakpoints()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null)
  
  const drawerRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLButtonElement>(null)
  const notificationsRef = useRef<HTMLButtonElement>(null)

  // Close mobile drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setMobileOpen(false)
      }
    }

    if (mobileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileOpen])

  // Focus management for mobile drawer
  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      const firstFocusable = drawerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusable?.focus()
    }
  }, [mobileOpen])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
    userMenuRef.current?.focus()
  }

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget)
  }

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null)
    notificationsRef.current?.focus()
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
    handleUserMenuClose()
  }

  const handleThemeToggle = () => {
    toggleTheme()
    handleUserMenuClose()
  }

  const getThemeIcon = () => {
    switch (mode) {
      case 'dark':
        return <LightModeIcon />
      case 'high-contrast':
        return <HighContrastIcon />
      default:
        return <DarkModeIcon />
    }
  }

  const getThemeLabel = () => {
    switch (mode) {
      case 'dark':
        return 'Switch to light mode'
      case 'high-contrast':
        return 'Switch to normal contrast'
      default:
        return 'Switch to dark mode'
    }
  }

  const filteredNavItems = navItems.filter(item => 
    !item.roles || (user?.role && item.roles.includes(user.role))
  )

  const NavLink = ({ item }: { item: NavItem }) => (
    <Button
      component={Link as any}
      to={item.path}
      color="inherit"
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 2,
        px: 2,
        py: 1,
        minHeight: 40,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineOffset: '2px',
          outlineColor: 'currentColor',
        },
      }}
      aria-label={`Navigate to ${item.label}`}
    >
      {item.label}
    </Button>
  )

  const MobileNavItem = ({ item }: { item: NavItem }) => (
    <ListItem disablePadding>
      <ListItemButton
        component={Link as any}
        to={item.path}
        onClick={() => setMobileOpen(false)}
        sx={{
          py: 1.5,
          px: 2,
          '&:focus-visible': {
            outline: '2px solid',
            outlineOffset: '2px',
            outlineColor: 'currentColor',
          },
        }}
        aria-label={`Navigate to ${item.label}`}
      >
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            fontWeight: 600,
          }}
        />
      </ListItemButton>
    </ListItem>
  )

  const drawer = (
    <Box
      ref={drawerRef}
      sx={{
        width: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="navigation"
      aria-label="Mobile navigation menu"
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Voicera Admin
        </Typography>
        <IconButton
          onClick={handleDrawerToggle}
          aria-label="Close navigation menu"
          size="large"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ flex: 1, py: 1 }}>
        {filteredNavItems.map((item) => (
          <MobileNavItem key={item.path} item={item} />
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{ mb: 1 }}
        >
          Logout
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleThemeToggle}
          startIcon={getThemeIcon()}
        >
          {getThemeLabel()}
        </Button>
      </Box>
    </Box>
  )

  return (
    <>
      <AppBar
        position="static"
        color="primary"
        enableColorOnDark
        sx={{
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2 },
          }}
        >
          {/* Mobile menu button */}
          <IconButton
            color="inherit"
            aria-label="Open navigation menu"
            onClick={handleDrawerToggle}
            sx={{
              display: { xs: 'block', md: 'none' },
              mr: 1,
            }}
            size="large"
          >
            <MenuIcon />
          </IconButton>

          {/* Logo/Brand */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: { xs: 1, md: 0 },
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
            }}
          >
            Voicera Admin
          </Typography>

          {/* Desktop Navigation */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexGrow: 1,
              justifyContent: 'center',
              gap: 1,
              mx: 4,
            }}
            role="navigation"
            aria-label={ARIA_LABELS.MAIN_NAVIGATION}
          >
            {filteredNavItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </Box>

          {/* Right side actions */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              ml: 'auto',
            }}
          >
            {/* Notifications */}
            <IconButton
              ref={notificationsRef}
              color="inherit"
              onClick={handleNotificationsOpen}
              aria-label="View notifications"
              size="large"
            >
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* User menu */}
            <IconButton
              ref={userMenuRef}
              onClick={handleUserMenuOpen}
              aria-label="Open user menu"
              size="large"
              sx={{ ml: 1 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'secondary.main',
                }}
              >
                <PersonIcon />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: 1,
          },
        }}
      >
        <MenuItem disabled>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleThemeToggle}
          onKeyDown={(e) => handleKeyNavigation(e, handleThemeToggle)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getThemeIcon()}
            <Typography>{getThemeLabel()}</Typography>
          </Box>
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          onKeyDown={(e) => handleKeyNavigation(e, handleLogout)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LogoutIcon />
            <Typography>Logout</Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 300,
            maxWidth: 400,
            mt: 1,
          },
        }}
      >
        <MenuItem disabled>
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem>
          <Typography variant="body2" color="text.secondary">
            No new notifications
          </Typography>
        </MenuItem>
      </Menu>
    </>
  )
}

export default EnhancedAppBar
