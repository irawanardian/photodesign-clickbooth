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

function PhotoGalleryPage({
  session,
  onBack,
}) {
  const [photos, setPhotos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

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
              Semua hasil foto dari sesi ini akan muncul otomatis di sini. Simpan link ini atau scan QR yang sama untuk membuka galeri lagi.
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
                  className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 sm:rounded-[1.8rem]"
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
                      <a href={photoUrl} target="_blank" rel="noreferrer">
                        <Button className="w-full py-3.5">
                          Buka Foto
                        </Button>
                      </a>

                      <a href={photoUrl} download={photo.fileName}>
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
    </main>
  )
}

export default PhotoGalleryPage
