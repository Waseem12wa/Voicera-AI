import { useMediaQuery, useTheme } from '@mui/material'

export const useBreakpoints = () => {
  const theme = useTheme()
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('xl'))
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isLargeScreen,
  }
}

export const getResponsiveValue = <T>(
  mobile: T,
  tablet: T,
  desktop: T,
  breakpoints: ReturnType<typeof useBreakpoints>
): T => {
  if (breakpoints.isMobile) return mobile
  if (breakpoints.isTablet) return tablet
  return desktop
}

export const getResponsiveSpacing = (
  mobile: number,
  tablet: number,
  desktop: number,
  breakpoints: ReturnType<typeof useBreakpoints>
): number => {
  return getResponsiveValue(mobile, tablet, desktop, breakpoints)
}

export const getResponsiveColumns = (
  mobile: number,
  tablet: number,
  desktop: number,
  breakpoints: ReturnType<typeof useBreakpoints>
): number => {
  return getResponsiveValue(mobile, tablet, desktop, breakpoints)
}