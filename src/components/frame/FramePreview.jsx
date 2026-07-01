import { resolveTemplateAssetUrl } from '../../services/templateApi'

function getPrintSizeId(printSize) {
  if (!printSize) return '4r'
  if (typeof printSize === 'string') return printSize.toLowerCase()

  return String(printSize.id || '4r').toLowerCase()
}

function MiniStrip({
  frame,
  layout,
  totalPhotos,
  countdownSeconds,
}) {
  const isGrid = layout?.id === 'grid-2x2'

  return (
    <div
      className="flex h-full flex-col px-1.5 py-1.5"
      style={{
        backgroundColor: frame.backgroundColor,
        color: frame.textColor,
      }}
    >
      <div className="shrink-0">
        <div
          className="mx-auto mb-1 h-[3px] w-[76%]"
          style={{ backgroundColor: frame.accentColor }}
        />

        <div className="text-center">
          <p className="text-[7px] font-black leading-none">
            {frame.title || 'PHOTOBOOTH'}
          </p>
          <p
            className="mt-0.5 text-[4.5px] font-semibold leading-none"
            style={{ color: frame.mutedTextColor }}
          >
            {frame.subtitle || 'Web Photo Session'}
          </p>
        </div>
      </div>

      {isGrid ? (
        <div className="mt-1.5 grid flex-1 grid-cols-2 gap-1">
          {Array.from({ length: totalPhotos }).map((_, index) => (
            <div
              key={index}
              className="flex min-h-0 items-center justify-center bg-white text-[5px]"
              style={{ color: frame.mutedTextColor }}
            >
              Foto {index + 1}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="mt-1.5 grid flex-1 gap-1"
          style={{
            gridTemplateRows: `repeat(${totalPhotos}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: totalPhotos }).map((_, index) => (
            <div
              key={index}
              className="flex min-h-0 items-center justify-center bg-white text-[5px]"
              style={{ color: frame.mutedTextColor }}
            >
              Foto {index + 1}
            </div>
          ))}
        </div>
      )}

      <div className="mt-1 shrink-0 text-center">
        <p className="text-[5px] font-bold leading-none">
          {layout?.name || 'Strip'} • {totalPhotos} Foto • {countdownSeconds}s
        </p>
      </div>
    </div>
  )
}

function FramePreview({
  frame,
  layout,
  totalPhotos = 4,
  countdownSeconds = 3,
  printSize = '4r',
}) {
  const printSizeId = getPrintSizeId(printSize)
  const is4R = printSizeId === '4r'
  const overlayUrl = resolveTemplateAssetUrl(frame.overlayImageUrl)
  const customSlots = Array.isArray(frame.photoSlots) ? frame.photoSlots : []
  const imageLayers = Array.isArray(frame.imageLayers) ? frame.imageLayers : []
  const hasCustomTemplate = overlayUrl || customSlots.length > 0 || imageLayers.length > 0

  const frameCanvasWidth = Number(frame.canvasWidth || (is4R ? 1200 : 600))
  const frameCanvasHeight = Number(frame.canvasHeight || 1800)
  const frameAspectRatio =
    frameCanvasWidth > 0 && frameCanvasHeight > 0
      ? `${frameCanvasWidth} / ${frameCanvasHeight}`
      : is4R
        ? '2 / 3'
        : '1 / 3'
  const isLandscape = frameCanvasWidth > frameCanvasHeight

  return (
    <div className="flex justify-center">
      <div className="text-center">
        <div
          className={
            isLandscape
              ? 'w-[min(42vw,370px)] min-w-[260px]'
              : is4R
                ? 'w-[min(30vw,230px)] min-w-[185px]'
                : 'w-[min(15vw,115px)] min-w-[92px]'
          }
        >
          <div
            className="relative w-full overflow-hidden border"
            style={{
              borderColor: frame.accentColor,
              aspectRatio: frameAspectRatio,
            }}
          >
            {hasCustomTemplate ? (
              <>
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: frame.backgroundColor || '#ffffff' }}
                />

                {customSlots.length > 0 ? (
                  customSlots.map((slot, index) => (
                    <div
                      key={slot.id || index}
                      className="absolute flex items-center justify-center bg-white text-[5px]"
                      style={{
                        left: `${slot.x}%`,
                        top: `${slot.y}%`,
                        width: `${slot.width}%`,
                        height: `${slot.height}%`,
                        color: frame.mutedTextColor,
                        zIndex: 10,
                      }}
                    >
                      Foto {(slot.photoIndex ?? index) + 1}
                    </div>
                  ))
                ) : imageLayers.length === 0 ? (
                  <div
                    className="absolute inset-8 flex items-center justify-center bg-white/90 text-[8px] text-slate-400"
                    style={{ zIndex: 10 }}
                  >
                    Atur kotak foto
                  </div>
                ) : null}

                {overlayUrl ? (
                  <img
                    src={overlayUrl}
                    alt=""
                    className="pointer-events-none absolute inset-0 h-full w-full object-fill"
                    style={{ zIndex: 30 }}
                  />
                ) : null}

                {imageLayers.map((layer, index) => {
                  const imageSrc = resolveTemplateAssetUrl(layer.imageUrl || layer.imageDataUrl)

                  if (!imageSrc) return null

                  return (
                    <img
                      key={layer.id || layer.imageUrl || index}
                      src={imageSrc}
                      alt={layer.name || ''}
                      className="pointer-events-none absolute object-fill"
                      style={{
                        left: `${Number(layer.x || 0)}%`,
                        top: `${Number(layer.y || 0)}%`,
                        width: `${Number(layer.width || 100)}%`,
                        height: `${Number(layer.height || 100)}%`,
                        zIndex: Number(layer.zIndex || 100) + 40,
                      }}
                    />
                  )
                })}
              </>
            ) : is4R ? (
              <div className="flex h-full">
                <div className="min-w-0 flex-1">
                  <MiniStrip
                    frame={frame}
                    layout={layout}
                    totalPhotos={totalPhotos}
                    countdownSeconds={countdownSeconds}
                  />
                </div>

                <div
                  className="w-px shrink-0"
                  style={{ backgroundColor: frame.accentColor }}
                />

                <div className="min-w-0 flex-1">
                  <MiniStrip
                    frame={frame}
                    layout={layout}
                    totalPhotos={totalPhotos}
                    countdownSeconds={countdownSeconds}
                  />
                </div>
              </div>
            ) : (
              <MiniStrip
                frame={frame}
                layout={layout}
                totalPhotos={totalPhotos}
                countdownSeconds={countdownSeconds}
              />
            )}
          </div>
        </div>

        <div className="mt-1.5 bg-slate-900 px-3 py-1 text-[10px] font-bold text-white">
          {isLandscape
            ? `${frameCanvasWidth}×${frameCanvasHeight} • Horizontal`
            : is4R
              ? '4R • 2 Strip berdampingan'
              : '2R • 1 Strip'}
        </div>
      </div>
    </div>
  )
}

export default FramePreview
