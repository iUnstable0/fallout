import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
import { Deferred as InertiaDeferred, router } from '@inertiajs/react'
import { Deferred as ModalDeferred, Modal } from '@inertiaui/modal-react'
import Frame from '@/components/shared/Frame'
import Button from '@/components/shared/Button'
import MarkdownEditor from '@/components/shared/MarkdownEditor'

const MIN_IMAGES = 1
const MIN_CHARS = 100

type Project = { id: number; name: string }

type Timelapse = {
  id: string
  name: string
  thumbnailUrl: string
  playbackUrl: string
  duration: number
  createdAt: number
}

type YouTubeVideo = {
  id: number
  video_id: string
  title: string
  thumbnail_url: string
  duration_seconds: number
  was_live: boolean
  claimed: boolean
}

function countMarkdownChars(md: string): number {
  let text = md
  // Remove images ![...](...)
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  // Remove links [...](...) — entire syntax including text
  text = text.replace(/\[[^\]]*\]\([^)]*\)/g, '')
  // Remove HTML comments <!-- ... -->
  text = text.replace(/<!--[\s\S]*?-->/g, '')
  // Normalize zero-width spaces, tabs, non-breaking spaces to regular spaces
  text = text.replace(/[\u200B\u200C\u200D\uFEFF\t\u00A0]/g, ' ')

  const lines = text.split('\n').map((line) => {
    // Strip spaces at start and end of lines
    line = line.trim()
    // Two or more consecutive spaces count as two
    line = line.replace(/ {2,}/g, '  ')
    return line
  })

  // Collapse consecutive empty lines to one
  const collapsed: string[] = []
  let prevEmpty = false
  for (const line of lines) {
    const isEmpty = line === ''
    if (isEmpty) {
      if (!prevEmpty) collapsed.push('')
      prevEmpty = true
    } else {
      collapsed.push(line)
      prevEmpty = false
    }
  }

  // Trim leading/trailing empty lines
  while (collapsed.length > 0 && collapsed[0] === '') collapsed.shift()
  while (collapsed.length > 0 && collapsed[collapsed.length - 1] === '') collapsed.pop()

  let count = 0
  for (let i = 0; i < collapsed.length; i++) {
    // Empty lines count as one
    count += collapsed[i] === '' ? 1 : collapsed[i].length
    if (i < collapsed.length - 1) count += 1
  }
  return count
}

function NewJournal({
  projects,
  selected_project_id,
  lapse_connected,
  is_modal,
  direct_upload_url,
  timelapses,
}: {
  projects: Project[]
  selected_project_id: number | null
  lapse_connected: boolean
  is_modal: boolean
  direct_upload_url: string
  timelapses: Timelapse[] | null
}) {
  const initialProject = selected_project_id
    ? (projects.find((p) => p.id === selected_project_id) ?? null)
    : projects.length === 1
      ? projects[0]
      : null

  const [selectedProject, setSelectedProject] = useState<Project | null>(initialProject)
  const [selectedTimelapses, setSelectedTimelapses] = useState<Set<string>>(new Set())
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const [youtubeError, setYoutubeError] = useState<string | null>(null)
  const [blobSignedIds, setBlobSignedIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [draftStatus, setDraftStatus] = useState<string | null>(null)

  const draftKey = selectedProject ? `journal-draft-${selectedProject.id}` : null
  const [markdown, setMarkdown] = useState(() => {
    if (!draftKey) return ''
    try {
      return localStorage.getItem(draftKey) ?? ''
    } catch {
      return ''
    }
  })

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevDraftKey = useRef(draftKey)

  useEffect(() => {
    if (draftKey && draftKey !== prevDraftKey.current) {
      try {
        setMarkdown(localStorage.getItem(draftKey) ?? '')
      } catch {}
      setDraftStatus(null)
    }
    prevDraftKey.current = draftKey
  }, [draftKey])

  useEffect(() => {
    if (!draftKey || !markdown) {
      setDraftStatus(null)
      return
    }
    setDraftStatus('Saving draft...')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, markdown)
      } catch {}
      setDraftStatus('Draft saved locally.')
    }, 500)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [markdown, draftKey])

  const Deferred = is_modal ? ModalDeferred : InertiaDeferred

  const charCount = useMemo(() => countMarkdownChars(markdown), [markdown])
  const markdownImageCount = (markdown.match(/!\[[^\]]*\]\([^)]*\)/g) || []).length
  const hasEnoughImages = markdownImageCount >= MIN_IMAGES
  const hasEnoughChars = charCount >= MIN_CHARS
  const hasRecording = selectedTimelapses.size > 0 || youtubeVideos.length > 0
  const canSubmit = selectedProject && hasRecording && hasEnoughImages && hasEnoughChars

  function toggleTimelapse(id: string) {
    setSelectedTimelapses((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleYoutubeLookup() {
    if (!youtubeUrl.trim() || youtubeLoading) return
    setYoutubeLoading(true)
    setYoutubeError(null)

    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
      const res = await fetch('/you_tube_videos/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setYoutubeError(data.error || 'Failed to look up video')
        return
      }

      if (data.claimed) {
        setYoutubeError('This video is already used in another journal.')
        return
      }

      if (youtubeVideos.some((v) => v.id === data.id)) {
        setYoutubeError('This video has already been added.')
        return
      }

      setYoutubeVideos((prev) => [...prev, data])
      setYoutubeUrl('')
    } catch {
      setYoutubeError('Network error. Please try again.')
    } finally {
      setYoutubeLoading(false)
    }
  }

  function removeYoutubeVideo(id: number) {
    setYoutubeVideos((prev) => prev.filter((v) => v.id !== id))
  }

  function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    router.post(
      `/projects/${selectedProject.id}/journal_entries`,
      {
        timelapse_ids: Array.from(selectedTimelapses),
        youtube_video_ids: youtubeVideos.map((v) => v.id),
        content: markdown,
        images: blobSignedIds,
      },
      {
        onSuccess: () => {
          if (draftKey)
            try {
              localStorage.removeItem(draftKey)
            } catch {}
        },
        onFinish: () => setSubmitting(false),
      },
    )
  }

  function submitButtonText() {
    if (submitting) return 'Creating...'
    const parts: string[] = []
    if (selectedTimelapses.size > 0)
      parts.push(`${selectedTimelapses.size} timelapse${selectedTimelapses.size !== 1 ? 's' : ''}`)
    if (youtubeVideos.length > 0) parts.push(`${youtubeVideos.length} video${youtubeVideos.length !== 1 ? 's' : ''}`)
    return `Create Journal (${parts.join(', ')})`
  }

  const content = (
    <div className="w-full h-full mx-auto p-8 overflow-y-auto">
      <h1 className="font-bold text-3xl mb-4">New Journal</h1>
      <p className="text-lg">
        Journaling for:{' '}
        {projects.length > 1 ? (
          <select
            value={selectedProject?.id ?? ''}
            onChange={(e) => setSelectedProject(projects.find((p) => p.id === Number(e.target.value)) ?? null)}
            className="font-bold bg-transparent border-b-2 border-dark-brown cursor-pointer outline-none"
          >
            <option value="" disabled>
              Select a project
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-bold">{selectedProject?.name}</span>
        )}
      </p>

      <div className="mt-6">
        <h2 className="font-bold text-xl mb-4">How did you track your time</h2>

        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-bold text-lg">Lapse</h3>
              {lapse_connected && (
                <a
                  href="https://lapse.hackclub.com/timelapse/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-4 border-2 font-bold uppercase bg-brown text-light-brown border-dark-brown cursor-pointer text-sm"
                >
                  Start a timelapse
                </a>
              )}
            </div>
            <p className="text-dark-brown/60 text-sm mb-3">
              Remember to publish the timelapse. Unlisted ones are accepted too!
            </p>
            {!lapse_connected && (
              <div
                className={`p-4 border border-amber-300 bg-amber-50 rounded-lg relative ${!selectedProject ? 'pointer-events-none' : ''}`}
              >
                {!selectedProject && <DisabledOverlay />}
                <p className="font-bold mb-2">Connect Lapse</p>
                <p className="mb-3 text-sm">You need to connect Lapse to record timelapses for your journal.</p>
                {selectedProject && (
                  <a
                    href={`/auth/lapse/start?return_to=journal&project_id=${selectedProject.id}`}
                    className="inline-block py-1.5 px-4 border-2 font-bold uppercase bg-brown text-light-brown border-dark-brown cursor-pointer text-sm"
                  >
                    Connect Lapse
                  </a>
                )}
              </div>
            )}
            {lapse_connected && (
              <Deferred data="timelapses" fallback={<TimelapseSkeleton />}>
                <TimelapseBrowser
                  timelapses={timelapses ?? []}
                  selectedTimelapses={selectedTimelapses}
                  onToggle={toggleTimelapse}
                />
              </Deferred>
            )}
          </div>

          <div>
            <h3 className="font-bold text-lg mb-1">YouTube video of screen recording or live stream</h3>
            <p className="text-dark-brown/60 text-sm mb-3">
              Screen recordings need to be real time and show the system clock. Live streams need to have DVR enabled.
            </p>
            <div className={`relative ${!selectedProject ? 'pointer-events-none' : ''}`}>
              {!selectedProject && <DisabledOverlay />}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value)
                    setYoutubeError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleYoutubeLookup()
                    }
                  }}
                  placeholder="Paste a YouTube video URL..."
                  className="flex-1 px-3 py-2 border-2 border-dark-brown rounded bg-transparent outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={handleYoutubeLookup}
                  disabled={youtubeLoading || !youtubeUrl.trim()}
                  className="py-2 px-4 border-2 font-bold uppercase bg-brown text-light-brown border-dark-brown cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {youtubeLoading ? 'Loading...' : 'Add'}
                </button>
              </div>
              {youtubeError && <p className="text-red-500 text-sm mt-1">{youtubeError}</p>}
            </div>

            {youtubeVideos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mt-3">
                {youtubeVideos.map((video) => (
                  <div
                    key={video.id}
                    className="group relative aspect-video rounded overflow-hidden border-2 border-dark-brown"
                  >
                    <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeYoutubeVideo(video.id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-dark-brown rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors"
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2 pt-6">
                      <p className="text-white text-sm font-medium truncate text-left">{video.title}</p>
                      <p className="text-white/70 text-xs text-left">
                        {video.duration_seconds ? formatDuration(video.duration_seconds) : ''}
                        {video.was_live ? ' \u2022 Live stream' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-bold text-xl mb-3">Write about what you did</h2>
        <div className={`relative ${!selectedProject ? 'pointer-events-none' : ''}`}>
          {!selectedProject && <DisabledOverlay />}
          <MarkdownEditor
            value={markdown}
            onChange={setMarkdown}
            onBlobsChange={setBlobSignedIds}
            directUploadUrl={direct_upload_url}
            previewUrl="/journal_entries/preview"
          />
        </div>
        {selectedProject && (
          <div className="flex items-center justify-between mt-1.5 text-xs">
            <span className="text-dark-brown">{draftStatus ?? '\u00A0'}</span>
            <div className="flex gap-4">
              <span className={hasEnoughChars ? 'text-dark-brown' : 'text-red-500'}>
                Min characters {charCount}/{MIN_CHARS}
              </span>
              <span className={hasEnoughImages ? 'text-dark-brown' : 'text-red-500'}>
                Min images {markdownImageCount}/{MIN_IMAGES}
              </span>
            </div>
          </div>
        )}
      </div>
      {hasRecording && (
        <div className="mt-6">
          <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
            {submitButtonText()}
          </Button>
        </div>
      )}
    </div>
  )

  if (is_modal) {
    return (
      <Modal panelClasses="h-full" paddingClasses="max-w-5xl mx-auto" closeButton={false} maxWidth="7xl">
        <Frame className="h-full">{content}</Frame>
      </Modal>
    )
  }

  return content
}

function DisabledOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-brown/30 rounded cursor-default">
      <p className="text-lg font-bold text-dark-brown">Select a project up top first!</p>
    </div>
  )
}

function TimelapseSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="aspect-video rounded-lg bg-gray-200 animate-pulse" />
      ))}
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    const remainMins = mins % 60
    return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function TimelapseBrowser({
  timelapses,
  selectedTimelapses,
  onToggle,
}: {
  timelapses: Timelapse[]
  selectedTimelapses: Set<string>
  onToggle: (id: string) => void
}) {
  if (timelapses.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center gap-3">
        <p className="text-dark-brown">No timelapses found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {timelapses.map((timelapse) => {
          const selected = selectedTimelapses.has(timelapse.id)
          return (
            <button
              key={timelapse.id}
              type="button"
              onClick={() => onToggle(timelapse.id)}
              className={`group relative aspect-video rounded overflow-hidden border-2 border-dark-brown transition-all cursor-pointer ${selected ? 'scale-105 shadow-lg' : 'hover:scale-105'}`}
            >
              <img src={timelapse.thumbnailUrl} alt={timelapse.name} className="w-full h-full object-cover" />
              {selected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-dark-brown rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2 pt-6">
                <p className="text-white text-sm font-medium truncate text-left">{timelapse.name}</p>
                <p className="text-white/70 text-xs text-left">{formatDuration(timelapse.duration)}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

NewJournal.layout = (page: ReactNode) => page

export default NewJournal
