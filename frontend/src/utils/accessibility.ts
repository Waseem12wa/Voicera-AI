// Accessibility utilities for WCAG 2.1 AA compliance

export const ARIA_LABELS = {
  // Navigation
  MAIN_NAVIGATION: 'Main navigation',
  BREADCRUMB_NAVIGATION: 'Breadcrumb navigation',
  USER_MENU: 'User menu',
  
  // Actions
  LOGIN_FORM: 'Login form',
  REGISTER_FORM: 'Registration form',
  SEARCH_FORM: 'Search form',
  SUBMIT_BUTTON: 'Submit',
  CANCEL_BUTTON: 'Cancel',
  CLOSE_BUTTON: 'Close',
  MENU_TOGGLE: 'Toggle menu',
  THEME_TOGGLE: 'Toggle theme',
  
  // Content
  LOADING: 'Loading content',
  ERROR_MESSAGE: 'Error message',
  SUCCESS_MESSAGE: 'Success message',
  WARNING_MESSAGE: 'Warning message',
  INFO_MESSAGE: 'Information message',
  
  // Data
  CHART_DATA: 'Chart data',
  TABLE_DATA: 'Table data',
  CARD_CONTENT: 'Card content',
}

export const ARIA_ROLES = {
  BANNER: 'banner',
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  FORM: 'form',
  SEARCH: 'search',
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  DIALOG: 'dialog',
  LOG: 'log',
  MARQUEE: 'marquee',
  STATUS: 'status',
  TABLIST: 'tablist',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TOOLTIP: 'tooltip',
  BUTTON: 'button',
  LINK: 'link',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  PROGRESSBAR: 'progressbar',
  SLIDER: 'slider',
  SWITCH: 'switch',
  TEXTBOX: 'textbox',
  TREE: 'tree',
  TREEITEM: 'treeitem',
}

// Screen reader announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Focus management utilities
export const focusElement = (element: HTMLElement | null) => {
  if (element) {
    element.focus()
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

export const trapFocus = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
  }
  
  container.addEventListener('keydown', handleTabKey)
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey)
  }
}

// Keyboard navigation helpers
export const handleKeyNavigation = (
  event: React.KeyboardEvent,
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      onEnter?.()
      break
    case 'Escape':
      event.preventDefault()
      onEscape?.()
      break
    case 'ArrowUp':
      event.preventDefault()
      onArrowUp?.()
      break
    case 'ArrowDown':
      event.preventDefault()
      onArrowDown?.()
      break
    case 'ArrowLeft':
      event.preventDefault()
      onArrowLeft?.()
      break
    case 'ArrowRight':
      event.preventDefault()
      onArrowRight?.()
      break
  }
}

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g)
    if (!rgb) return 0
    
    const [r, g, b] = rgb.map(c => {
      const val = parseInt(c) / 255
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

export const isAccessibleContrast = (foreground: string, background: string): boolean => {
  const ratio = getContrastRatio(foreground, background)
  return ratio >= 4.5 // WCAG AA standard
}

// Skip link component props
export const createSkipLinkProps = (targetId: string, label: string = 'Skip to main content') => ({
  href: `#${targetId}`,
  'aria-label': label,
  className: 'skip-link',
  onClick: (e: React.MouseEvent) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  },
})

// Form validation helpers
export const getFieldError = (errors: any, fieldName: string): string | undefined => {
  return errors?.[fieldName]?.message
}

export const isFieldInvalid = (errors: any, fieldName: string): boolean => {
  return !!errors?.[fieldName]
}

// Loading state helpers
export const createLoadingProps = (isLoading: boolean) => ({
  'aria-busy': isLoading,
  'aria-live': isLoading ? 'polite' : 'off',
})

// Error state helpers
export const createErrorProps = (hasError: boolean, errorMessage?: string) => ({
  'aria-invalid': hasError,
  'aria-describedby': hasError && errorMessage ? 'error-message' : undefined,
})
