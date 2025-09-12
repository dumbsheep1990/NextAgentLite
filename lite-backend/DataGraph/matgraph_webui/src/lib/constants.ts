import { ButtonVariantType } from '@/components/ui/Button'

export const backendBaseUrl = ''
export const webuiPrefix = '/webui/'

export const controlButtonVariant: ButtonVariantType = 'ghost'

export const labelColorDarkTheme = '#B2EBF2'
export const LabelColorHighlightedDarkTheme = '#000'

export const nodeColorDisabled = '#E2E2E2'
export const nodeBorderColor = '#EEEEEE'
export const nodeBorderColorSelected = '#3b82f6'

export const edgeColorDarkTheme = '#969696'
export const edgeColorSelected = '#3b82f6'
export const edgeColorHighlighted = '#93c5fd'

export const searchResultLimit = 50
export const labelListLimit = 100

export const minNodeSize = 4
export const maxNodeSize = 20

export const healthCheckInterval = 15 // seconds

export const defaultQueryLabel = '*'

// reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types
export const supportedFileTypes = {
  'text/plain': [
    '.txt',
    '.md',
    '.html',
    '.htm',
    '.tex',
    '.json',
    '.xml',
    '.yaml',
    '.yml',
    '.rtf',
    '.odt',
    '.epub',
    '.csv',
    '.log',
    '.conf',
    '.ini',
    '.properties',
    '.sql',
    '.bat',
    '.sh',
    '.c',
    '.cpp',
    '.py',
    '.java',
    '.js',
    '.ts',
    '.swift',
    '.go',
    '.rb',
    '.php',
    '.css',
    '.scss',
    '.less'
  ],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
}

export const SiteInfo = {
  name: 'DataGraph',
  home: '/',
  github: 'https://github.com/HKUDS/LightRAG'
}
