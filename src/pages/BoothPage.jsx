import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CameraPreview from '../components/booth/CameraPreview'
import CountdownOverlay from '../components/booth/CountdownOverlay'
import FramingGuide from '../components/booth/FramingGuide'
import Button from '../components/ui/Button'
import { useCamera } from '../hooks/useCamera'
import { useCountdown } from '../hooks/useCountdown'
import { captureVideoFrame, createPhotoboothStrip } from '../utils/canvas'
import { downloadImage } from '../utils/download'
import { printImageWithQz } from '../utils/qzPrint'
import { savePhoto } from '../services/photoApi'

const DELAY_BETWEEN_PHOTOS = 800

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function BoothPage({
  sessionId,
  settings,
  onBackHome,
  onOpenSettings,
}) {
  const {
    selectedFrame,
    selectedLayout,
    selectedPrintSize,
    totalPhotos: sessionTotalPhotos,
    countdownSeconds,
    eventTitle,
    eventSubtitle,
  } = settings

  const {
    videoRef,
    isCameraReady,
    cameraError,
    startCamera,
    stopCamera,
  } = useCamera()

  const {
    count,
    isCountingDown,
    startCountdown,
  } = useCountdown()

  const [photos, setPhotos] = useState([])
  const [stripUrl, setStripUrl] = useState('')
  const [isSessionRunning, setIsSessionRunning] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isSavingToGallery, setIsSavingToGallery] = useState(false)
  const [savedPhoto, setSavedPhoto] = useState(null)
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [printMessage, setPrintMessage] = useState('')
  const [printErrorMessage, setPrintErrorMessage] = useState('')
  const framingGuideRef = useRef(null)

  const outputFrame = useMemo(() => {
    return {
      ...selectedFrame,
      title: eventTitle || selectedFrame.title,
      subtitle: eventSubtitle || selectedFrame.subtitle,
    }
  }, [eventTitle, eventSubtitle, selectedFrame])

  const effectiveTotalPhotos = useMemo(() => {
    const slotCount = Array.isArray(outputFrame.photoSlots) ? outputFrame.photoSlots.length : 0

    if (slotCount > 0) return slotCount

    const configuredTotal = Number(sessionTotalPhotos)

    return Number.isFinite(configuredTotal) && configuredTotal > 0
      ? configuredTotal
      : 3
  }, [outputFrame.photoSlots, sessionTotalPhotos])

  const isSessionComplete = photos.length === effectiveTotalPhotos && stripUrl
  const isFocusCameraMode = isSessionRunning

  const statusText = isCountingDown
    ? `Countdown ${count}`
    : isSessionRunning
      ? `Mengambil foto ${currentPhotoIndex}/${effectiveTotalPhotos}`
      : isSessionComplete && savedPhoto
        ? 'Output sudah tersimpan di galeri'
        : isSessionComplete
          ? 'Output selesai, belum disimpan'
          : isCameraReady
            ? 'Kamera siap'
            : 'Menyiapkan kamera'

  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  const handleRetake = useCallback(() => {
    setPhotos([])
    setStripUrl('')
    setCurrentPhotoIndex(0)
    setSavedPhoto(null)
    setSaveErrorMessage('')
    setPrintMessage('')
    setPrintErrorMessage('')
  }, [])

  const handleDownloadStrip = useCallback(() => {
    if (!stripUrl) return

    downloadImage(
      stripUrl,
      `photobooth-${selectedLayout.id}-${Date.now()}.png`,
    )
  }, [selectedLayout.id, stripUrl])

  const handlePrintStrip = useCallback(async () => {
    if (!stripUrl || isPrinting) return

    try {
      setIsPrinting(true)
      setPrintMessage('')
      setPrintErrorMessage('')

      const result = await printImageWithQz(stripUrl)

      setPrintMessage(`Print dikirim ke printer: ${result.printerName}`)
    } catch (error) {
      setPrintErrorMessage(error.message || 'Gagal mengirim hasil ke printer.')
    } finally {
      setIsPrinting(false)
    }
  }, [isPrinting, stripUrl])

  const handleSaveToGallery = useCallback(async () => {
    if (!stripUrl || !sessionId || isSavingToGallery || savedPhoto) return

    try {
      setIsSavingToGallery(true)
      setSaveErrorMessage('')

      const photo = await savePhoto({
        sessionId,
        frameId: selectedFrame.id,
        layoutId: selectedLayout.id,
        imageDataUrl: stripUrl,
          originalPhotos: photos.filter(Boolean),
      })

      setSavedPhoto(photo)
    } catch (error) {
      setSaveErrorMessage(error.message || 'Gagal menyimpan ke galeri.')
    } finally {
      setIsSavingToGallery(false)
    }
  }, [
    isSavingToGallery,
    savedPhoto,
      photos,
      selectedFrame.id,
    selectedLayout.id,
    sessionId,
    stripUrl,
  ])

  const handleStartSession = useCallback(async () => {
    const videoHasStream = Boolean(videoRef?.current?.srcObject)

    if ((!isCameraReady && !videoHasStream) || isSessionRunning) return

    const capturedPhotos = []

    setPhotos([])
    setStripUrl('')
    setSavedPhoto(null)
    setSaveErrorMessage('')
    setPrintMessage('')
    setPrintErrorMessage('')
    setIsSessionRunning(true)
    setCurrentPhotoIndex(0)

    for (let index = 1; index <= effectiveTotalPhotos; index += 1) {
      setCurrentPhotoIndex(index)

      await startCountdown(countdownSeconds)

      const photo = captureVideoFrame(videoRef.current, framingGuideRef.current)

      if (photo) {
        capturedPhotos.push(photo)
        setPhotos([...capturedPhotos])
      }

      if (index < effectiveTotalPhotos) {
        await wait(DELAY_BETWEEN_PHOTOS)
      }
    }

    const finalOutput = await createPhotoboothStrip(
      capturedPhotos,
      outputFrame,
      selectedLayout,
      selectedPrintSize,
    )

    setStripUrl(finalOutput || '')
    setIsSessionRunning(false)
    setCurrentPhotoIndex(0)
  }, [
    countdownSeconds,
    isCameraReady,
    isSessionRunning,
    outputFrame,
    selectedLayout,
    selectedPrintSize,
    startCountdown,
    effectiveTotalPhotos,
    videoRef,
  ])

  return (
    <main className="min-h-screen overflow-auto bg-slate-950 px-4 py-4 text-white sm:px-6 sm:py-5 xl:h-screen xl:overflow-hidden">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] flex-col gap-4 xl:h-full xl:min-h-0">
        <header className={isFocusCameraMode ? 'hidden' : 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'}>
          <div>
            <p className="text-xs font-medium text-pink-300">
              {selectedFrame.name}
            </p>

            <h1 className="text-2xl font-bold leading-tight tracking-tight">
              Photo Booth
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Button
              variant="secondary"
              onClick={onBackHome}
              className="px-5 py-3"
            >
              Template
            </Button>

            <Button
              variant="secondary"
              onClick={onOpenSettings}
              className="px-5 py-3"
            >
              Setting
            </Button>
          </div>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.65fr)_minmax(280px,0.75fr)] xl:min-h-0">
          <div
            className={
              isFocusCameraMode
                ? 'fixed inset-4 z-50 min-h-0'
                : 'relative min-h-0'
            }
          >
            <CameraPreview
              videoRef={videoRef}
              isCameraReady={isCameraReady}
              errorMessage={cameraError}
            />

            {isFocusCameraMode && <FramingGuide ref={framingGuideRef} />}

            <CountdownOverlay
              count={count}
              isCountingDown={isCountingDown}
            />

            {isFocusCameraMode && (
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-3 shadow-2xl shadow-black/40 backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-200">
                  Session
                </p>
                <p className="mt-1 text-sm font-semibold">
                  Mengambil foto {currentPhotoIndex}/{effectiveTotalPhotos}
                </p>
              </div>
            )}
          </div>

          <div className={isFocusCameraMode ? 'hidden' : 'min-h-0 overflow-auto rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:rounded-[1.8rem] sm:p-5'}>
            <div className="flex h-full flex-col justify-center">
              <p className="text-xs font-bold text-pink-300">
                Session
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Siap Foto?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                {effectiveTotalPhotos} foto • countdown {countdownSeconds}s • {selectedLayout.name}
              </p>

              <div className="mt-6 grid gap-3">
                {!stripUrl && (
                  <Button
                    onClick={handleStartSession}
                    disabled={!isCameraReady || isSessionRunning}
                    className="w-full py-4 text-base"
                  >
                    Mulai Sesi Foto
                  </Button>
                )}

                {stripUrl && !savedPhoto && (
                  <Button
                    onClick={handleSaveToGallery}
                    disabled={isSavingToGallery}
                    className="w-full py-4 text-base"
                  >
                    {isSavingToGallery ? 'Menyimpan...' : 'Simpan ke Galeri'}
                  </Button>
                )}

                {stripUrl && savedPhoto && (
                  <Button
                    disabled
                    className="w-full py-4 text-base"
                  >
                    Sudah Disimpan
                  </Button>
                )}

                {stripUrl && (
                  <Button
                    variant="secondary"
                    onClick={handleDownloadStrip}
                    className="w-full py-4 text-base"
                  >
                    Download Hasil
                  </Button>
                )}

                {stripUrl && (
                  <Button
                    onClick={handlePrintStrip}
                    disabled={isPrinting}
                    className="w-full py-4 text-base"
                  >
                    {isPrinting ? 'Mengirim ke Printer...' : 'Print'}
                  </Button>
                )}

                {(photos.length > 0 || stripUrl) && (
                  <Button
                    variant="secondary"
                    onClick={handleRetake}
                    disabled={isSessionRunning || isSavingToGallery}
                    className="w-full py-4 text-base"
                  >
                    Ulangi Sesi
                  </Button>
                )}
              </div>

              {saveErrorMessage && (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                  <p className="text-sm leading-6 text-red-200">
                    {saveErrorMessage}
                  </p>
                </div>
              )}

              {printErrorMessage && (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                  <p className="text-sm leading-6 text-red-200">
                    {printErrorMessage}
                  </p>
                </div>
              )}

              {printMessage && (
                <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
                  <p className="text-sm leading-6 text-sky-100">
                    {printMessage}
                  </p>
                </div>
              )}

              {stripUrl && !savedPhoto && (
                <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4">
                  <p className="text-sm leading-6 text-yellow-100">
                    Hasil belum masuk galeri. Klik Simpan ke Galeri kalau hasil sudah oke.
                  </p>
                </div>
              )}

              {savedPhoto && (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <p className="text-sm leading-6 text-emerald-100">
                    Hasil sudah tersimpan di galeri sesi.
                  </p>
                </div>
              )}

              <div className="mt-5 rounded-2xl bg-slate-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Status
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {statusText}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Template
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedFrame.name}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Ukuran cetak: {selectedPrintSize?.name || '4R'}
                </p>
              </div>
            </div>
          </div>

          <div className={isFocusCameraMode ? 'hidden' : 'min-h-0 overflow-auto rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:rounded-[1.8rem] sm:p-5'}>
            {stripUrl ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">
                      Final Output
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Review dulu sebelum simpan ke galeri.
                    </p>
                  </div>

                  {savedPhoto ? (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200">
                      Saved
                    </span>
                  ) : (
                    <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-100">
                      Draft
                    </span>
                  )}
                </div>

                <div className="mt-4 rounded-2xl bg-white p-3">
                  <img
                    src={stripUrl}
                    alt="Final photobooth output"
                    className="mx-auto max-h-[min(56vh,560px)] w-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold">
                  Hasil Foto
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {photos.length}/{effectiveTotalPhotos} foto
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-3">
                  {Array.from({ length: effectiveTotalPhotos }).map((_, index) => {
                    const photo = photos[index]

                    return (
                      <div
                        key={index}
                        className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-slate-900 text-xs text-slate-500"
                      >
                        {photo ? (
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          `Foto ${index + 1}`
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default BoothPage
