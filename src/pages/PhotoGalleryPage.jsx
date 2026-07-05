import { useEffect, useMemo, useState } from 'react'
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

function getPhotoUrl(item) {
  return buildPhotoUrl(item?.imageUrl || item?.url || item)
}

function getExtensionFromUrl(url, fallback = 'jpg') {
  const cleanUrl = String(url || '').split('?')[0]
  const match = cleanUrl.match(/\.([a-z0-9]+)$/i)

  return match ? match[1].toLowerCase() : fallback
}

function sanitizeFileName(value) {
  return String(value || 'photobooth')
    .trim()
    .replace(/[^a-z0-9-_.]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

async function downloadImageFromUrl(imageUrl, fileName) {
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error(`Gagal download ${fileName}.`)
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = blobUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
  }, 1000)
}

function buildLightboxItems(photo) {
  if (!photo) return []

  const finalPhotoUrl = buildPhotoUrl(photo.imageUrl)
  const originalPhotos = getOriginalPhotos(photo)

  return [
    {
      type: 'final',
      label: 'Final Layout',
      url: finalPhotoUrl,
      fileName: photo.fileName || `photo-${photo.id}-final.png`,
    },
    ...originalPhotos.map((originalPhoto, index) => {
      const url = getPhotoUrl(originalPhoto)
      const extension = getExtensionFromUrl(originalPhoto?.fileName || url)

      return {
        type: 'original',
        label: `Foto ${index + 1}`,
        url,
        fileName: originalPhoto?.fileName || `photo-${photo.id}-original-${index + 1}.${extension}`,
      }
    }),
  ]
}

function StackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7 drop-shadow"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="7" y="7" width="13" height="13" rx="2" />
      <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.7 6.8-4.4" />
      <path d="m8.6 13.3 6.8 4.4" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-8 w-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-12 w-12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-12 w-12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function GalleryLightbox({
  session,
  photo,
  initialIndex,
  onClose,
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex || 0)
  const [downloadErrorMessage, setDownloadErrorMessage] = useState('')
  const items = useMemo(() => buildLightboxItems(photo), [photo])
  const activeItem = items[activeIndex] || items[0]

  useEffect(() => {
    setActiveIndex(initialIndex || 0)
    setDownloadErrorMessage('')
  }, [photo?.id, initialIndex])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }

      if (event.key === 'ArrowLeft') {
        setActiveIndex((currentIndex) => (
          currentIndex <= 0 ? items.length - 1 : currentIndex - 1
        ))
      }

      if (event.key === 'ArrowRight') {
        setActiveIndex((currentIndex) => (
          currentIndex >= items.length - 1 ? 0 : currentIndex + 1
        ))
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [items.length, onClose])

  if (!photo || !activeItem) return null

  function goPrevious() {
    setActiveIndex((currentIndex) => (
      currentIndex <= 0 ? items.length - 1 : currentIndex - 1
    ))
  }

  function goNext() {
    setActiveIndex((currentIndex) => (
      currentIndex >= items.length - 1 ? 0 : currentIndex + 1
    ))
  }

  async function handleDownloadActive() {
    try {
      setDownloadErrorMessage('')

      const extension = getExtensionFromUrl(activeItem.fileName || activeItem.url)
      const baseName = sanitizeFileName(`${session.sessionName || 'photobooth'}-${photo.id}-${activeItem.label}`)

      await downloadImageFromUrl(
        activeItem.url,
        `${baseName}.${extension}`,
      )
    } catch (error) {
      setDownloadErrorMessage(error.message || 'Gagal download foto.')
    }
  }

  async function handleShare() {
    const shareData = {
      title: session.sessionName || 'Photobooth Gallery',
      text: `${activeItem.label} - Photo #${photo.id}`,
      url: activeItem.url,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(activeItem.url)
        setDownloadErrorMessage('Link foto disalin.')
      }
    } catch {
      // user batal share, tidak perlu tampil error
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-50 text-neutral-950">
      <header className="fixed left-0 right-0 top-0 z-20 flex h-20 items-center justify-between bg-neutral-50/90 px-4 backdrop-blur sm:px-8">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-light tracking-tight sm:text-3xl">
            {session.sessionName || session.eventTitle || 'Photobooth Gallery'}
          </h2>

          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
            {activeItem.label} • {activeIndex + 1}/{items.length}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={handleDownloadActive}
            className="rounded-full p-2 text-neutral-900 transition hover:bg-neutral-200"
            aria-label="Download foto"
            title="Download"
          >
            <DownloadIcon />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="rounded-full p-2 text-neutral-900 transition hover:bg-neutral-200"
            aria-label="Share foto"
            title="Share"
          >
            <ShareIcon />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-900 transition hover:bg-neutral-200"
            aria-label="Tutup"
            title="Tutup"
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      <main className="flex h-full flex-col pt-20">
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-24">
          {items.length > 1 && (
            <button
              type="button"
              onClick={goPrevious}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-neutral-900 transition hover:bg-neutral-200 sm:left-6"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeftIcon />
            </button>
          )}

          <div className="flex h-full w-full items-center justify-center">
            <img
              src={activeItem.url}
              alt={activeItem.label}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {items.length > 1 && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-neutral-900 transition hover:bg-neutral-200 sm:right-6"
              aria-label="Foto selanjutnya"
            >
              <ChevronRightIcon />
            </button>
          )}

          {downloadErrorMessage && (
            <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-xl">
              {downloadErrorMessage}
            </div>
          )}
        </div>

        {items.length > 1 && (
          <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3">
            <div className="mx-auto flex max-w-6xl gap-3 overflow-x-auto pb-1">
              {items.map((item, index) => (
                <button
                  key={`${item.url}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-neutral-200 transition sm:h-28 sm:w-36 ${
                    index === activeIndex
                      ? 'border-neutral-950'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.label}
                    className="h-full w-full object-cover"
                  />

                  {item.type === 'final' && (
                    <span className="absolute bottom-1 left-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                      Layout
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
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
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0)

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

  function openPhoto(photo, initialIndex = 0) {
    setLightboxPhoto(photo)
    setLightboxInitialIndex(initialIndex)
  }

  function closeLightbox() {
    setLightboxPhoto(null)
    setLightboxInitialIndex(0)
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
    if (!lightboxPhoto) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [lightboxPhoto])

  return (
    <main className="min-h-screen bg-neutral-50 px-5 py-8 text-neutral-950 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-light tracking-tight text-neutral-900 sm:text-5xl">
            {session.sessionName || session.eventTitle || 'Photobooth Gallery'}
          </h1>

          {(session.eventTitle || session.eventSubtitle) && (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-500 sm:text-base">
              {[session.eventTitle, session.eventSubtitle].filter(Boolean).join(' • ')}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-neutral-400">
            <span>{photos.length} hasil foto</span>

            {isPublicGallery && (
              <span>Auto-refresh {AUTO_REFRESH_INTERVAL / 1000}s</span>
            )}

            {lastUpdatedAt && (
              <span>Update {formatDateTime(lastUpdatedAt)}</span>
            )}
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => loadPhotos()}
              disabled={isRefreshing}
              className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            {!isPublicGallery && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-100"
              >
                Kembali
              </button>
            )}
          </div>
        </header>

        {isLoading && (
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-neutral-500">Memuat galeri foto...</p>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
            <p className="text-sm text-red-600">{errorMessage}</p>

            <button
              type="button"
              onClick={() => loadPhotos()}
              className="mt-5 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && photos.length === 0 && (
          <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold">Belum ada foto</h2>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Hasil foto dari sesi ini akan muncul di sini setelah booth digunakan.
            </p>
          </div>
        )}

        {!isLoading && !errorMessage && photos.length > 0 && (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {photos.map((photo) => {
              const photoUrl = buildPhotoUrl(photo.imageUrl)
              const originalCount = getOriginalPhotos(photo).length
              const totalItems = 1 + originalCount

              return (
                <article
                  key={photo.id}
                  className="group relative overflow-hidden rounded-2xl bg-neutral-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() => openPhoto(photo, 0)}
                    className="block w-full"
                  >
                    <img
                      src={photoUrl}
                      alt={`Hasil photobooth ${photo.id}`}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 text-left opacity-0 transition group-hover:opacity-100">
                      <p className="text-sm font-semibold text-white">
                        Photo #{photo.id}
                      </p>

                      <p className="mt-1 text-xs text-white/80">
                        {formatDateTime(photo.createdAt)}
                      </p>
                    </div>

                    {totalItems > 1 && (
                      <div className="absolute right-3 top-3 rounded-xl bg-black/55 p-2 text-white backdrop-blur">
                        <StackIcon />
                      </div>
                    )}
                  </button>
                </article>
              )
            })}
          </section>
        )}
      </div>

      {lightboxPhoto && (
        <GalleryLightbox
          session={session}
          photo={lightboxPhoto}
          initialIndex={lightboxInitialIndex}
          onClose={closeLightbox}
        />
      )}
    </main>
  )
}

export default PhotoGalleryPage
