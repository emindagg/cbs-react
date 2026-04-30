import { trackEvent } from '@/shared/analytics'

const CATEGORY = 'smart_assistant'

export const smartAssistantAnalytics = {
  open: () => trackEvent('open', CATEGORY),
  close: () => trackEvent('close', CATEGORY),
  search: (query: string) => trackEvent('search', CATEGORY, query),
  noResult: (query: string) => trackEvent('no_result', CATEGORY, query),
  voiceUsed: () => trackEvent('voice_used', CATEGORY),
  videoPlay: (videoId: string, fromQuery: string) => trackEvent('video_play', CATEGORY, `${videoId}|${fromQuery || 'default'}`),
  openLibrary: () => trackEvent('open_library', CATEGORY),
}
