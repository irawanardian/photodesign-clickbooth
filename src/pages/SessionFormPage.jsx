import { useState } from 'react'
import EventSettings from '../components/booth/EventSettings'
import SessionSettings from '../components/booth/SessionSettings'
import FrameSelector from '../components/frame/FrameSelector'
import LayoutSelector from '../components/frame/LayoutSelector'
import PrintSizeSelector from '../components/frame/PrintSizeSelector'
import Button from '../components/ui/Button'
import { createSession, updateSession } from '../services/sessionApi'

function buildInitialFormData(initialSession, frames, layouts) {
  if (initialSession) {
    return {
      sessionName: initialSession.sessionName || '',
      eventTitle: initialSession.eventTitle || 'PHOTOBOOTH',
      eventSubtitle: initialSession.eventSubtitle || 'Web Photo Session',
      frameId: initialSession.frameId || frames[0]?.id || 'pink-classic',
      layoutId: initialSession.layoutId || layouts[0]?.id || 'vertical-strip',
      printSize: initialSession.printSize || '4r',
      totalPhotos: initialSession.totalPhotos || 4,
      countdownSeconds: initialSession.countdownSeconds || 3,
    }
  }

  return {
    sessionName: '',
    eventTitle: 'PHOTOBOOTH',
    eventSubtitle: 'Web Photo Session',
    frameId: frames[0]?.id || 'pink-classic',
    layoutId: layouts[0]?.id || 'vertical-strip',
    printSize: '4r',
    totalPhotos: 4,
    countdownSeconds: 3,
  }
}

function SessionFormPage({
  frames,
  layouts,
  printSizes,
  initialSession = null,
  onCancel,
  onSaved,
}) {
  const isEditMode = Boolean(initialSession)

  const [formData, setFormData] = useState(() =>
    buildInitialFormData(initialSession, frames, layouts),
  )

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const selectedFrame =
    frames.find((frame) => frame.id === formData.frameId) || frames[0]

  const selectedLayout =
    layouts.find((layout) => layout.id === formData.layoutId) || layouts[0]

  const selectedPrintSize =
    printSizes.find((printSize) => printSize.id === formData.printSize) || printSizes[1]

  function updateFormData(newData) {
    setFormData((currentData) => ({
      ...currentData,
      ...newData,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setIsSaving(true)
      setErrorMessage('')

      const savedSession = isEditMode
        ? await updateSession(initialSession.id, formData)
        : await createSession(formData)

      onSaved(savedSession)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-5 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-pink-300">
              Web Photobooth App
            </p>
            <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">
              {isEditMode ? 'Edit Sesi' : 'Buat Sesi Baru'}
            </h1>
          </div>

          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSaving}
            className="px-5 py-3"
          >
            Kembali
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="grid gap-6">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Informasi Sesi</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Nama sesi dipakai untuk daftar event di halaman awal.
              </p>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Nama Sesi
                </label>
                <input
                  type="text"
                  value={formData.sessionName}
                  onChange={(event) =>
                    updateFormData({ sessionName: event.target.value })
                  }
                  placeholder="Contoh: Wedding Dede & Rani"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-pink-400"
                />
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Info Event</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Teks ini akan tampil di hasil akhir photobooth.
              </p>

              <div className="mt-6">
                <EventSettings
                  eventTitle={formData.eventTitle}
                  eventSubtitle={formData.eventSubtitle}
                  onChangeEventTitle={(value) =>
                    updateFormData({ eventTitle: value })
                  }
                  onChangeEventSubtitle={(value) =>
                    updateFormData({ eventSubtitle: value })
                  }
                />
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Pengaturan Foto</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Atur jumlah foto dan countdown untuk sesi ini.
              </p>

              <div className="mt-6">
                <SessionSettings
                  totalPhotos={formData.totalPhotos}
                  countdownSeconds={formData.countdownSeconds}
                  onChangeTotalPhotos={(value) =>
                    updateFormData({ totalPhotos: value })
                  }
                  onChangeCountdownSeconds={(value) =>
                    updateFormData({ countdownSeconds: value })
                  }
                />
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Template</h2>

              <div className="mt-6">
                <FrameSelector
                  frames={frames}
                  selectedFrameId={formData.frameId}
                  onSelectFrame={(frame) =>
                    updateFormData({ frameId: frame.id })
                  }
                />
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Layout Output</h2>

              <div className="mt-6">
                <LayoutSelector
                  layouts={layouts}
                  selectedLayoutId={formData.layoutId}
                  onSelectLayout={(layout) =>
                    updateFormData({ layoutId: layout.id })
                  }
                />
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold">Ukuran Cetak</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Pilih ukuran hasil akhir untuk kebutuhan cetak.
              </p>

              <div className="mt-6">
                <PrintSizeSelector
                  printSizes={printSizes}
                  selectedPrintSizeId={formData.printSize}
                  onSelectPrintSize={(printSize) =>
                    updateFormData({ printSize: printSize.id })
                  }
                />
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 lg:sticky lg:top-5">
            <h2 className="text-lg font-semibold">Ringkasan</h2>

            {errorMessage && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-300">{errorMessage}</p>
              </div>
            )}

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-slate-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Nama Sesi
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {formData.sessionName || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Event
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {formData.eventTitle || '-'}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {formData.eventSubtitle || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Template
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedFrame?.name || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Output
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedLayout?.name || '-'}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {formData.totalPhotos} foto • {formData.countdownSeconds}s
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Ukuran Cetak
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {selectedPrintSize?.name || '-'}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 text-base"
              >
                {isSaving
                  ? 'Menyimpan...'
                  : isEditMode
                    ? 'Update Sesi'
                    : 'Simpan Sesi'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isSaving}
                className="w-full py-4 text-base"
              >
                Batal
              </Button>
            </div>
          </aside>
        </form>
      </div>
    </main>
  )
}

export default SessionFormPage
