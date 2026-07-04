import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import {
  buildPhotoUrl,
  getPhotosBySession,
} from '../services/photoApi'

const AUTO_REFRESH_INTERVAL = 10000

function formatDateTime(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getOriginalPhotos(photo) {
  const value = photo?.originalPhotos || photo?.original_photos || []

  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean)
      }
    } catch {
      return value ? [value] : []
    }
  }

  return []
}

function PhotoDetailModal({
  photo,
  onClose,
}) {
  if (!photo) return null

  const finalPhotoUrl = buildPhotoUrl(photo.imageUrl)
  const originalPhotos = getOriginalPhotos(photo)
  const [selectedOriginalPhoto, setSelectedOriginalPhoto] = useState(null)

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detail foto ${photo.id}`}
        className="mx-auto max-w-6xl overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950 text-white shadow-2xl shadow-black/50 sm:rounded-[2rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div>
            <p className="text-xs font-medium text-pink-300">
              Detail Foto
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              Photo #{photo.id}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {formatDateTime(photo.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xl font-bold text-white transition hover:bg-white/[0.12]"
            aria-label="Tutup detail foto"
          >
            ×
          </button>
        </header>

        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] sm:p-5">
          <section className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-100">
                Foto Final / Layout
              </h3>

              <a
                href={finalPhotoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-pink-300 hover:text-pink-200"
              >
                Buka besar
              </a>
            </div>

            <div className="rounded-[1.4rem] bg-slate-900 p-2 sm:p-3">
              <img
                src={finalPhotoUrl}
                alt={`Hasil final photobooth ${photo.id}`}
                className="max-h-[78vh] w-full rounded-[1rem] object-contain"
              />
            </div>
          </section>

          <aside className="min-w-0">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                Informasi Foto
              </h3>

              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4 rounded-2xl bg-slate-900 px-4 py-3">
                  <span className="text-slate-400">Template</span>
                  <span className="text-right font-semibold">{photo.frameId}</span>
                </div>

                <div className="flex justify-between gap-4 rounded-2xl bg-slate-900 px-4 py-3">
                  <span className="text-slate-400">Layout</span>
                  <span className="text-right font-semibold">{photo.layoutId}</span>
                </div>

                <div className="flex justify-between gap-4 rounded-2xl bg-slate-900 px-4 py-3">
                  <span className="text-slate-400">Original</span>
                  <span className="text-right font-semibold">{originalPhotos.length} foto</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <a href={finalPhotoUrl} target="_blank" rel="noreferrer">
                  <Button className="w-full py-3.5">
                    Buka Foto
                  </Button>
                </a>

                <a href={finalPhotoUrl} download={photo.fileName}>
                  <Button variant="secondary" className="w-full py-3.5">
                    Download
                  </Button>
                </a>
              </div>
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-100">
                  Foto Asli Capture
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Bagian ini akan menampilkan foto asli satu per satu sebelum masuk template.
                </p>
              </div>

              {originalPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {originalPhotos.map((originalPhoto, index) => {
                    const originalUrl = buildPhotoUrl(originalPhoto.imageUrl || originalPhoto.url || originalPhoto)

                    return (
                      <button
                        key={`${originalUrl}-${index}`}
                        type="button"
                        onClick={() => setSelectedOriginalPhoto({
                          url: originalUrl,
                          label: `Foto ${index + 1}`,
                        })}
                        className="group overflow-hidden rounded-2xl bg-slate-900 p-2 text-left"
                      >
                        <img
                          src={originalUrl}
                          alt={`Foto asli ${index + 1}`}
                          loading="lazy"
                          className="aspect-[3/4] w-full rounded-xl object-cover transition group-hover:scale-[1.02]"
                        />

                        <p className="mt-2 text-center text-xs font-semibold text-slate-300">
                          Foto {index + 1}
                        </p>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900 p-4">
                  <p className="text-sm leading-6 text-slate-300">
                    Foto asli belum tersimpan di data galeri. Setelah backend dan BoothPage dikirim field original photos, foto asli akan muncul di sini.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {selectedOriginalPhoto && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4 py-6"
            onClick={() => setSelectedOriginalPhoto(null)}
          >
            <div
              className="max-h-full w-full max-w-4xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/70"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-sm font-bold text-white">
                  {selectedOriginalPhoto.label}
                </p>

                <button
                  type="button"
                  onClick={() => setSelectedOriginalPhoto(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-xl font-bold text-white transition hover:bg-white/[0.14]"
                  aria-label="Tutup preview foto asli"
                >
                  ×
                </button>
              </div>

              <div className="p-3 sm:p-4">
                <img
                  src={selectedOriginalPhoto.url}
                  alt={selectedOriginalPhoto.label}
                  className="mx-auto max-h-[82vh] w-full rounded-2xl object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PhotoGalleryPage({
  session,
  onBack,
}) {
  const [photos, setPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  const isPublicGallery = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.has('gallerySessionId')
  }, [])

  async function loadPhotos({
    silent = false,
  } = {}) {
    try {
      if (silent) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      setErrorMessage('')
      const data = await getPhotosBySession(session.id)

      setPhotos(data)
      setLastUpdatedAt(new Date())
    } catch (error) {
      if (!silent) {
        setErrorMessage(error.message)
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadPhotos()
  }, [session.id])

  useEffect(() => {
    if (!isPublicGallery) return undefined

    const interval = window.setInterval(() => {
      loadPhotos({ silent: true })
    }, AUTO_REFRESH_INTERVAL)

    return () => {
      window.clearInterval(interval)
    }
  }, [isPublicGallery, session.id])

  useEffect(() => {
    if (!selectedPhoto) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [selectedPhoto])

  useEffect(() => {
    if (!selectedPhoto) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSelectedPhoto(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedPhoto])

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-4 text-white sm:px-6 sm:py-5">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-pink-300">
              {isPublicGallery ? 'Galeri Photobooth' : `Galeri Sesi #${session.id}`}
            </p>

            <h1 className="mt-1 break-words text-2xl font-bold leading-tight tracking-tight md:text-3xl">
              {session.sessionName}
            </h1>

            <p className="mt-2 break-words text-sm leading-6 text-slate-400">
              {session.eventTitle} • {session.eventSubtitle}
            </p>

            <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:gap-3">
              <span>Total foto: {photos.length}</span>

              {isPublicGallery && (
                <span>
                  Auto-refresh aktif setiap {AUTO_REFRESH_INTERVAL / 1000} detik
                </span>
              )}

              {lastUpdatedAt && (
                <span>
                  Update: {formatDateTime(lastUpdatedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:flex sm:shrink-0">
            <Button
              variant="secondary"
              onClick={() => loadPhotos()}
              className="w-full px-4 py-3 sm:w-auto"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>

            {!isPublicGallery && (
              <Button
                variant="secondary"
                onClick={onBack}
                className="w-full px-4 py-3 sm:w-auto"
              >
                Kembali
              </Button>
            )}
          </div>
        </header>

        {isPublicGallery && (
          <div className="mb-5 rounded-[1.5rem] border border-pink-400/20 bg-pink-500/10 p-4 sm:rounded-[1.8rem]">
            <p className="text-sm leading-6 text-pink-100">
              Semua hasil foto dari sesi ini akan muncul otomatis di sini. Klik salah satu foto untuk melihat detail hasil layout dan foto asli capture.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.8rem] sm:p-6">
            <p className="text-sm text-slate-300">Memuat galeri foto...</p>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-[1.5rem] border border-red-400/20 bg-red-500/10 p-5 sm:rounded-[1.8rem] sm:p-6">
            <p className="text-sm text-red-300">{errorMessage}</p>

            <Button
              variant="secondary"
              onClick={() => loadPhotos()}
              className="mt-4 w-full sm:w-auto"
            >
              Coba Lagi
            </Button>
          </div>
        )}

        {!isLoading && !errorMessage && photos.length === 0 && (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center sm:rounded-[1.8rem] sm:p-8">
            <h2 className="text-lg font-semibold">Belum ada foto</h2>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              Hasil foto dari sesi ini akan muncul di sini setelah booth digunakan.
            </p>
          </div>
        )}

        {!isLoading && !errorMessage && photos.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {photos.map((photo) => {
              const photoUrl = buildPhotoUrl(photo.imageUrl)

              return (
                <article
                  key={photo.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPhoto(photo)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedPhoto(photo)
                    }
                  }}
                  className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition hover:border-pink-300/40 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-pink-300/70 sm:rounded-[1.8rem]"
                >
                  <div className="bg-slate-900 p-2 sm:p-3">
                    <img
                      src={photoUrl}
                      alt={`Hasil photobooth ${photo.id}`}
                      loading="lazy"
                      className="h-[68vh] max-h-[520px] min-h-[320px] w-full rounded-[1.1rem] object-contain sm:h-[380px] sm:rounded-2xl lg:h-[420px]"
                    />
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="mb-4">
                      <p className="text-xs font-medium text-pink-300">
                        Photo #{photo.id}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {formatDateTime(photo.createdAt)}
                      </p>

                      <p className="mt-2 text-xs font-semibold text-slate-300">
                        Klik card untuk lihat detail
                      </p>
                    </div>

                    <div className="grid gap-2 rounded-2xl bg-slate-900 p-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Template</span>
                        <span className="text-right font-semibold">{photo.frameId}</span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Layout</span>
                        <span className="text-right font-semibold">{photo.layoutId}</span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <a
                        href={photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button className="w-full py-3.5">
                          Buka Foto
                        </Button>
                      </a>

                      <a
                        href={photoUrl}
                        download={photo.fileName}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button variant="secondary" className="w-full py-3.5">
                          Download
                        </Button>
                      </a>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>

      <PhotoDetailModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </main>
  )
}

export default PhotoGalleryPage
