import Button from '../ui/Button'

function CaptureControls({
  isCameraReady,
  isCountingDown,
  isSessionRunning,
  hasPhotos,
  isSessionComplete,
  currentPhotoIndex,
  totalPhotos,
  onStartSession,
  onRetake,
  onDownloadStrip,
}) {
  return (
    <div className="grid gap-3">
      {!hasPhotos && !isSessionRunning && (
        <Button
          onClick={onStartSession}
          disabled={!isCameraReady}
          className="w-full py-4 text-base"
        >
          Mulai Sesi Foto
        </Button>
      )}

      {isSessionRunning && (
        <Button disabled className="w-full py-4 text-base">
          {isCountingDown
            ? 'Bersiap...'
            : `Mengambil Foto ${currentPhotoIndex}/${totalPhotos}`}
        </Button>
      )}

      {hasPhotos && !isSessionComplete && (
        <Button disabled className="w-full py-4 text-base">
          Sesi Berjalan
        </Button>
      )}

      {isSessionComplete && (
        <>
          <Button
            onClick={onDownloadStrip}
            className="w-full py-4 text-base"
          >
            Download Hasil
          </Button>

          <Button
            variant="secondary"
            onClick={onRetake}
            className="w-full py-4 text-base"
          >
            Ulangi Sesi
          </Button>
        </>
      )}
    </div>
  )
}

export default CaptureControls
