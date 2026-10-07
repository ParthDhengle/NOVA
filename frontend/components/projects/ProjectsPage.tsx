'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FolderKanban,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Upload,
  X,
} from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import { filesApi } from '@/lib/api/files'
import { projectsApi, type CreateProjectRequest } from '@/lib/api/projects'
import type { Chat, Memory, Project, UploadedFile } from '@/lib/api/types'
import { IconButton } from '@/components/ui/IconButton'

type Props = {
  onNewChat: (projectId?: string) => void
  onSelectChat: (id: string) => void
}
type ProjectTab = 'chats' | 'files' | 'memory' | 'instructions'

export function ProjectsPage({ onNewChat, onSelectChat }: Props) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [tab, setTab] = useState<ProjectTab>('chats')
  const [projectChats, setProjectChats] = useState<Chat[]>([])
  const [projectFiles, setProjectFiles] = useState<UploadedFile[]>([])
  const [projectMemories, setProjectMemories] = useState<Memory[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailRetry, setDetailRetry] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    projectsApi.list()
      .then(setProjects)
      .catch((cause: unknown) => setError(
        cause instanceof ApiError ? cause.message : 'Unable to load projects.'
      ))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load, retry])

  useEffect(() => {
    if (!selected) return
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    const loadDetails = async () => {
      try {
        if (tab === 'chats') {
          const chats = await projectsApi.chats(selected.id)
          if (!cancelled) setProjectChats(chats)
        } else if (tab === 'files') {
          const files = await projectsApi.files(selected.id)
          if (!cancelled) setProjectFiles(files)
        } else if (tab === 'memory') {
          const memories = await projectsApi.memories(selected.id)
          if (!cancelled) setProjectMemories(memories)
        }
      } catch (cause) {
        if (!cancelled) setDetailError(cause instanceof Error ? cause.message : `Unable to load project ${tab}.`)
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }
    void loadDetails()
    return () => { cancelled = true }
  }, [selected, tab, detailRetry])

  const createProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const project: CreateProjectRequest = {
      name: newName.trim(),
      description: newDescription.trim(),
      instructions: '',
    }
    try {
      const created = await projectsApi.create(project)
      setProjects((current) => [created, ...current])
      setSelected(created)
      setInstructions(created.instructions)
      setCreating(false)
      setNewName('')
      setNewDescription('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create project.')
    } finally {
      setSaving(false)
    }
  }

  const saveInstructions = async () => {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      const updated = await projectsApi.update(selected.id, { instructions })
      setSelected(updated)
      setProjects((current) => current.map((project) => project.id === updated.id ? updated : project))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save project instructions.')
    } finally {
      setSaving(false)
    }
  }

  const uploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!selected) return
    setUploadMessage(null)
    let uploadedCount = 0
    for (const file of files) {
      try {
        await filesApi.upload(file, selected.id)
        uploadedCount += 1
      } catch (cause) {
        if (uploadedCount > 0) {
          setSelected((current) => current ? { ...current, files: current.files + uploadedCount } : current)
          setProjects((current) => current.map((project) =>
            project.id === selected.id ? { ...project, files: project.files + uploadedCount } : project
          ))
        }
        setUploadMessage(cause instanceof Error ? cause.message : `Unable to upload ${file.name}.`)
        return
      }
    }
    setUploadMessage(`${uploadedCount} file${uploadedCount === 1 ? '' : 's'} uploaded.`)
    setSelected((current) => current ? { ...current, files: current.files + uploadedCount } : current)
    setProjects((current) => current.map((project) =>
      project.id === selected.id ? { ...project, files: project.files + uploadedCount } : project
    ))
  }

  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Workspace</span>
          <h1>Projects</h1>
          <p>Keep conversations, files, instructions, and memory together.</p>
        </div>
        <button className="primary" onClick={() => setCreating((value) => !value)}>
          <Plus /> New project
        </button>
      </header>

      {error && <div className="request-error request-banner" role="alert">
        <span>{error}</span><button className="quiet" onClick={() => setRetry((value) => value + 1)}>Retry</button>
      </div>}
      {creating && (
        <form className="panel project-create" onSubmit={createProject}>
          <label>Project name<input value={newName} onChange={(event) => setNewName(event.target.value)} required /></label>
          <label>Description<input value={newDescription} onChange={(event) => setNewDescription(event.target.value)} /></label>
          <div className="panel-actions">
            <button className="quiet" type="button" onClick={() => setCreating(false)}>Cancel</button>
            <button className="primary" type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create project'}</button>
          </div>
        </form>
      )}
      {loading && <p className="muted">Loading projects…</p>}
      {!loading && !error && projects.length === 0 && <p className="empty">No projects yet. Create a project to get started.</p>}

      <div className="cards">
        {projects.map((project) => (
          <button
            className={`project-card ${selected?.id === project.id ? 'selected' : ''}`}
            key={project.id}
            onClick={() => {
              setSelected(project)
              setInstructions(project.instructions)
              setUploadMessage(null)
              setTab('chats')
            }}
          >
            <div className="project-icon"><FolderKanban /></div>
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <span>{project.chats} chats · {project.files} files</span>
            <MoreHorizontal />
          </button>
        ))}
      </div>

      {selected && (
        <div className="detail-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Project detail</span><h2>{selected.name}</h2></div>
            <IconButton label="Close" onClick={() => setSelected(null)}><X /></IconButton>
          </div>
          <div className="tabs">
            <button className={tab === 'chats' ? 'selected' : ''} onClick={() => setTab('chats')}>Chats ({selected.chats})</button>
            <button className={tab === 'files' ? 'selected' : ''} onClick={() => setTab('files')}>Files ({selected.files})</button>
            <button className={tab === 'memory' ? 'selected' : ''} onClick={() => setTab('memory')}>Memory</button>
            <button className={tab === 'instructions' ? 'selected' : ''} onClick={() => setTab('instructions')}>Instructions</button>
          </div>
          <div className="detail-content">
            {detailLoading && <p className="muted">Loading project {tab}…</p>}
            {detailError && <div className="request-error" role="alert">
              {detailError}<button className="quiet" onClick={() => setDetailRetry((value) => value + 1)}>Retry</button>
            </div>}
            {!detailLoading && !detailError && tab === 'chats' && (
              <>
                <p>{selected.description}</p>
                {projectChats.map((chat) => <button className="quiet full" key={chat.id} onClick={() => onSelectChat(chat.id)}>{chat.title}</button>)}
                {projectChats.length === 0 && <p className="empty">No conversations in this project.</p>}
                <button className="quiet" onClick={() => onNewChat(selected.id)}><MessageSquare /> Open project chat</button>
              </>
            )}
            {!detailLoading && !detailError && tab === 'files' && (
              <>
                {projectFiles.map((file) => <div className="memory-row" key={file.id}><span>{file.name}<small>{file.content_type}</small></span></div>)}
                {projectFiles.length === 0 && <p className="empty">No files in this project.</p>}
                <button className="quiet" onClick={() => fileInput.current?.click()}><Upload /> Add files</button>
                <input ref={fileInput} type="file" multiple hidden onChange={uploadFiles} />
                {uploadMessage && <p role="status">{uploadMessage}</p>}
              </>
            )}
            {!detailLoading && !detailError && tab === 'memory' && (
              <>
                {projectMemories.map((memory) => <div className="memory-row" key={memory.id}><span>{memory.text}<small>{new Date(memory.created_at).toLocaleDateString()}</small></span></div>)}
                {projectMemories.length === 0 && <p className="empty">No memories in this project.</p>}
              </>
            )}
            {!detailLoading && tab === 'instructions' && (
              <>
                <label className="project-instructions">
                  Instructions
                  <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} />
                </label>
                <button className="primary" disabled={saving} onClick={() => void saveInstructions()}>
                  {saving ? 'Saving…' : 'Save instructions'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
