import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Code as CodeIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  Webhook as WebhookIcon,
  Download as DownloadIcon,
  PlayArrow as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../services/apiClient'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`developer-tabpanel-${index}`}
    aria-labelledby={`developer-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
)

const DeveloperPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState('nodejs')
  const [selectedEndpoint, setSelectedEndpoint] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)

  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => apiClient.get('/integrations').then(res => res.data)
  })

  const { data: webhooks, isLoading: webhooksLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => apiClient.get('/webhooks').then(res => res.data)
  })

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleLanguageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedLanguage(event.target.value as string)
  }

  const handleEndpointChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedEndpoint(event.target.value as string)
  }

  const generateApiKey = () => {
    setShowApiKeyDialog(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const endpoints = [
    { name: 'Get Users', method: 'GET', path: '/users', description: 'Retrieve all users' },
    { name: 'Create User', method: 'POST', path: '/users', description: 'Create a new user' },
    { name: 'Get Courses', method: 'GET', path: '/courses', description: 'Retrieve all courses' },
    { name: 'Create Course', method: 'POST', path: '/courses', description: 'Create a new course' },
    { name: 'Process Voice Command', method: 'POST', path: '/voice/process', description: 'Process voice command' },
    { name: 'Get Analytics', method: 'GET', path: '/analytics/users', description: 'Get user analytics' }
  ]

  const codeExamples = {
    nodejs: `// Install the SDK
npm install @voicera/ai-sdk

// Initialize the SDK
const { VoiceraSDK } = require('@voicera/ai-sdk')

const sdk = new VoiceraSDK({
  baseUrl: 'https://api.voicera.ai',
  apiKey: 'your-api-key-here'
})

// Example: Get users
async function getUsers() {
  try {
    const users = await sdk.getUsers()
    console.log('Users:', users)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Example: Process voice command
async function processVoiceCommand() {
  try {
    const result = await sdk.processVoiceCommand('Show me my courses')
    console.log('Result:', result)
  } catch (error) {
    console.error('Error:', error.message)
  }
}`,
    python: `# Install the SDK
pip install voicera-ai-sdk

# Initialize the SDK
from voicera_sdk import VoiceraSDK

sdk = VoiceraSDK({
    'base_url': 'https://api.voicera.ai',
    'api_key': 'your-api-key-here'
})

# Example: Get users
def get_users():
    try:
        users = sdk.get_users()
        print('Users:', users)
    except Exception as e:
        print('Error:', str(e))

# Example: Process voice command
def process_voice_command():
    try:
        result = sdk.process_voice_command('Show me my courses')
        print('Result:', result)
    except Exception as e:
        print('Error:', str(e))`,
    javascript: `// Install the SDK
npm install @voicera/ai-sdk

// Initialize the SDK
import { VoiceraSDK } from '@voicera/ai-sdk'

const sdk = new VoiceraSDK({
  baseUrl: 'https://api.voicera.ai',
  apiKey: 'your-api-key-here'
})

// Example: Get users
async function getUsers() {
  try {
    const users = await sdk.getUsers()
    console.log('Users:', users)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Example: Process voice command
async function processVoiceCommand() {
  try {
    const result = await sdk.processVoiceCommand('Show me my courses')
    console.log('Result:', result)
  } catch (error) {
    console.error('Error:', error.message)
  }
}`
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Developer Portal
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Integrate Voicera AI into your applications with our comprehensive APIs and SDKs
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ApiIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">API Endpoints</Typography>
              </Box>
              <Typography variant="h4" color="primary">50+</Typography>
              <Typography variant="body2" color="text.secondary">
                RESTful endpoints available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CodeIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">SDKs</Typography>
              </Box>
              <Typography variant="h4" color="secondary">3</Typography>
              <Typography variant="body2" color="text.secondary">
                Official SDKs available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WebhookIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Webhooks</Typography>
              </Box>
              <Typography variant="h4" color="success.main">12</Typography>
              <Typography variant="body2" color="text.secondary">
                Event types supported
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Security</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">OAuth 2.0</Typography>
              <Typography variant="body2" color="text.secondary">
                Industry standard auth
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="developer portal tabs">
            <Tab label="Quick Start" icon={<PlayIcon />} />
            <Tab label="API Reference" icon={<ApiIcon />} />
            <Tab label="SDKs" icon={<CodeIcon />} />
            <Tab label="Webhooks" icon={<WebhookIcon />} />
            <Tab label="Integrations" icon={<SecurityIcon />} />
          </Tabs>
        </Box>

        {/* Quick Start Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Get Started in Minutes
            </Typography>
            <Typography variant="body1" paragraph>
              Follow these simple steps to integrate Voicera AI into your application.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    1. Get Your API Key
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Sign up for a developer account and generate your API key.
                  </Typography>
                  <Button variant="contained" onClick={generateApiKey}>
                    Generate API Key
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    2. Install SDK
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Choose your preferred language and install the SDK.
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Language</InputLabel>
                    <Select value={selectedLanguage} onChange={handleLanguageChange}>
                      <MenuItem value="nodejs">Node.js</MenuItem>
                      <MenuItem value="python">Python</MenuItem>
                      <MenuItem value="javascript">JavaScript</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    3. Write Your First Code
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <pre style={{ margin: 0, fontSize: '14px' }}>
                      {codeExamples[selectedLanguage as keyof typeof codeExamples]}
                    </pre>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* API Reference Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              API Reference
            </Typography>
            <Typography variant="body1" paragraph>
              Explore our comprehensive REST API documentation.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Endpoint</InputLabel>
                <Select value={selectedEndpoint} onChange={handleEndpointChange}>
                  {endpoints.map((endpoint, index) => (
                    <MenuItem key={index} value={index}>
                      {endpoint.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              {selectedEndpoint && (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={endpoints[selectedEndpoint].method} 
                        color="primary" 
                        size="small" 
                        sx={{ mr: 2 }}
                      />
                      <Typography variant="h6">
                        {endpoints[selectedEndpoint].path}
                      </Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      {endpoints[selectedEndpoint].description}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<PlayIcon />}
                      onClick={() => copyToClipboard(`curl -X ${endpoints[selectedEndpoint].method} https://api.voicera.ai/v1${endpoints[selectedEndpoint].path}`)}
                    >
                      Try it out
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* SDKs Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Official SDKs
            </Typography>
            <Typography variant="body1" paragraph>
              Use our official SDKs to integrate Voicera AI into your applications.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CodeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Node.js</Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Full-featured SDK for Node.js applications with TypeScript support.
                  </Typography>
                  <Button variant="contained" startIcon={<DownloadIcon />}>
                    Download
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CodeIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Python</Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Python SDK with async support and comprehensive error handling.
                  </Typography>
                  <Button variant="contained" startIcon={<DownloadIcon />}>
                    Download
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CodeIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">JavaScript</Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Lightweight JavaScript SDK for browser and Node.js environments.
                  </Typography>
                  <Button variant="contained" startIcon={<DownloadIcon />}>
                    Download
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Webhooks Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Webhooks
            </Typography>
            <Typography variant="body1" paragraph>
              Receive real-time notifications about events in your Voicera AI account.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Available Events
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="User Created" secondary="user.created" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Course Completed" secondary="course.completed" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Quiz Submitted" secondary="quiz.submitted" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="File Uploaded" secondary="file.uploaded" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Webhook Configuration
                  </Typography>
                  <TextField
                    fullWidth
                    label="Webhook URL"
                    placeholder="https://your-app.com/webhook"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Secret"
                    placeholder="your-webhook-secret"
                    sx={{ mb: 2 }}
                  />
                  <Button variant="contained" fullWidth>
                    Create Webhook
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Integrations Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Platform Integrations
            </Typography>
            <Typography variant="body1" paragraph>
              Connect Voicera AI with your favorite platforms and tools.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Slack
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Send notifications and receive commands through Slack.
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Connect Slack
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Google Workspace
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Integrate with Gmail, Drive, Calendar, and Docs.
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Connect Google
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Zapier
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Connect with 5000+ apps through Zapier.
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Connect Zapier
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onClose={() => setShowApiKeyDialog(false)}>
        <DialogTitle>Generate API Key</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="API Key Name"
            placeholder="My Application"
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            <AlertTitle>Important</AlertTitle>
            Keep your API key secure and never share it publicly. This key provides access to your Voicera AI account.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiKeyDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowApiKeyDialog(false)}>
            Generate Key
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default DeveloperPortal
