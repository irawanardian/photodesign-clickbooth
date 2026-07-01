import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import Button from '../components/ui/Button'
import { frames } from '../data/frames'
import { layouts } from '../data/layouts'
import { deleteSession, getSessions } from '../services/sessionApi'

function getFrameName(frameId) {
  return frames.find((frame) => frame.id === frameId)?.name || frameId
}

function getLayoutName(layoutId) {
  return layouts.find((layout) => layout.id === layoutId)?.name || layoutId
}

function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function SessionListPage({
  onLaunchSession,
  onCreateSession,
  onEditSession,
  onOpenGallery,
  onOpenTemplates,
}) {
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingSessionId, setDeletingSessionId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [qrSession, setQrSession] = useState(null)
  const [qrImageUrl, setQrImageUrl] = useState('')
  const [qrErrorMessage, setQrErrorMessage] = useState('')

  async function loadSessions() {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const data = await getSessions()
      setSessions(data)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteSession(session) {
    const isConfirmed = window.confirm(
      `Hapus sesi "${session.sessionName}"?\n\nData akan disembunyikan dari daftar sesi.`,
    )

    if (!isConfirmed) return

    try {
      setDeletingSessionId(session.id)
      setErrorMessage('')

      await deleteSession(session.id)
      await loadSessions()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setDeletingSessionId(null)
    }
  }

  function buildSessionGalleryUrl(sessionId) {
    return `${window.location.origin}?gallerySessionId=${sessionId}`
  }

  async function handleOpenSessionQr(session) {
    try {
      setQrSession(session)
      setQrImageUrl('')
      setQrErrorMessage('')

      const galleryUrl = buildSessionGalleryUrl(session.id)
      const qrDataUrl = await QRCode.toDataURL(galleryUrl, {
        width: 360,
        margin: 2,
      })

      setQrImageUrl(qrDataUrl)
    } catch (error) {
      setQrErrorMessage('Gagal membuat QR sesi.')
    }
  }

  function handleCloseSessionQr() {
    setQrSession(null)
    setQrImageUrl('')
    setQrErrorMessage('')
  }

  useEffect(() => {
    loadSessions()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-4 text-white sm:px-6 sm:py-5">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-pink-300">
              Web Photobooth App
            </p>

            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight md:text-3xl">
              Daftar Sesi
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Kelola sesi photobooth, pilih template, buka booth, dan lihat galeri hasil foto.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Total sesi aktif: {sessions.length}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex lg:shrink-0">
            <Button
              variant="secondary"
              onClick={loadSessions}
              className="w-full px-4 py-3 sm:w-auto"
            >
              Refresh
            </Button>

            <Button
              variant="secondary"
              onClick={onOpenTemplates}
              className="w-full px-4 py-3 sm:w-auto"
            >
              Template
            </Button>

            <Button
              onClick={onCreateSession}
              className="col-span-2 w-full px-4 py-3 sm:col-span-1 sm:w-auto"
            >
              Buat Sesi
            </Button>
          </div>
        </header>

        {isLoading && (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.8rem] sm:p-6">
            <p className="text-sm text-slate-300">Memuat data sesi...</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 rounded-[1.5rem] border border-red-400/20 bg-red-500/10 p-5 sm:rounded-[1.8rem] sm:p-6">
            <p className="text-sm text-red-300">{errorMessage}</p>

            <Button
              variant="secondary"
              onClick={loadSessions}
              className="mt-4 w-full sm:w-auto"
            >
              Coba Lagi
            </Button>
          </div>
        )}

        {!isLoading && !errorMessage && sessions.length === 0 && (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center sm:rounded-[1.8rem] sm:p-8">
            <h2 className="text-lg font-semibold">Belum ada sesi</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">
              Buat sesi photobooth pertama untuk mulai mengatur event, template, layout, dan countdown.
            </p>

            <Button onClick={onCreateSession} className="mt-5 w-full sm:w-auto">
              Buat Sesi
            </Button>
          </div>
        )}

        {!isLoading && sessions.length > 0 && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="flex flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:rounded-[1.8rem] sm:p-5"
              >
                <div className="mb-5 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-pink-300">
                      Session #{session.id}
                    </p>

                    <p className="shrink-0 text-xs text-slate-500">
                      {formatDate(session.createdAt)}
                    </p>
                  </div>

                  <h2 className="mt-2 break-words text-xl font-bold leading-tight">
                    {session.sessionName}
                  </h2>

                  <p className="mt-2 break-words text-sm leading-6 text-slate-300">
                    {session.eventTitle}
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-slate-400">
                    {session.eventSubtitle}
                  </p>
                </div>

                <div className="grid gap-2 rounded-2xl bg-slate-900 p-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-400">Template</span>
                    <span className="text-right font-semibold">
                      {getFrameName(session.frameId)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-400">Layout</span>
                    <span className="text-right font-semibold">
                      {getLayoutName(session.layoutId)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-400">Foto</span>
                    <span className="text-right font-semibold">
                      {session.totalPhotos} Foto
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-400">Countdown</span>
                    <span className="text-right font-semibold">
                      {session.countdownSeconds}s
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-400">Ukuran</span>
                    <span className="text-right font-semibold uppercase">
                      {session.printSize || '4r'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={() => onLaunchSession(session)}
                    className="w-full py-3.5 sm:col-span-2"
                    disabled={deletingSessionId === session.id}
                  >
                    Launch Booth
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => onEditSession(session)}
                    className="w-full py-3.5"
                    disabled={deletingSessionId === session.id}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => onOpenGallery(session)}
                    className="w-full py-3.5"
                    disabled={deletingSessionId === session.id}
                  >
                    Galeri
                  </Button>

                    <Button
                      variant="secondary"
                      onClick={() => onOpenTemplates(session)}
                      className="py-2.5 text-sm"
                    >
                      Template
                    </Button>

                  <Button
                    variant="secondary"
                    onClick={() => handleOpenSessionQr(session)}
                    className="w-full py-3.5 sm:col-span-2"
                    disabled={deletingSessionId === session.id}
                  >
                    QR Sesi
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => handleDeleteSession(session)}
                    className="w-full py-3.5 sm:col-span-2"
                    disabled={deletingSessionId === session.id}
                  >
                    {deletingSessionId === session.id
                      ? 'Menghapus...'
                      : 'Hapus Sesi'}
                  </Button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {qrSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-[1.4rem] border border-white/10 bg-slate-950 p-4 shadow-2xl shadow-black sm:max-w-[400px] sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-pink-300">
                  QR Galeri Sesi
                </p>

                <h2 className="mt-1 break-words text-lg font-bold sm:text-xl">
                  {qrSession.sessionName}
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                  Tamu scan QR ini untuk melihat semua foto pada sesi ini.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseSessionQr}
                className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                X
              </button>
            </div>

            <div className="rounded-[1.2rem] bg-white p-3">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="QR galeri sesi"
                  className="mx-auto h-auto w-full max-w-[220px] sm:max-w-[260px]"
                />
              ) : (
                <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">
                  Membuat QR...
                </div>
              )}
            </div>

            {qrErrorMessage && (
              <p className="mt-4 text-sm text-red-300">{qrErrorMessage}</p>
            )}

            <p className="mt-3 max-h-16 overflow-auto break-all rounded-2xl bg-slate-900 p-3 text-[11px] leading-5 text-slate-400">
              {buildSessionGalleryUrl(qrSession.id)}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <a
                href={buildSessionGalleryUrl(qrSession.id)}
                target="_blank"
                rel="noreferrer"
              >
                <Button className="w-full py-3.5">
                  Buka
                </Button>
              </a>

              {qrImageUrl && (
                <a
                  href={qrImageUrl}
                  download={`qr-galeri-sesi-${qrSession.id}.png`}
                >
                  <Button variant="secondary" className="w-full py-3.5">
                    Download QR
                  </Button>
                </a>
              )}

              <Button
                variant="secondary"
                onClick={handleCloseSessionQr}
                className="w-full py-3.5"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default SessionListPage
