import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Search as SearchIcon,
  Language as LanguageIcon,
  VolumeUp as VolumeIcon,
  Download as DownloadIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import MultilingualFileViewer from '../../components/multilingual/MultilingualFileViewer'
import { 
  translateFile, 
  downloadTranslatedFile 
} from '../../services/multilingualService'
import { getStudentFiles } from '../../services/studentService'

interface File {
  _id: string
  originalName: string
  content: string
  transcript?: string
  mimeType: string
  language?: string
  translations?: Array<{
    language: string
    content: string
    transcript?: string
    translatedAt: string
    confidence: number
  }>
  uploadedAt: string
  courseId?: string
  courseName?: string
}

const MultilingualFiles = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [sortBy, setSortBy] = useState('uploadedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [filterType, setFilterType] = useState('all')

  const qc = useQueryClient()

  // Fetch files
  const { data: files = [], isLoading, error, refetch } = useQuery({
    queryKey: ['student', 'multilingual-files'],
    queryFn: () => getStudentFiles('all')
  })

  // Translation mutation
  const translateMutation = useMutation({
    mutationFn: ({ fileId, fromLanguage, toLanguage }: { fileId: string; fromLanguage: string; toLanguage: string }) =>
      translateFile(fileId, fromLanguage, toLanguage),
    onSuccess: () => {
      enqueueSnackbar('File translated successfully', { variant: 'success' })
      qc.invalidateQueries({ queryKey: ['student', 'multilingual-files'] })
    },
    onError: (error: any) => {
      enqueueSnackbar(`Translation failed: ${error.message}`, { variant: 'error' })
    }
  })

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: ({ fileId, language }: { fileId: string; language?: string }) =>
      downloadTranslatedFile(fileId, language || 'en'),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${variables.fileId}_${variables.language || 'en'}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      enqueueSnackbar('File downloaded successfully', { variant: 'success' })
    },
    onError: (error: any) => {
      enqueueSnackbar(`Download failed: ${error.message}`, { variant: 'error' })
    }
  })

  // Filter and sort files
  const filteredFiles = files
    .filter((file: File) => {
      const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           file.content.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesLanguage = selectedLanguage === 'all' || 
                             file.language === selectedLanguage ||
                             file.translations?.some(t => t.language === selectedLanguage)
      
      const matchesType = filterType === 'all' || 
                         (filterType === 'audio' && file.mimeType.startsWith('audio/')) ||
                         (filterType === 'document' && file.mimeType.startsWith('application/')) ||
                         (filterType === 'text' && file.mimeType.startsWith('text/'))
      
      return matchesSearch && matchesLanguage && matchesType
    })
    .sort((a: File, b: File) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.originalName.toLowerCase()
          bValue = b.originalName.toLowerCase()
          break
        case 'uploadedAt':
          aValue = new Date(a.uploadedAt).getTime()
          bValue = new Date(b.uploadedAt).getTime()
          break
        case 'language':
          aValue = a.language || 'en'
          bValue = b.language || 'en'
          break
        default:
          aValue = a.originalName.toLowerCase()
          bValue = b.originalName.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleFileClick = (file: File) => {
    setSelectedFile(file)
    setViewerOpen(true)
  }

  const handleTranslate = async (fileId: string, fromLanguage: string, toLanguage: string) => {
    await translateMutation.mutateAsync({ fileId, fromLanguage, toLanguage })
  }

  const handleDownload = (fileId: string, language?: string) => {
    downloadMutation.mutate({ fileId, language })
  }

  const getLanguageInfo = (code: string) => {
    const languages: { [key: string]: { name: string; flag: string } } = {
      'en': { name: 'English', flag: '🇺🇸' },
      'es': { name: 'Spanish', flag: '🇪🇸' },
      'fr': { name: 'French', flag: '🇫🇷' },
      'de': { name: 'German', flag: '🇩🇪' },
      'it': { name: 'Italian', flag: '🇮🇹' },
      'pt': { name: 'Portuguese', flag: '🇵🇹' },
      'ru': { name: 'Russian', flag: '🇷🇺' },
      'ja': { name: 'Japanese', flag: '🇯🇵' },
      'ko': { name: 'Korean', flag: '🇰🇷' },
      'zh': { name: 'Chinese', flag: '🇨🇳' },
      'ar': { name: 'Arabic', flag: '🇸🇦' },
      'hi': { name: 'Hindi', flag: '🇮🇳' },
      'ur': { name: 'Urdu', flag: '🇵🇰' },
      'bn': { name: 'Bengali', flag: '🇧🇩' },
      'tr': { name: 'Turkish', flag: '🇹🇷' }
    }
    return languages[code] || { name: code, flag: '🌐' }
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading multilingual files...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load files: {error.message}
        </Alert>
        <Button onClick={() => refetch()} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          🌍 Multilingual Learning Materials
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Access your course materials in your preferred language. All content can be translated to 20+ languages.
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              fullWidth
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  label="Language"
                >
                  <MenuItem value="all">All Languages</MenuItem>
                  <MenuItem value="en">🇺🇸 English</MenuItem>
                  <MenuItem value="es">🇪🇸 Spanish</MenuItem>
                  <MenuItem value="fr">🇫🇷 French</MenuItem>
                  <MenuItem value="de">🇩🇪 German</MenuItem>
                  <MenuItem value="it">🇮🇹 Italian</MenuItem>
                  <MenuItem value="pt">🇵🇹 Portuguese</MenuItem>
                  <MenuItem value="ru">🇷🇺 Russian</MenuItem>
                  <MenuItem value="ja">🇯🇵 Japanese</MenuItem>
                  <MenuItem value="ko">🇰🇷 Korean</MenuItem>
                  <MenuItem value="zh">🇨🇳 Chinese</MenuItem>
                  <MenuItem value="ar">🇸🇦 Arabic</MenuItem>
                  <MenuItem value="hi">🇮🇳 Hindi</MenuItem>
                  <MenuItem value="ur">🇵🇰 Urdu</MenuItem>
                  <MenuItem value="bn">🇧🇩 Bengali</MenuItem>
                  <MenuItem value="tr">🇹🇷 Turkish</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="audio">Audio Files</MenuItem>
                  <MenuItem value="document">Documents</MenuItem>
                  <MenuItem value="text">Text Files</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="uploadedAt">Upload Date</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="language">Language</MenuItem>
                </Select>
              </FormControl>

              <Stack direction="row" spacing={1}>
                <Tooltip title="Refresh">
                  <IconButton onClick={() => refetch()}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  startIcon={<SortIcon />}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Files Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: 2 
      }}>
        {filteredFiles.map((file: File) => (
          <Card 
            key={file._id}
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
            onClick={() => handleFileClick(file)}
          >
            <CardContent>
              <Stack spacing={2}>
                {/* File Header */}
                <Box>
                  <Typography variant="h6" noWrap>
                    {file.originalName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </Typography>
                </Box>

                {/* Language Info */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    icon={<LanguageIcon />}
                    label={getLanguageInfo(file.language || 'en').name}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {file.translations && file.translations.length > 0 && (
                    <Chip
                      label={`+${file.translations.length} translations`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Stack>

                {/* Content Preview */}
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {file.content.substring(0, 150)}...
                </Typography>

                {/* File Type and Actions */}
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Chip
                    label={file.mimeType.split('/')[1].toUpperCase()}
                    size="small"
                    variant="outlined"
                  />
                  
                  <Stack direction="row" spacing={0.5}>
                    {file.transcript && (
                      <Tooltip title="Audio Available">
                        <VolumeIcon color="primary" fontSize="small" />
                      </Tooltip>
                    )}
                    <Tooltip title="Download">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(file._id)
                        }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                {/* Course Info */}
                {file.courseName && (
                  <Typography variant="caption" color="text.secondary">
                    Course: {file.courseName}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No files found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || selectedLanguage !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters to see more files.'
              : 'No files have been uploaded yet.'}
          </Typography>
        </Card>
      )}

      {/* File Viewer Dialog */}
      <Dialog 
        open={viewerOpen} 
        onClose={() => setViewerOpen(false)} 
        maxWidth="lg" 
        fullWidth
        fullScreen
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <LanguageIcon color="primary" />
            <Typography variant="h6">
              Multilingual File Viewer
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <MultilingualFileViewer
              file={selectedFile}
              onTranslate={handleTranslate}
              onDownload={handleDownload}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewerOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MultilingualFiles
