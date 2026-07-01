import FramePreview from '../components/frame/FramePreview'
import FrameSelector from '../components/frame/FrameSelector'
import Button from '../components/ui/Button'

function HomePage({
  settings,
  frames,
  onSelectFrame,
  onStartBooth,
  onOpenSettings,
}) {
  const {
    selectedFrame,
    selectedLayout,
    selectedPrintSize,
    totalPhotos,
    countdownSeconds,
  } = settings

  return (
    <main className="min-h-screen overflow-auto bg-slate-950 px-4 py-2.5 text-white sm:px-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.25rem)] max-w-[1360px] flex-col gap-2.5">
        <header className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-pink-300">
              Web Photobooth App • {selectedPrintSize?.name || '4R'}
            </p>

            <h1 className="mt-1 text-2xl font-bold leading-none tracking-tight md:text-[28px]">
              Pilih Template
            </h1>

            <p className="mt-1.5 max-w-xl text-sm leading-5 text-slate-400">
              Pilih template foto sebelum memulai sesi photobooth.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={onOpenSettings}
            className="w-full px-4 py-2.5 sm:w-auto"
          >
            Pengaturan
          </Button>
        </header>

        <section className="grid flex-1 gap-3 lg:grid-cols-[minmax(260px,0.58fr)_minmax(340px,1fr)] lg:items-center">
          <div className="min-w-0 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-2.5 lg:border-0 lg:bg-transparent lg:p-0">
            <div className="flex justify-center">
              <FramePreview
                frame={selectedFrame}
                layout={selectedLayout}
                totalPhotos={totalPhotos}
                countdownSeconds={countdownSeconds}
                printSize={selectedPrintSize}
              />
            </div>
          </div>

          <div className="mx-auto w-full max-w-[620px] rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-3.5 shadow-2xl shadow-black/20">
            <div className="mb-2.5">
              <h2 className="text-xl font-bold leading-tight">
                Template Foto
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-300">
                Pilih style template untuk hasil akhir photobooth.
              </p>
            </div>

            <FrameSelector
              frames={frames}
              selectedFrameId={selectedFrame.id}
              onSelectFrame={onSelectFrame}
            />

            <div className="mt-2.5 grid gap-2">
              <Button
                onClick={onStartBooth}
                className="w-full py-2.5 text-sm"
              >
                Mulai Foto
              </Button>

              <Button
                variant="secondary"
                onClick={onOpenSettings}
                className="w-full py-2.5 text-sm"
              >
                Atur Sesi
              </Button>
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-900 p-2.5 text-center text-xs text-slate-400">
              <div>
                <p className="font-bold text-white">
                  {selectedPrintSize?.name || '4R'}
                </p>
                <p>Ukuran</p>
              </div>

              <div>
                <p className="font-bold text-white">{totalPhotos}</p>
                <p>Foto</p>
              </div>

              <div>
                <p className="font-bold text-white">{countdownSeconds}s</p>
                <p>Timer</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default HomePage
