import { useEffect, useState } from 'react'
import BoothPage from './pages/BoothPage'
import HomePage from './pages/HomePage'
import PhotoGalleryPage from './pages/PhotoGalleryPage'
import SessionFormPage from './pages/SessionFormPage'
import SessionListPage from './pages/SessionListPage'
import SettingsPage from './pages/SettingsPage'
import TemplateManagerPage from './pages/TemplateManagerPage'
import { frames as defaultFrames } from './data/frames'
import { layouts } from './data/layouts'
import { printSizes } from './data/printSizes'
import { getSessionById } from './services/sessionApi'
import { getTemplates } from './services/templateApi'

function findLayout(layoutId) {
  return layouts.find((layout) => layout.id === layoutId) || layouts[0]
}

function findPrintSize(printSizeId) {
  return printSizes.find((printSize) => printSize.id === printSizeId) || printSizes[1]
}

function App() {
  const [activeScreen, setActiveScreen] = useState('sessions')
  const [activeSession, setActiveSession] = useState(null)
  const [gallerySession, setGallerySession] = useState(null)
  const [editingSession, setEditingSession] = useState(null)
  const [templateSession, setTemplateSession] = useState(null)
  const [boothSettings, setBoothSettings] = useState(null)
  const [templateFrames, setTemplateFrames] = useState(defaultFrames)
  const [isOpeningSharedGallery, setIsOpeningSharedGallery] = useState(false)

  function findFrame(frameId, availableFrames = templateFrames) {
    return (
      availableFrames.find((frame) => frame.id === frameId) ||
      defaultFrames.find((frame) => frame.id === frameId) ||
      availableFrames[0] ||
      defaultFrames[0]
    )
  }

  function sessionToSettings(session, availableFrames = templateFrames) {
    return {
      selectedFrame: findFrame(session.frameId, availableFrames),
      selectedLayout: findLayout(session.layoutId),
      selectedPrintSize: findPrintSize(session.printSize),
      totalPhotos: session.totalPhotos,
      countdownSeconds: session.countdownSeconds,
      eventTitle: session.eventTitle,
      eventSubtitle: session.eventSubtitle,
    }
  }

  async function loadTemplateFramesForSession(sessionId) {
    try {
      const templates = await getTemplates(sessionId)
      const availableTemplates = templates.length > 0 ? templates : defaultFrames

      setTemplateFrames(availableTemplates)
      return availableTemplates
    } catch (error) {
      console.error('Gagal mengambil template sesi:', error)
      setTemplateFrames(defaultFrames)
      return defaultFrames
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gallerySessionId = params.get('gallerySessionId')

    if (!gallerySessionId) return

    async function openSharedGallery() {
      try {
        setIsOpeningSharedGallery(true)

        const session = await getSessionById(gallerySessionId)
        setGallerySession(session)
        setActiveScreen('gallery')
      } catch (error) {
        console.error('Gagal membuka galeri dari QR:', error)
        setActiveScreen('sessions')
      } finally {
        setIsOpeningSharedGallery(false)
      }
    }

    openSharedGallery()
  }, [])

  function updateBoothSettings(newSettings) {
    setBoothSettings((currentSettings) => ({
      ...currentSettings,
      ...newSettings,
    }))
  }

  async function handleLaunchSession(session) {
    setActiveSession(session)

    const availableTemplates = await loadTemplateFramesForSession(session.id)
    setBoothSettings(sessionToSettings(session, availableTemplates))

    setActiveScreen('template')
  }

  function handleCreateSession() {
    setEditingSession(null)
    setActiveScreen('createSession')
  }

  function handleEditSession(session) {
    setEditingSession(session)
    setActiveScreen('editSession')
  }

  function handleOpenGallery(session) {
    setGallerySession(session)
    setActiveScreen('gallery')
  }

  function handleOpenTemplates(session) {
    setTemplateSession(session)
    setActiveScreen('templates')
  }

  function handleBackFromTemplates() {
    setTemplateSession(null)
    setActiveScreen('sessions')
  }

  function handleBackFromGallery() {
    setGallerySession(null)
    setActiveScreen('sessions')

    if (window.location.search.includes('gallerySessionId=')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  function handleSessionSaved() {
    setEditingSession(null)
    setActiveScreen('sessions')
  }

  if (isOpeningSharedGallery) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-sm text-slate-300">Membuka galeri...</p>
        </div>
      </main>
    )
  }

  if (activeScreen === 'templates') {
    return (
      <TemplateManagerPage
        session={templateSession}
        onBack={handleBackFromTemplates}
      />
    )
  }

  if (activeScreen === 'createSession') {
    return (
      <SessionFormPage
        frames={defaultFrames}
        layouts={layouts}
        printSizes={printSizes}
        onCancel={() => setActiveScreen('sessions')}
        onSaved={handleSessionSaved}
      />
    )
  }

  if (activeScreen === 'editSession' && editingSession) {
    return (
      <SessionFormPage
        frames={defaultFrames}
        layouts={layouts}
        printSizes={printSizes}
        initialSession={editingSession}
        onCancel={() => {
          setEditingSession(null)
          setActiveScreen('sessions')
        }}
        onSaved={handleSessionSaved}
      />
    )
  }

  if (activeScreen === 'gallery' && gallerySession) {
    return (
      <PhotoGalleryPage
        session={gallerySession}
        onBack={handleBackFromGallery}
      />
    )
  }

  if (activeScreen === 'booth' && activeSession && boothSettings) {
    return (
      <BoothPage
        sessionId={activeSession.id}
        settings={boothSettings}
        onBackHome={() => setActiveScreen('template')}
        onOpenSettings={() => setActiveScreen('settings')}
      />
    )
  }

  if (activeScreen === 'settings' && activeSession && boothSettings) {
    return (
      <SettingsPage
        settings={boothSettings}
        layouts={layouts}
        printSizes={printSizes}
        onChangeSettings={updateBoothSettings}
        onBack={() => setActiveScreen('template')}
      />
    )
  }

  if (activeScreen === 'template' && activeSession && boothSettings) {
    return (
      <HomePage
        settings={boothSettings}
        frames={templateFrames}
        onSelectFrame={(frame) => updateBoothSettings({ selectedFrame: frame })}
        onStartBooth={() => setActiveScreen('booth')}
        onOpenSettings={() => setActiveScreen('settings')}
      />
    )
  }

  return (
    <SessionListPage
      onLaunchSession={handleLaunchSession}
      onCreateSession={handleCreateSession}
      onEditSession={handleEditSession}
      onOpenGallery={handleOpenGallery}
      onOpenTemplates={handleOpenTemplates}
    />
  )
}

export default App
