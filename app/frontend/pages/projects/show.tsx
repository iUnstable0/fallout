import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import { Modal } from '@inertiaui/modal-react'
import Frame from '@/components/shared/Frame'
import Button from '@/components/shared/Button'
import Input from '@/components/shared/Input'
import { notify } from '@/lib/notifications'
import type { ProjectDetail, JournalEntryCard, CollaboratorInfo, PendingInvite } from '@/types'
import { usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'

function isSafeUrl(url: string | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function ProjectsShow({
  project,
  journal_entries,
  collaborators,
  pending_invites,
  can,
  is_modal,
}: {
  project: ProjectDetail
  journal_entries: JournalEntryCard[]
  collaborators: CollaboratorInfo[]
  pending_invites: PendingInvite[]
  can: { update: boolean; destroy: boolean; manage_collaborators: boolean; create_journal_entry: boolean }
  is_modal?: boolean
}) {
  const { errors } = usePage<SharedProps>().props
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  function deleteProject() {
    if (confirm('Are you sure?')) {
      router.delete(`/projects/${project.id}`, {
        onError: () => notify('alert', 'Failed to delete project. Please try again.'),
      })
    }
  }

  function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim() || inviting) return
    setInviting(true)
    router.post(
      `/projects/${project.id}/collaboration_invites`,
      { email: inviteEmail.trim() },
      {
        onSuccess: () => setInviteEmail(''),
        onError: () => notify('alert', 'Failed to send invite.'),
        onFinish: () => setInviting(false),
      },
    )
  }

  function revokeInvite(inviteId: number) {
    if (confirm('Revoke this invite?')) {
      router.delete(`/projects/${project.id}/collaboration_invites/${inviteId}`)
    }
  }

  const content = (
    <div className="w-full mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-4xl">{project.name}</h1>
        <div className="flex gap-2">
          {can.create_journal_entry && (
            <Link
              href={`/projects/${project.id}/journal_entries/new`}
              className="bg-brown text-light-brown border-2 border-dark-brown px-4 py-2 font-bold uppercase hover:opacity-80"
            >
              New Journal Entry
            </Link>
          )}
          {can.update && (
            <Link href={`/projects/${project.id}/edit`} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
              Edit
            </Link>
          )}
          {can.destroy && (
            <button onClick={deleteProject} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Delete
            </button>
          )}
        </div>
      </div>

      {project.is_unlisted && (
        <span className="inline-block bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded mb-4">Unlisted</span>
      )}

      {project.description && <p className="text-gray-700 mb-4">{project.description}</p>}

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag) => (
            <span key={tag} className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-4 text-sm text-gray-500 mb-6">
        {isSafeUrl(project.demo_link) && (
          <a href={project.demo_link!} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
            Demo
          </a>
        )}
        {isSafeUrl(project.repo_link) && (
          <a href={project.repo_link!} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
            Repository
          </a>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Created by {project.user_display_name} on {project.created_at}
      </p>

      {/* Collaborators section */}
      {(collaborators.length > 0 || can.manage_collaborators) && (
        <div className="mt-6 border-t pt-4">
          <h2 className="font-bold text-lg mb-3">Collaborators</h2>

          {collaborators.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center gap-2 bg-brown rounded-full px-3 py-1">
                  <img src={c.avatar} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-sm text-light-brown">{c.display_name}</span>
                </div>
              ))}
            </div>
          )}

          {collaborators.length === 0 && <p className="text-sm text-dark-brown mb-4">No collaborators yet.</p>}

          {can.manage_collaborators && (
            <>
              <form onSubmit={sendInvite} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Invite by email..."
                    disabled={inviting}
                  />
                  {errors?.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
                </div>
                <Button type="submit" disabled={inviting || !inviteEmail.trim()} className="text-sm">
                  {inviting ? 'Sending...' : 'Invite'}
                </Button>
              </form>

              {pending_invites.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-bold text-dark-brown mb-2">Pending invites</p>
                  <div className="space-y-2">
                    {pending_invites.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between bg-light-brown rounded px-3 py-2">
                        <div className="flex items-center gap-2">
                          <img src={inv.invitee_avatar} alt="" className="w-6 h-6 rounded-full" />
                          <span className="text-sm">{inv.invitee_display_name}</span>
                          <span className="text-xs text-dark-brown">{inv.created_at}</span>
                        </div>
                        <button
                          onClick={() => revokeInvite(inv.id)}
                          className="text-xs text-dark-brown font-bold hover:underline cursor-pointer"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {journal_entries.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-2xl mb-4">Journal Entries</h2>
          <div className="space-y-6">
            {journal_entries.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-5">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: entry.content_html }} />

                {entry.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {entry.images.map((src, i) => (
                      <img key={i} src={src} alt="" className="rounded h-32 object-cover" />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-4 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{entry.author_display_name}</span>
                  {entry.collaborators.length > 0 && (
                    <span>with {entry.collaborators.map((c) => c.display_name).join(', ')}</span>
                  )}
                  <span>{entry.created_at}</span>
                  {entry.recordings_count > 0 && (
                    <span>
                      {entry.recordings_count} recording{entry.recordings_count !== 1 && 's'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
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
