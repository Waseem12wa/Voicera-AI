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
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentIcon,
  VoiceOverOff as VoiceIcon,
  Language as LanguageIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Publish as PublishIcon,
  Unpublished as UnpublishIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { useBreakpoints } from '../../utils/responsive'
import { 
  getAppTexts, 
  getAppPages, 
  getVoiceCommandTemplates,
  createAppText,
  updateAppText,
  deleteAppText,
  createAppPage,
  updateAppPage,
  deleteAppPage,
  publishPage,
  unpublishPage,
  createVoiceCommandTemplate,
  updateVoiceCommandTemplate,
  deleteVoiceCommandTemplate,
  testVoiceCommand,
  getContentStats,
  exportContent,
  importContent
} from '../../services/contentManagementService'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import ErrorMessage from '../../components/feedback/ErrorMessage'
import DataDisplayWidget from '../../components/data/DataDisplayWidget'
import { useAnalytics, useUsers, useCourses } from '../../hooks/useDataGenerator'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`content-tabpanel-${index}`}
    aria-labelledby={`content-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
)

const ContentManagement: React.FC = () => {
  const theme = useTheme()
  const { isMobile } = useBreakpoints()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [textDialogOpen, setTextDialogOpen] = useState(false)
  const [pageDialogOpen, setPageDialogOpen] = useState(false)
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Form states
  const [textForm, setTextForm] = useState({
    key: '',
    value: '',
    language: 'en',
    category: 'ui',
    description: '',
    isHtml: false,
    variables: [] as string[],
  })

  const [pageForm, setPageForm] = useState({
    name: '',
    title: '',
    description: '',
    content: '',
    language: 'en',
    route: '',
    isActive: true,
    isPublic: false,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [] as string[],
    template: 'default',
  })

  const [voiceForm, setVoiceForm] = useState({
    name: '',
    description: '',
    command: '',
    intent: '',
    response: '',
    category: 'navigation',
    language: 'en',
    isActive: true,
    requiresAuth: false,
    permissions: [] as string[],
    variables: [] as string[],
    examples: [] as string[],
  })

  const [testForm, setTestForm] = useState({
    command: '',
    context: '',
  })

  // Queries
  const { data: appTexts, isLoading: textsLoading, error: textsError } = useQuery({
    queryKey: ['admin', 'content', 'texts', { language: selectedLanguage, category: selectedCategory, search: searchTerm }],
    queryFn: () => getAppTexts({ language: selectedLanguage, category: selectedCategory, search: searchTerm }),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: appPages, isLoading: pagesLoading, error: pagesError } = useQuery({
    queryKey: ['admin', 'content', 'pages', { language: selectedLanguage, search: searchTerm }],
    queryFn: () => getAppPages({ language: selectedLanguage, search: searchTerm }),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: voiceTemplates, isLoading: voiceLoading, error: voiceError } = useQuery({
    queryKey: ['admin', 'content', 'voice-commands', { category: selectedCategory, language: selectedLanguage, search: searchTerm }],
    queryFn: () => getVoiceCommandTemplates({ category: selectedCategory, language: selectedLanguage, search: searchTerm }),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const { data: contentStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'content', 'stats'],
    queryFn: getContentStats,
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Mutations
  const createTextMutation = useMutation({
    mutationFn: createAppText,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'texts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'stats'] })
      enqueueSnackbar('App text created successfully', { variant: 'success' })
      setTextDialogOpen(false)
      resetTextForm()
    },
    onError: () => {
      enqueueSnackbar('Failed to create app text', { variant: 'error' })
    },
  })

  const updateTextMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: any }) => updateAppText(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'texts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'stats'] })
      enqueueSnackbar('App text updated successfully', { variant: 'success' })
      setTextDialogOpen(false)
      resetTextForm()
    },
    onError: () => {
      enqueueSnackbar('Failed to update app text', { variant: 'error' })
    },
  })

  const deleteTextMutation = useMutation({
    mutationFn: deleteAppText,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'texts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'stats'] })
      enqueueSnackbar('App text deleted successfully', { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to delete app text', { variant: 'error' })
    },
  })

  const createPageMutation = useMutation({
    mutationFn: createAppPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'pages'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'stats'] })
      enqueueSnackbar('App page created successfully', { variant: 'success' })
      setPageDialogOpen(false)
      resetPageForm()
    },
    onError: () => {
      enqueueSnackbar('Failed to create app page', { variant: 'error' })
    },
  })

  const updatePageMutation = useMutation({
    mutationFn: ({ id, page }: { id: string; page: any }) => updateAppPage(id, page),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'pages'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'stats'] })
      enqueueSnackbar('App page updated successfully', { variant: 'success' })
      setPageDialogOpen(false)
      resetPageForm()
    },
    onError: () => {
      enqueueSnackbar('Failed to update app page', { variant: 'error' })
    },
  })

  const deletePageMutation = useMutation({
    mutationFn: deleteAppPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'pages'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'stats'] })
      enqueueSnackbar('App page deleted successfully', { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to delete app page', { variant: 'error' })
    },
  })

  const publishPageMutation = useMutation({
    mutationFn: publishPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'pages'] })
      enqueueSnackbar('Page published successfully', { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to publish page', { variant: 'error' })
    },
  })

  const unpublishPageMutation = useMutation({
    mutationFn: unpublishPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'pages'] })
      enqueueSnackbar('Page unpublished successfully', { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to unpublish page', { variant: 'error' })
    },
  })

  const createVoiceMutation = useMutation({
    mutationFn: createVoiceCommandTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'voice-commands'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'stats'] })
      enqueueSnackbar('Voice command template created successfully', { variant: 'success' })
      setVoiceDialogOpen(false)
      resetVoiceForm()
    },
    onError: () => {
      enqueueSnackbar('Failed to create voice command template', { variant: 'error' })
    },
  })

  const updateVoiceMutation = useMutation({
    mutationFn: ({ id, template }: { id: string; template: any }) => updateVoiceCommandTemplate(id, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'voice-commands'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'stats'] })
      enqueueSnackbar('Voice command template updated successfully', { variant: 'success' })
      setVoiceDialogOpen(false)
      resetVoiceForm()
    },
    onError: () => {
      enqueueSnackbar('Failed to update voice command template', { variant: 'error' })
    },
  })

  const deleteVoiceMutation = useMutation({
    mutationFn: deleteVoiceCommandTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'voice-commands'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'stats'] })
      enqueueSnackbar('Voice command template deleted successfully', { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar('Failed to delete voice command template', { variant: 'error' })
    },
  })

  const testVoiceMutation = useMutation({
    mutationFn: testVoiceCommand,
    onSuccess: (result) => {
      enqueueSnackbar(`Test result: ${result.success ? 'Success' : 'Failed'}`, { 
        variant: result.success ? 'success' : 'error' 
      })
    },
    onError: () => {
      enqueueSnackbar('Failed to test voice command', { variant: 'error' })
    },
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleCreateText = () => {
    setEditingItem(null)
    resetTextForm()
    setTextDialogOpen(true)
  }

  const handleEditText = (text: any) => {
    setEditingItem(text)
    setTextForm({
      key: text.key,
      value: text.value,
      language: text.language,
      category: text.category,
      description: text.description,
      isHtml: text.isHtml,
      variables: text.variables || [],
    })
    setTextDialogOpen(true)
  }

  const handleDeleteText = (textId: string) => {
    if (window.confirm('Are you sure you want to delete this app text?')) {
      deleteTextMutation.mutate(textId)
    }
  }

  const handleSaveText = () => {
    if (editingItem) {
      updateTextMutation.mutate({
        id: editingItem.id,
        text: textForm,
      })
    } else {
      createTextMutation.mutate(textForm)
    }
  }

  const handleCreatePage = () => {
    setEditingItem(null)
    resetPageForm()
    setPageDialogOpen(true)
  }

  const handleEditPage = (page: any) => {
    setEditingItem(page)
    setPageForm({
      name: page.name,
      title: page.title,
      description: page.description,
      content: page.content,
      language: page.language,
      route: page.route,
      isActive: page.isActive,
      isPublic: page.isPublic,
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      metaKeywords: page.metaKeywords || [],
      template: page.template,
    })
    setPageDialogOpen(true)
  }

  const handleDeletePage = (pageId: string) => {
    if (window.confirm('Are you sure you want to delete this app page?')) {
      deletePageMutation.mutate(pageId)
    }
  }

  const handleSavePage = () => {
    if (editingItem) {
      updatePageMutation.mutate({
        id: editingItem.id,
        page: pageForm,
      })
    } else {
      createPageMutation.mutate(pageForm)
    }
  }

  const handlePublishPage = (pageId: string) => {
    publishPageMutation.mutate(pageId)
  }

  const handleUnpublishPage = (pageId: string) => {
    unpublishPageMutation.mutate(pageId)
  }

  const handleCreateVoice = () => {
    setEditingItem(null)
    resetVoiceForm()
    setVoiceDialogOpen(true)
  }

  const handleEditVoice = (voice: any) => {
    setEditingItem(voice)
    setVoiceForm({
      name: voice.name,
      description: voice.description,
      command: voice.command,
      intent: voice.intent,
      response: voice.response,
      category: voice.category,
      language: voice.language,
      isActive: voice.isActive,
      requiresAuth: voice.requiresAuth,
      permissions: voice.permissions || [],
      variables: voice.variables || [],
      examples: voice.examples || [],
    })
    setVoiceDialogOpen(true)
  }

  const handleDeleteVoice = (voiceId: string) => {
    if (window.confirm('Are you sure you want to delete this voice command template?')) {
      deleteVoiceMutation.mutate(voiceId)
    }
  }

  const handleSaveVoice = () => {
    if (editingItem) {
      updateVoiceMutation.mutate({
        id: editingItem.id,
        template: voiceForm,
      })
    } else {
      createVoiceMutation.mutate(voiceForm)
    }
  }

  const handleTestVoice = () => {
    testVoiceMutation.mutate({
      command: testForm.command,
      context: testForm.context ? JSON.parse(testForm.context) : undefined,
    })
  }

  const handleExport = async (type: 'texts' | 'pages' | 'voice-commands', format: 'json' | 'csv') => {
    try {
      const blob = await exportContent(type, format, selectedLanguage)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}-${selectedLanguage || 'all'}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      enqueueSnackbar(`Exported ${type} as ${format.toUpperCase()}`, { variant: 'success' })
    } catch (error) {
      enqueueSnackbar('Failed to export content', { variant: 'error' })
    }
  }

  const resetTextForm = () => {
    setTextForm({
      key: '',
      value: '',
      language: 'en',
      category: 'ui',
      description: '',
      isHtml: false,
      variables: [],
    })
  }

  const resetPageForm = () => {
    setPageForm({
      name: '',
      title: '',
      description: '',
      content: '',
      language: 'en',
      route: '',
      isActive: true,
      isPublic: false,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: [],
      template: 'default',
    })
  }

  const resetVoiceForm = () => {
    setVoiceForm({
      name: '',
      description: '',
      command: '',
      intent: '',
      response: '',
      category: 'navigation',
      language: 'en',
      isActive: true,
      requiresAuth: false,
      permissions: [],
      variables: [],
      examples: [],
    })
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ui': return 'primary'
      case 'messages': return 'secondary'
      case 'errors': return 'error'
      case 'help': return 'info'
      case 'voice': return 'success'
      case 'tutorials': return 'warning'
      default: return 'default'
    }
  }

  const isLoading = textsLoading || pagesLoading || voiceLoading || statsLoading

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading content management..." />
  }

  const tabs = [
    { label: 'App Texts', icon: <ContentIcon />, count: appTexts?.length || 0 },
    { label: 'App Pages', icon: <LanguageIcon />, count: appPages?.length || 0 },
    { label: 'Voice Commands', icon: <VoiceIcon />, count: voiceTemplates?.length || 0 },
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
            Content Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage app texts, pages, and voice command templates
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
      {contentStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ContentIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">App Texts</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contentStats.totalTexts} entries
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {contentStats.totalTexts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LanguageIcon color="secondary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">App Pages</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contentStats.totalPages} pages
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="secondary" fontWeight="bold">
                  {contentStats.totalPages}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <VoiceIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Voice Commands</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contentStats.totalVoiceCommands} templates
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="success" fontWeight="bold">
                  {contentStats.totalVoiceCommands}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LanguageIcon color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Languages</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contentStats.languages.length} supported
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" color="info" fontWeight="bold">
                  {contentStats.languages.length}
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
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Language</InputLabel>
                <Select
                  value={selectedLanguage}
                  label="Language"
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <MenuItem value="">All Languages</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
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
                  <MenuItem value="ui">UI</MenuItem>
                  <MenuItem value="messages">Messages</MenuItem>
                  <MenuItem value="errors">Errors</MenuItem>
                  <MenuItem value="help">Help</MenuItem>
                  <MenuItem value="voice">Voice</MenuItem>
                  <MenuItem value="tutorials">Tutorials</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={5}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('texts', 'json')}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                >
                  Import
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Widgets */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="analytics" title="Content Analytics" compact />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="users" title="Active Users" compact />
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="courses" title="Popular Courses" compact />
        </Box>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="content tabs">
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

        {/* App Texts Tab */}
        <TabPanel value={activeTab} index={0}>
          {textsError ? (
            <ErrorMessage message="Failed to load app texts" />
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateText}
                >
                  Add App Text
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Key</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Language</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appTexts?.map((text: any) => (
                      <TableRow key={text.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {text.key}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {text.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {text.value}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={text.language} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={text.category}
                            size="small"
                            color={getCategoryColor(text.category)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={text.isHtml ? 'HTML' : 'Text'}
                            size="small"
                            color={text.isHtml ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditText(text)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteText(text.id)}
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
            </>
          )}
        </TabPanel>

        {/* App Pages Tab */}
        <TabPanel value={activeTab} index={1}>
          {pagesError ? (
            <ErrorMessage message="Failed to load app pages" />
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreatePage}
                >
                  Add App Page
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>Language</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appPages?.map((page: any) => (
                      <TableRow key={page.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {page.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {page.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {page.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={page.route} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip label={page.language} size="small" color="secondary" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={page.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={page.isActive ? 'success' : 'default'}
                            />
                            <Chip
                              label={page.isPublic ? 'Public' : 'Private'}
                              size="small"
                              color={page.isPublic ? 'info' : 'default'}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditPage(page)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={page.isActive ? 'Unpublish' : 'Publish'}>
                            <IconButton
                              size="small"
                              onClick={() => page.isActive ? handleUnpublishPage(page.id) : handlePublishPage(page.id)}
                              color={page.isActive ? 'warning' : 'success'}
                            >
                              {page.isActive ? <UnpublishIcon /> : <PublishIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePage(page.id)}
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
            </>
          )}
        </TabPanel>

        {/* Voice Commands Tab */}
        <TabPanel value={activeTab} index={2}>
          {voiceError ? (
            <ErrorMessage message="Failed to load voice command templates" />
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<VoiceIcon />}
                  onClick={() => setTestDialogOpen(true)}
                >
                  Test Voice Command
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateVoice}
                >
                  Add Voice Template
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Command</TableCell>
                      <TableCell>Intent</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Language</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {voiceTemplates?.map((voice: any) => (
                      <TableRow key={voice.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {voice.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {voice.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {voice.command}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={voice.intent} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={voice.category}
                            size="small"
                            color={getCategoryColor(voice.category)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={voice.language} size="small" color="secondary" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={voice.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={voice.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditVoice(voice)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteVoice(voice.id)}
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
            </>
          )}
        </TabPanel>
      </Card>

      {/* App Text Dialog */}
      <Dialog
        open={textDialogOpen}
        onClose={() => setTextDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Edit App Text' : 'Create New App Text'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Key"
                value={textForm.key}
                onChange={(e) => setTextForm({ ...textForm, key: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={textForm.category}
                  label="Category"
                  onChange={(e) => setTextForm({ ...textForm, category: e.target.value })}
                >
                  <MenuItem value="ui">UI</MenuItem>
                  <MenuItem value="messages">Messages</MenuItem>
                  <MenuItem value="errors">Errors</MenuItem>
                  <MenuItem value="help">Help</MenuItem>
                  <MenuItem value="voice">Voice</MenuItem>
                  <MenuItem value="tutorials">Tutorials</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Language"
                value={textForm.language}
                onChange={(e) => setTextForm({ ...textForm, language: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={textForm.isHtml}
                    onChange={(e) => setTextForm({ ...textForm, isHtml: e.target.checked })}
                  />
                }
                label="HTML Content"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={textForm.description}
                onChange={(e) => setTextForm({ ...textForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Value"
                multiline
                rows={4}
                value={textForm.value}
                onChange={(e) => setTextForm({ ...textForm, value: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTextDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveText}
            variant="contained"
            disabled={!textForm.key || !textForm.value}
          >
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* App Page Dialog */}
      <Dialog
        open={pageDialogOpen}
        onClose={() => setPageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Edit App Page' : 'Create New App Page'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={pageForm.name}
                onChange={(e) => setPageForm({ ...pageForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Route"
                value={pageForm.route}
                onChange={(e) => setPageForm({ ...pageForm, route: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={pageForm.title}
                onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={pageForm.description}
                onChange={(e) => setPageForm({ ...pageForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                multiline
                rows={8}
                value={pageForm.content}
                onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Language"
                value={pageForm.language}
                onChange={(e) => setPageForm({ ...pageForm, language: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={pageForm.isActive}
                    onChange={(e) => setPageForm({ ...pageForm, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={pageForm.isPublic}
                    onChange={(e) => setPageForm({ ...pageForm, isPublic: e.target.checked })}
                  />
                }
                label="Public"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPageDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSavePage}
            variant="contained"
            disabled={!pageForm.name || !pageForm.title || !pageForm.content}
          >
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Voice Command Dialog */}
      <Dialog
        open={voiceDialogOpen}
        onClose={() => setVoiceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Edit Voice Command Template' : 'Create New Voice Command Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={voiceForm.name}
                onChange={(e) => setVoiceForm({ ...voiceForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={voiceForm.category}
                  label="Category"
                  onChange={(e) => setVoiceForm({ ...voiceForm, category: e.target.value })}
                >
                  <MenuItem value="navigation">Navigation</MenuItem>
                  <MenuItem value="action">Action</MenuItem>
                  <MenuItem value="query">Query</MenuItem>
                  <MenuItem value="help">Help</MenuItem>
                  <MenuItem value="tutorial">Tutorial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Command"
                value={voiceForm.command}
                onChange={(e) => setVoiceForm({ ...voiceForm, command: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Intent"
                value={voiceForm.intent}
                onChange={(e) => setVoiceForm({ ...voiceForm, intent: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={voiceForm.description}
                onChange={(e) => setVoiceForm({ ...voiceForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Response"
                multiline
                rows={3}
                value={voiceForm.response}
                onChange={(e) => setVoiceForm({ ...voiceForm, response: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Language"
                value={voiceForm.language}
                onChange={(e) => setVoiceForm({ ...voiceForm, language: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={voiceForm.isActive}
                    onChange={(e) => setVoiceForm({ ...voiceForm, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoiceDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveVoice}
            variant="contained"
            disabled={!voiceForm.name || !voiceForm.command || !voiceForm.response}
          >
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Voice Command Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Test Voice Command</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Command"
                value={testForm.command}
                onChange={(e) => setTestForm({ ...testForm, command: e.target.value })}
                placeholder="Enter voice command to test..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Context (JSON)"
                multiline
                rows={3}
                value={testForm.context}
                onChange={(e) => setTestForm({ ...testForm, context: e.target.value })}
                placeholder='{"userId": "123", "sessionId": "abc"}'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleTestVoice}
            variant="contained"
            disabled={!testForm.command}
          >
            Test Command
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ContentManagement
