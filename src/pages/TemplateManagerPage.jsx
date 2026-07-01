import { useEffect, useMemo, useRef, useState } from 'react'
import FramePreview from '../components/frame/FramePreview'
import Button from '../components/ui/Button'
import { layouts } from '../data/layouts'
import { printSizes } from '../data/printSizes'
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  getSessionTemplates,
  resolveTemplateAssetUrl,
  updateTemplate,
} from '../services/templateApi'

const defaultForm = {
  name: '',
  description: '',
  title: 'PHOTOBOOTH',
  subtitle: 'Web Photo Session',
  backgroundColor: '#0f172a',
  accentColor: '#f59e0b',
  textColor: '#ffffff',
  mutedTextColor: '#cbd5e1',
  overlayImageDataUrl: '',
  removeOverlayImage: false,
  photoSlots: [],
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function getPrintSizeId(session) {
  return String(session?.printSize || '4r').toLowerCase()
}

function getTotalPhotos(session) {
  return Number(session?.totalPhotos || 4)
}

function createSlot(id, photoIndex = 0) {
  return {
    id,
    x: 8,
    y: 12,
    width: 36,
    height: 20,
    photoIndex,
  }
}


const TEMPLATE_SIZE_PRESETS = {
  '2x6': {
    label: '2 x 6 Strip',
    vertical: { width: 600, height: 1800 },
    horizontal: { width: 1800, height: 600 },
  },
  '2x8': {
    label: '2 x 8 Strip',
    vertical: { width: 600, height: 2400 },
    horizontal: { width: 2400, height: 600 },
  },
  '4x6': {
    label: '4 x 6',
    vertical: { width: 1200, height: 1800 },
    horizontal: { width: 1800, height: 1200 },
  },
  '4x8': {
    label: '4 x 8',
    vertical: { width: 1200, height: 2400 },
    horizontal: { width: 2400, height: 1200 },
  },
  '5x7': {
    label: '5 x 7',
    vertical: { width: 1500, height: 2100 },
    horizontal: { width: 2100, height: 1500 },
  },
  '6x8': {
    label: '6 x 8',
    vertical: { width: 1800, height: 2400 },
    horizontal: { width: 2400, height: 1800 },
  },
  '6x9': {
    label: '6 x 9',
    vertical: { width: 1800, height: 2700 },
    horizontal: { width: 2700, height: 1800 },
  },
  '8x10': {
    label: '8 x 10',
    vertical: { width: 2400, height: 3000 },
    horizontal: { width: 3000, height: 2400 },
  },
  '8.5x11': {
    label: '8.5 x 11',
    vertical: { width: 2550, height: 3300 },
    horizontal: { width: 3300, height: 2550 },
  },
  custom: {
    label: 'Custom',
    vertical: { width: 1200, height: 1800 },
    horizontal: { width: 1800, height: 1200 },
  },
}

function getTemplateSizePreset(paperSize, orientation) {
  const preset = TEMPLATE_SIZE_PRESETS[paperSize] || TEMPLATE_SIZE_PRESETS['4x6']
  return preset[orientation === 'horizontal' ? 'horizontal' : 'vertical']
}


function createDefaultSlots(session) {
  const totalPhotos = getTotalPhotos(session)
  const is4R = getPrintSizeId(session) === '4r'
  const panelCount = is4R ? 2 : 1
  const panelWidth = 100 / panelCount
  const slots = []

  for (let panelIndex = 0; panelIndex < panelCount; panelIndex += 1) {
    const panelX = panelIndex * panelWidth
    const top = 18
    const bottom = 18
    const gap = 2
    const contentHeight = 100 - top - bottom
    const slotHeight = (contentHeight - gap * (totalPhotos - 1)) / totalPhotos
    const slotWidth = panelWidth * 0.78
    const slotX = panelX + (panelWidth - slotWidth) / 2

    for (let photoIndex = 0; photoIndex < totalPhotos; photoIndex += 1) {
      slots.push({
        id: `slot-${slots.length + 1}`,
        x: Number(slotX.toFixed(2)),
        y: Number((top + photoIndex * (slotHeight + gap)).toFixed(2)),
        width: Number(slotWidth.toFixed(2)),
        height: Number(slotHeight.toFixed(2)),
        photoIndex,
      })
    }
  }

  return slots
}

function templateToForm(template) {
  return {
    name: template.name || '',
    description: template.description || '',
    title: template.title || 'PHOTOBOOTH',
    subtitle: template.subtitle || 'Web Photo Session',
    backgroundColor: template.backgroundColor || '#0f172a',
    accentColor: template.accentColor || '#f59e0b',
    textColor: template.textColor || '#ffffff',
    mutedTextColor: template.mutedTextColor || '#cbd5e1',
    dimensionUnit: template.dimensionUnit || 'pixels',
    paperSize: template.paperSize || '4x6',
    resolutionDpi: Number(template.resolutionDpi || 300),
    orientation: template.orientation || 'vertical',
    canvasWidth: Number(template.canvasWidth || 1200),
    canvasHeight: Number(template.canvasHeight || 1800),
    overlayImageDataUrl: '',
    removeOverlayImage: false,
    photoSlots: Array.isArray(template.photoSlots) ? template.photoSlots : [],
    imageLayers: Array.isArray(template.imageLayers) ? template.imageLayers : [],
  }
}

function PhotoSlotEditor({
  session,
  overlayUrl,
  slots,
  onChange,
  imageLayers = [],
  onImageLayersChange,
  canvasWidth,
  canvasHeight,
}) {
  const editorRef = useRef(null)
  const imageInputRef = useRef(null)
  const [activeDrag, setActiveDrag] = useState(null)
  const [activeSlotIndex, setActiveSlotIndex] = useState(0)
  const [activeImageLayerIndex, setActiveImageLayerIndex] = useState(null)

  const totalPhotos = getTotalPhotos(session)
  const imageLayerItems = Array.isArray(imageLayers) ? imageLayers : []
  const editorCanvasWidth = Number(canvasWidth || 1200)
  const editorCanvasHeight = Number(canvasHeight || 1800)
  const aspectRatio =
    editorCanvasWidth > 0 && editorCanvasHeight > 0
      ? `${editorCanvasWidth} / ${editorCanvasHeight}`
      : '2 / 3'

  const activeImageLayer =
    activeImageLayerIndex !== null ? imageLayerItems[activeImageLayerIndex] : null
  const activeSlot = activeImageLayer ? null : slots[activeSlotIndex]

  function commitImageLayers(nextLayers) {
    if (typeof onImageLayersChange === 'function') {
      onImageLayersChange(nextLayers)
    }
  }

  function getLayerImageSrc(layer) {
    if (!layer?.imageUrl) return ''
    if (String(layer.imageUrl).startsWith('data:')) return layer.imageUrl
    if (String(layer.imageUrl).startsWith('blob:')) return layer.imageUrl
    return resolveTemplateAssetUrl(layer.imageUrl)
  }

  function normalizeLayer(layer, index = 0) {
    const x = clamp(Number(layer.x ?? 10), 0, 98)
    const y = clamp(Number(layer.y ?? 10), 0, 98)
    const width = clamp(Number(layer.width ?? 25), 2, 100 - x)
    const height = clamp(Number(layer.height ?? 15), 2, 100 - y)

    return {
      ...layer,
      id: layer.id || `image-layer-${Date.now()}-${index}`,
      type: 'image',
      name: layer.name || `Gambar ${index + 1}`,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      width: Number(width.toFixed(2)),
      height: Number(height.toFixed(2)),
      zIndex: Number.isFinite(Number(layer.zIndex)) ? Number(layer.zIndex) : index + 100,
    }
  }

  function updateSlot(index, patch) {
    const nextSlots = slots.map((slot, slotIndex) => {
      if (slotIndex !== index) return slot

      const nextSlot = {
        ...slot,
        ...patch,
      }

      nextSlot.x = clamp(Number(nextSlot.x), 0, 98)
      nextSlot.y = clamp(Number(nextSlot.y), 0, 98)
      nextSlot.width = clamp(Number(nextSlot.width), 2, 100 - nextSlot.x)
      nextSlot.height = clamp(Number(nextSlot.height), 2, 100 - nextSlot.y)
      nextSlot.photoIndex = clamp(Number(nextSlot.photoIndex), 0, totalPhotos - 1)

      return {
        ...nextSlot,
        x: Number(nextSlot.x.toFixed(2)),
        y: Number(nextSlot.y.toFixed(2)),
        width: Number(nextSlot.width.toFixed(2)),
        height: Number(nextSlot.height.toFixed(2)),
        photoIndex: Number(nextSlot.photoIndex),
      }
    })

    onChange(nextSlots)
  }

  function updateImageLayer(index, patch) {
    const nextLayers = imageLayerItems.map((layer, layerIndex) => {
      if (layerIndex !== index) return layer
      return normalizeLayer({ ...layer, ...patch }, layerIndex)
    })

    commitImageLayers(nextLayers)
  }

  function updateActiveSlot(patch) {
    if (!activeSlot) return
    updateSlot(activeSlotIndex, patch)
  }

  function updateActiveImageLayer(patch) {
    if (!activeImageLayer) return
    updateImageLayer(activeImageLayerIndex, patch)
  }

  function startDrag(event, index, mode, type = 'slot') {
    event.preventDefault()
    event.stopPropagation()

    const startItem = type === 'image' ? imageLayerItems[index] : slots[index]
    if (!startItem) return

    if (type === 'image') {
      setActiveImageLayerIndex(index)
    } else {
      setActiveImageLayerIndex(null)
      setActiveSlotIndex(index)
    }

    setActiveDrag({
      type,
      index,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startItem: { ...startItem },
    })
  }

  useEffect(() => {
    if (!activeDrag) return undefined

    function handleMove(event) {
      const rect = editorRef.current?.getBoundingClientRect()
      if (!rect) return

      const deltaX = ((event.clientX - activeDrag.startX) / rect.width) * 100
      const deltaY = ((event.clientY - activeDrag.startY) / rect.height) * 100
      const startItem = activeDrag.startItem

      const patch =
        activeDrag.mode === 'move'
          ? {
              x: startItem.x + deltaX,
              y: startItem.y + deltaY,
            }
          : {
              width: startItem.width + deltaX,
              height: startItem.height + deltaY,
            }

      if (activeDrag.type === 'image') {
        updateImageLayer(activeDrag.index, patch)
      } else {
        updateSlot(activeDrag.index, patch)
      }
    }

    function handleUp() {
      setActiveDrag(null)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [activeDrag, slots, imageLayerItems])

  function handleAddSlot() {
    const nextIndex = slots.length
    const nextSlot = createSlot(`slot-${Date.now()}`, nextIndex % totalPhotos)
    const nextSlots = [...slots, nextSlot]

    onChange(nextSlots)
    setActiveImageLayerIndex(null)
    setActiveSlotIndex(nextSlots.length - 1)
  }

  function handleAddImageLayer(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('File layer harus berupa gambar PNG, JPG, JPEG, atau WEBP.')
      return
    }

    const maxSize = 8 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Ukuran file layer maksimal 8MB.')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const nextLayer = normalizeLayer(
        {
          id: `image-layer-${Date.now()}`,
          type: 'image',
          name: file.name.replace(/\.[^.]+$/, '') || `Gambar ${imageLayerItems.length + 1}`,
          imageUrl: reader.result,
          imageDataUrl: reader.result,
          x: 10,
          y: 10,
          width: 28,
          height: 18,
          zIndex: imageLayerItems.length + 100,
        },
        imageLayerItems.length,
      )

      const nextLayers = [...imageLayerItems, nextLayer]
      commitImageLayers(nextLayers)
      setActiveImageLayerIndex(nextLayers.length - 1)
    }

    reader.readAsDataURL(file)
  }

  function handleDuplicateActive() {
    if (activeImageLayer) {
      const duplicatedLayer = normalizeLayer(
        {
          ...activeImageLayer,
          id: `image-layer-${Date.now()}`,
          name: `${activeImageLayer.name || 'Gambar'} Copy`,
          x: clamp(Number(activeImageLayer.x) + 2, 0, 98),
          y: clamp(Number(activeImageLayer.y) + 2, 0, 98),
        },
        activeImageLayerIndex + 1,
      )

      const nextLayers = [
        ...imageLayerItems.slice(0, activeImageLayerIndex + 1),
        duplicatedLayer,
        ...imageLayerItems.slice(activeImageLayerIndex + 1),
      ]

      commitImageLayers(nextLayers)
      setActiveImageLayerIndex(activeImageLayerIndex + 1)
      return
    }

    if (!activeSlot) return

    const duplicatedSlot = {
      ...activeSlot,
      id: `slot-${Date.now()}`,
      x: clamp(activeSlot.x + 2, 0, 98),
      y: clamp(activeSlot.y + 2, 0, 98),
    }

    const nextSlots = [
      ...slots.slice(0, activeSlotIndex + 1),
      duplicatedSlot,
      ...slots.slice(activeSlotIndex + 1),
    ]

    onChange(nextSlots)
    setActiveSlotIndex(activeSlotIndex + 1)
  }

  function handleDeleteActive() {
    if (activeImageLayer) {
      const nextLayers = imageLayerItems.filter((_, index) => index !== activeImageLayerIndex)
      commitImageLayers(nextLayers)
      setActiveImageLayerIndex(nextLayers.length ? Math.max(0, activeImageLayerIndex - 1) : null)
      return
    }

    if (!activeSlot) return

    const nextSlots = slots.filter((_, index) => index !== activeSlotIndex)
    onChange(nextSlots)
    setActiveSlotIndex(Math.max(0, activeSlotIndex - 1))
  }

  function handleMoveLayer(direction) {
    if (activeImageLayer) {
      const targetIndex = activeImageLayerIndex + direction
      if (targetIndex < 0 || targetIndex >= imageLayerItems.length) return

      const nextLayers = [...imageLayerItems]
      const temp = nextLayers[activeImageLayerIndex]
      nextLayers[activeImageLayerIndex] = nextLayers[targetIndex]
      nextLayers[targetIndex] = temp

      commitImageLayers(nextLayers.map((layer, index) => ({ ...layer, zIndex: index + 100 })))
      setActiveImageLayerIndex(targetIndex)
      return
    }

    if (!activeSlot) return

    const targetIndex = activeSlotIndex + direction
    if (targetIndex < 0 || targetIndex >= slots.length) return

    const nextSlots = [...slots]
    const temp = nextSlots[activeSlotIndex]
    nextSlots[activeSlotIndex] = nextSlots[targetIndex]
    nextSlots[targetIndex] = temp

    onChange(nextSlots)
    setActiveSlotIndex(targetIndex)
  }

  return (
    <div className="grid h-full min-h-0 gap-4">
      <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_220px] 2xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex min-h-0 items-center justify-center rounded-[1.3rem] bg-slate-950/70 p-3">
          <div
            ref={editorRef}
            className="relative max-h-[calc(125vh-250px)] w-auto max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/30"
            style={{
              aspectRatio,
              height: 'min(100%, 760px)',
            }}
          >
            {overlayUrl ? (
              <img
                src={overlayUrl}
                alt="Template editor"
                className="absolute inset-0 h-full w-full object-fill opacity-95"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-5 py-4 text-center">
                  <p className="text-sm font-bold text-white">
                    Canvas Kosong
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {editorCanvasWidth} × {editorCanvasHeight}px
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">
                    Upload file template untuk background, atau klik + Gambar untuk tambah layer.
                  </p>
                </div>
              </div>
            )}

            {imageLayerItems.map((layer, index) => {
              const isActive = activeImageLayerIndex === index
              const imageSrc = getLayerImageSrc(layer)

              return (
                <div
                  key={layer.id || index}
                  onPointerDown={(event) => startDrag(event, index, 'move', 'image')}
                  className={`absolute cursor-move select-none border-2 ${
                    isActive
                      ? 'border-sky-300 bg-sky-400/15'
                      : 'border-white/30 bg-white/5'
                  }`}
                  style={{
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    width: `${layer.width}%`,
                    height: `${layer.height}%`,
                    zIndex: 20 + index,
                  }}
                >
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt={layer.name || `Gambar ${index + 1}`}
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  )}

                  <div className="absolute left-1 top-1 rounded bg-slate-950/80 px-2 py-0.5 text-[10px] font-black text-white">
                    {layer.name || `Gambar ${index + 1}`}
                  </div>

                  <button
                    type="button"
                    onPointerDown={(event) => startDrag(event, index, 'resize', 'image')}
                    className="absolute bottom-0 right-0 h-5 w-5 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-full border border-white bg-sky-400"
                    aria-label="Resize image layer"
                  />
                </div>
              )
            })}

            {slots.map((slot, index) => {
              const isActive = !activeImageLayer && index === activeSlotIndex

              return (
                <div
                  key={slot.id || index}
                  onPointerDown={(event) => startDrag(event, index, 'move', 'slot')}
                  className={`absolute cursor-move select-none border-2 shadow-[0_0_0_9999px_rgba(2,6,23,0.03)] ${
                    isActive
                      ? 'border-pink-300 bg-pink-400/25'
                      : 'border-emerald-300 bg-emerald-400/20'
                  }`}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    width: `${slot.width}%`,
                    height: `${slot.height}%`,
                    zIndex: 100 + index,
                  }}
                >
                  <div className="absolute left-1 top-1 rounded bg-slate-950/80 px-2 py-0.5 text-[10px] font-black text-white">
                    Foto {(slot.photoIndex ?? index) + 1}
                  </div>

                  <button
                    type="button"
                    onPointerDown={(event) => startDrag(event, index, 'resize', 'slot')}
                    className={`absolute bottom-0 right-0 h-5 w-5 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-full border border-white ${
                      isActive ? 'bg-pink-400' : 'bg-emerald-400'
                    }`}
                    aria-label="Resize slot"
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="min-h-0 rounded-[1.25rem] border border-white/10 bg-slate-900 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">
              Layers
            </p>

            <div className="flex gap-1.5">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleAddImageLayer}
                className="hidden"
              />

              <Button
                type="button"
                variant="secondary"
                onClick={() => imageInputRef.current?.click()}
                className="px-2.5 py-1.5 text-[11px]"
              >
                + Gambar
              </Button>

              <Button
                type="button"
                onClick={handleAddSlot}
                className="px-2.5 py-1.5 text-[11px]"
              >
                + Slot
              </Button>
            </div>
          </div>

          <div className="mt-2 grid max-h-[250px] gap-1.5 overflow-auto pr-1">
            {slots.length === 0 && imageLayerItems.length === 0 ? (
              <p className="rounded-xl bg-slate-950 p-3 text-xs text-slate-400">
                Belum ada layer.
              </p>
            ) : (
              <>
                {imageLayerItems.map((layer, index) => (
                  <button
                    key={layer.id || index}
                    type="button"
                    onClick={() => setActiveImageLayerIndex(index)}
                    className={`rounded-xl border px-3 py-2 text-left transition ${
                      index === activeImageLayerIndex
                        ? 'border-sky-400 bg-sky-500/15'
                        : 'border-white/10 bg-slate-950 hover:border-white/25'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">
                      Gambar {index + 1}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {layer.name || 'Layer gambar'}
                    </p>
                  </button>
                ))}

                {slots.map((slot, index) => (
                  <button
                    key={slot.id || index}
                    type="button"
                    onClick={() => {
                      setActiveImageLayerIndex(null)
                      setActiveSlotIndex(index)
                    }}
                    className={`rounded-xl border px-3 py-2 text-left transition ${
                      activeImageLayerIndex === null && index === activeSlotIndex
                        ? 'border-pink-400 bg-pink-500/15'
                        : 'border-white/10 bg-slate-950 hover:border-white/25'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">
                      Slot {index + 1}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Foto {(slot.photoIndex ?? index) + 1}
                    </p>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[1.2rem] border border-white/10 bg-slate-900 p-2.5">
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" variant="secondary" onClick={handleDuplicateActive} disabled={!activeSlot && !activeImageLayer} className="px-2.5 py-1.5 text-[11px]">
            Duplikat
          </Button>
          <Button type="button" variant="secondary" onClick={() => handleMoveLayer(-1)} disabled={!activeSlot && !activeImageLayer} className="px-2.5 py-1.5 text-[11px]">
            Naik
          </Button>
          <Button type="button" variant="secondary" onClick={() => handleMoveLayer(1)} disabled={!activeSlot && !activeImageLayer} className="px-2.5 py-1.5 text-[11px]">
            Turun
          </Button>
          <Button type="button" variant="danger" onClick={handleDeleteActive} disabled={!activeSlot && !activeImageLayer} className="px-2.5 py-1.5 text-[11px]">
            Hapus
          </Button>
        </div>

        {activeImageLayer ? (
          <div className="mt-2 grid gap-2 md:grid-cols-[150px_1fr]">
            <label className="grid gap-1 text-xs font-semibold text-slate-300">
              Nama layer
              <input
                value={activeImageLayer.name || ''}
                onChange={(event) => updateActiveImageLayer({ name: event.target.value })}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400"
              />
            </label>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                ['x', 'X'],
                ['y', 'Y'],
                ['width', 'W'],
                ['height', 'H'],
              ].map(([field, label]) => (
                <label key={field} className="grid gap-1 text-[11px] font-bold text-slate-400">
                  {label}
                  <input
                    type="number"
                    value={activeImageLayer[field]}
                    onChange={(event) => updateActiveImageLayer({ [field]: Number(event.target.value) })}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-white outline-none focus:border-sky-400"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : activeSlot ? (
          <div className="mt-2 grid gap-2 md:grid-cols-[150px_1fr]">
            <label className="grid gap-1 text-xs font-semibold text-slate-300">
              Foto yang dipakai
              <select
                value={activeSlot.photoIndex}
                onChange={(event) => updateActiveSlot({ photoIndex: Number(event.target.value) })}
                className="rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-pink-400"
              >
                {Array.from({ length: totalPhotos }).map((_, index) => (
                  <option key={index} value={index}>
                    Foto {index + 1}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                ['x', 'X'],
                ['y', 'Y'],
                ['width', 'W'],
                ['height', 'H'],
              ].map(([field, label]) => (
                <label key={field} className="grid gap-1 text-[11px] font-bold text-slate-400">
                  {label}
                  <input
                    type="number"
                    value={activeSlot[field]}
                    onChange={(event) => updateActiveSlot({ [field]: Number(event.target.value) })}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-white outline-none focus:border-pink-400"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function TemplateManagerPage({ session, onBack }) {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [formData, setFormData] = useState(defaultForm)
  const imageLayersRef = useRef(Array.isArray(defaultForm.imageLayers) ? defaultForm.imageLayers : [])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const overlayPreviewUrl =
    formData.overlayImageDataUrl ||
    (formData.removeOverlayImage
      ? ''
      : resolveTemplateAssetUrl(selectedTemplate?.overlayImageUrl))

  const previewFrame = useMemo(() => {
    return {
      id: selectedTemplate?.id || 'preview',
      name: formData.name || 'Preview Template',
      description: formData.description || '',
      title: formData.title || 'PHOTOBOOTH',
      subtitle: formData.subtitle || 'Web Photo Session',
      backgroundColor: formData.backgroundColor || '#0f172a',
      accentColor: formData.accentColor || '#f59e0b',
      textColor: formData.textColor || '#ffffff',
      mutedTextColor: formData.mutedTextColor || '#cbd5e1',
      overlayImageUrl: overlayPreviewUrl,
      photoSlots: formData.photoSlots,
    }
  }, [formData, selectedTemplate, overlayPreviewUrl])

  async function loadTemplates() {
    if (!session?.id) return

    try {
      setIsLoading(true)
      setErrorMessage('')

      const data = await getSessionTemplates(session.id)
      setTemplates(data)
    } catch (error) {
      setErrorMessage(error.message || 'Gagal mengambil template sesi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [session?.id])


  function handleTemplateSizeChange(name, value) {
    setFormData((current) => {
      const next = {
        ...current,
        dimensionUnit: current.dimensionUnit || 'pixels',
        paperSize: current.paperSize || '4x6',
        resolutionDpi: current.resolutionDpi || 300,
        orientation: current.orientation || 'vertical',
        canvasWidth: current.canvasWidth || 1200,
        canvasHeight: current.canvasHeight || 1800,
        [name]: value,
      }

      if (name === 'resolutionDpi') {
        next.resolutionDpi = Number(value || 300)
      }

      if (name === 'canvasWidth') {
        next.canvasWidth = value === '' ? '' : Number(value)
      }

      if (name === 'canvasHeight') {
        next.canvasHeight = value === '' ? '' : Number(value)
      }

      if (name === 'paperSize' || name === 'orientation') {
        const paperSize = name === 'paperSize' ? value : next.paperSize
        const orientation = name === 'orientation' ? value : next.orientation

        if (paperSize !== 'custom') {
          const size = getTemplateSizePreset(paperSize, orientation)
          next.canvasWidth = size.width
          next.canvasHeight = size.height
        }
      }

      return next
    })
  }

  useEffect(() => {
    imageLayersRef.current = Array.isArray(formData.imageLayers) ? formData.imageLayers : []
  }, [formData.imageLayers])

  function updateForm(field, value) {
    if (field === 'imageLayers') {
      imageLayersRef.current = Array.isArray(value) ? value : []
    }

    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleOverlayFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('File template harus berupa gambar PNG, JPG, JPEG, atau WEBP.')
      return
    }

    const maxSize = 8 * 1024 * 1024

    if (file.size > maxSize) {
      setErrorMessage('Ukuran file template maksimal 8MB.')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        overlayImageDataUrl: reader.result,
        removeOverlayImage: false,
        photoSlots:
          current.photoSlots.length > 0
            ? current.photoSlots
            : createDefaultSlots(session),
      }))
      setErrorMessage('')
    }

    reader.readAsDataURL(file)
  }

  function handleRemoveOverlayImage() {
    setFormData((current) => ({
      ...current,
      overlayImageDataUrl: '',
      removeOverlayImage: true,
    }))
  }

  function handleResetSlots() {
    setFormData((current) => ({
      ...current,
      photoSlots: createDefaultSlots(session),
    }))
  }

  function handleCreateMode() {
    imageLayersRef.current = []
    setSelectedTemplate(null)
    setFormData({
      ...defaultForm,
      photoSlots: createDefaultSlots(session),
      imageLayers: [],
    })
    setMessage('')
    setErrorMessage('')
  }

  function handleEditTemplate(template) {
    const templateImageLayers = Array.isArray(template.imageLayers) ? template.imageLayers : []

    imageLayersRef.current = templateImageLayers
    setSelectedTemplate(template)
    setFormData({
      ...templateToForm(template),
      photoSlots:
        Array.isArray(template.photoSlots) && template.photoSlots.length > 0
          ? template.photoSlots
          : createDefaultSlots(session),
      imageLayers: templateImageLayers,
    })
    setMessage('')
    setErrorMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!session?.id) {
      setErrorMessage('Sesi tidak ditemukan.')
      return
    }

    try {
      setIsSaving(true)
      setMessage('')
      setErrorMessage('')

      const latestImageLayers = Array.isArray(imageLayersRef.current)
        ? imageLayersRef.current
        : []

      const payload = {
        ...formData,
        sessionId: session.id,
        photoSlots:
          Array.isArray(formData.photoSlots) && formData.photoSlots.length > 0
            ? formData.photoSlots
            : createDefaultSlots(session),
        imageLayers: latestImageLayers,
      }

      let savedTemplate = null

      if (selectedTemplate) {
        savedTemplate = await updateTemplate(selectedTemplate.id, payload)
        setMessage('Template sesi berhasil diperbarui.')
      } else {
        savedTemplate = await createTemplate(payload)
        setMessage('Template sesi berhasil dibuat.')
      }

      await loadTemplates()

      if (savedTemplate) {
        const savedImageLayers = Array.isArray(savedTemplate.imageLayers)
          ? savedTemplate.imageLayers
          : []

        imageLayersRef.current = savedImageLayers
        setSelectedTemplate(savedTemplate)
        setFormData({
          ...templateToForm(savedTemplate),
          photoSlots:
            Array.isArray(savedTemplate.photoSlots) && savedTemplate.photoSlots.length > 0
              ? savedTemplate.photoSlots
              : createDefaultSlots(session),
          imageLayers: savedImageLayers,
        })
      }
    } catch (error) {
      setErrorMessage(error.message || 'Gagal menyimpan template.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDuplicateTemplate(template) {
    if (!session?.id) {
      setErrorMessage('Sesi tidak ditemukan.')
      return
    }

    try {
      setMessage('')
      setErrorMessage('')

      const duplicatedTemplate = await duplicateTemplate(template.id, session.id)

      setMessage(`Template "${template.name}" berhasil diduplikat.`)
      await loadTemplates()

      setSelectedTemplate(duplicatedTemplate)
      setFormData({
        ...templateToForm(duplicatedTemplate),
        photoSlots:
          Array.isArray(duplicatedTemplate.photoSlots) && duplicatedTemplate.photoSlots.length > 0
            ? duplicatedTemplate.photoSlots
            : createDefaultSlots(session),
      })
    } catch (error) {
      setErrorMessage(error.message || 'Gagal menduplikat template.')
    }
  }


  async function handleDeleteTemplate(template) {
    const confirmed = window.confirm(
      `Hapus permanen template "${template.name}" dari sesi ini? File template juga akan dihapus.`,
    )

    if (!confirmed) return

    try {
      setMessage('')
      setErrorMessage('')

      await deleteTemplate(template.id, session.id)

      if (selectedTemplate?.id === template.id) {
        handleCreateMode()
      }

      setMessage('Template sesi berhasil dihapus permanen.')
      await loadTemplates()
    } catch (error) {
      setErrorMessage(error.message || 'Gagal menghapus template.')
    }
  }

  if (!session?.id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center">
          <h1 className="text-xl font-bold">Sesi tidak ditemukan</h1>
          <p className="mt-2 text-sm text-slate-400">
            Buka kelola template dari salah satu card sesi.
          </p>
          <Button onClick={onBack} className="mt-5 w-full">
            Kembali
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen overflow-hidden bg-slate-950 text-white">
      <div
        className="h-[125vh] w-[125vw] overflow-hidden px-3 py-3"
        style={{
          zoom: 0.8,
        }}
      >
        <div className="mx-auto flex h-full max-w-[1800px] flex-col gap-3">
        <header className="flex shrink-0 flex-col gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-pink-300">
              Template Sesi
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight md:text-[26px]">
              {session.sessionName}
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Edit template dan posisi kotak foto khusus untuk event ini.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Button variant="secondary" onClick={onBack} className="px-4 py-3">
              Kembali
            </Button>
            <Button onClick={handleCreateMode} className="px-4 py-3">
              Template Baru
            </Button>
          </div>
        </header>

        {(message || errorMessage) && (
          <div className="shrink-0">
            {message && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[280px_minmax(0,1fr)_320px] 2xl:grid-cols-[300px_minmax(0,1fr)_340px]">
          <aside className="min-h-0 overflow-auto rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3">
            <h2 className="text-lg font-bold">
              Template Sesi Ini
            </h2>

            <div className="mt-4 grid gap-3">
              {isLoading ? (
                <div className="rounded-2xl bg-slate-900 p-4 text-sm text-slate-400">
                  Mengambil data template...
                </div>
              ) : templates.length === 0 ? (
                <div className="rounded-2xl bg-slate-900 p-4 text-sm leading-6 text-slate-400">
                  Belum ada template khusus untuk sesi ini.
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className={`rounded-2xl border p-3 transition ${
                      selectedTemplate?.id === template.id
                        ? 'border-pink-400 bg-pink-500/10'
                        : 'border-white/10 bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-white">
                          {template.name}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-slate-400">
                          {template.description || '-'}
                        </p>

                        {template.overlayImageUrl && (
                          <p className="mt-2 text-xs font-semibold text-emerald-300">
                            File template terpasang
                          </p>
                        )}

                        {template.photoSlots?.length > 0 && (
                          <p className="mt-1 text-xs font-semibold text-sky-300">
                            {template.photoSlots.length} kotak foto
                          </p>
                        )}
                      </div>

                      <div
                        className="h-9 w-9 shrink-0 rounded-xl border"
                        style={{
                          backgroundColor: template.backgroundColor,
                          borderColor: template.accentColor,
                        }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleEditTemplate(template)}
                        className="py-2.5 text-xs"
                      >
                        Edit
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => handleDuplicateTemplate(template)}
                        className="py-2.5 text-xs"
                      >
                        Duplikat
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => handleDeleteTemplate(template)}
                        className="py-2.5 text-xs"
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <section className="min-h-0 overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">
                  Editor Kotak Foto
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Drag untuk geser. Tarik titik kanan bawah untuk resize. Pilih layer untuk ubah Foto 1/2/3.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={handleResetSlots}
                className="px-3 py-2 text-xs"
              >
                Reset Slot
              </Button>
            </div>

            <div className="h-[calc(100%-3.8rem)] min-h-0">
              <PhotoSlotEditor
                session={session}
                overlayUrl={overlayPreviewUrl}
                canvasWidth={Number(formData.canvasWidth || 1200)}
                canvasHeight={Number(formData.canvasHeight || 1800)}
                slots={formData.photoSlots}
                imageLayers={formData.imageLayers || []}
                onImageLayersChange={(imageLayers) => updateForm('imageLayers', imageLayers)}
                onChange={(slots) => updateForm('photoSlots', slots)}
              />
            </div>
          </section>

          <aside className="min-h-0 overflow-auto rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3">
            <h2 className="text-lg font-bold">
              {selectedTemplate ? 'Edit Template' : 'Tambah Template'}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Khusus untuk: {session.sessionName}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-300">
                  Nama Template
                </label>
                <input
                  value={formData.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-pink-400"
                  placeholder="Contoh: Gold Wedding"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300">
                  Deskripsi
                </label>
                <input
                  value={formData.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-pink-400"
                  placeholder="Template untuk acara wedding"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-300">
                    Judul
                  </label>
                  <input
                    value={formData.title}
                    onChange={(event) => updateForm('title', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-300">
                    Subtitle
                  </label>
                  <input
                    value={formData.subtitle}
                    onChange={(event) => updateForm('subtitle', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-pink-400"
                  />
                </div>
              </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                  <p className="mb-3 text-sm font-bold text-white">Ukuran Template</p>

                  <div className="grid gap-3">
                    <div>
                      <label className="text-sm font-semibold text-slate-300">View Dimension In</label>
                      <select
                        value={formData.dimensionUnit || 'pixels'}
                        onChange={(event) => handleTemplateSizeChange('dimensionUnit', event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-pink-400"
                      >
                        <option value="pixels">Pixels</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-300">Paper Size</label>
                      <select
                        value={formData.paperSize || '4x6'}
                        onChange={(event) => handleTemplateSizeChange('paperSize', event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-pink-400"
                      >
                        <option value="2x6">2 x 6 Strip</option>
                        <option value="2x8">2 x 8 Strip</option>
                        <option value="4x6">4 x 6</option>
                        <option value="4x8">4 x 8</option>
                        <option value="5x7">5 x 7</option>
                        <option value="6x8">6 x 8</option>
                        <option value="6x9">6 x 9</option>
                        <option value="8x10">8 x 10</option>
                        <option value="8.5x11">8.5 x 11</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-300">Resolution</label>
                      <select
                        value={formData.resolutionDpi || 300}
                        onChange={(event) => handleTemplateSizeChange('resolutionDpi', event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-pink-400"
                      >
                        <option value={300}>300 dpi</option>
                        <option value={200}>200 dpi</option>
                        <option value={150}>150 dpi</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-300">Orientation</label>
                      <select
                        value={formData.orientation || 'vertical'}
                        onChange={(event) => handleTemplateSizeChange('orientation', event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-pink-400"
                      >
                        <option value="vertical">Vertical</option>
                        <option value="horizontal">Horizontal</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-semibold text-slate-300">Width</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.canvasWidth ?? 1200}
                          onChange={(event) => handleTemplateSizeChange('canvasWidth', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-pink-400"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-300">Height</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.canvasHeight ?? 1800}
                          onChange={(event) => handleTemplateSizeChange('canvasHeight', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-pink-400"
                        />
                      </div>
                    </div>

                    <p className="text-xs leading-5 text-slate-500">Ukuran ini dipakai untuk rasio editor dan canvas hasil final.</p>
                  </div>
                </div>

              <div>
                <label className="text-sm font-semibold text-slate-300">
                  File Template
                </label>

                <div className="mt-2 rounded-2xl border border-dashed border-white/15 bg-slate-900 p-3">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleOverlayFileChange}
                    className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-pink-500 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    PNG transparan 1200×1800 px untuk 4R.
                  </p>

                  {overlayPreviewUrl && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleRemoveOverlayImage}
                      className="mt-3 w-full py-2.5 text-sm"
                    >
                      Hapus File Template
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {[
                  ['backgroundColor', 'Background'],
                  ['accentColor', 'Accent'],
                  ['textColor', 'Text'],
                  ['mutedTextColor', 'Muted'],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-slate-300">
                      {label}
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="color"
                        value={formData[field]}
                        onChange={(event) => updateForm(field, event.target.value)}
                        className="h-10 w-12 rounded-xl border border-white/10 bg-slate-900 p-1"
                      />
                      <input
                        value={formData[field]}
                        onChange={(event) => updateForm(field, event.target.value)}
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-pink-400"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="mb-3 text-sm font-semibold text-slate-300">
                  Preview
                </p>

                <FramePreview
                  frame={previewFrame}
                  layout={layouts[0]}
                  totalPhotos={session.totalPhotos || 4}
                  countdownSeconds={session.countdownSeconds || 3}
                  printSize={printSizes.find((item) => item.id === session.printSize) || printSizes[1]}
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="sticky bottom-0 w-full py-3.5"
              >
                {isSaving
                  ? 'Menyimpan...'
                  : selectedTemplate
                    ? 'Update Template'
                    : 'Tambah Template'}
              </Button>
            </form>
          </aside>
        </section>
        </div>
      </div>
    </main>
  )
}

export default TemplateManagerPage
