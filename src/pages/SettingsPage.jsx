import EventSettings from '../components/booth/EventSettings'
import SessionSettings from '../components/booth/SessionSettings'
import LayoutSelector from '../components/frame/LayoutSelector'
import PrintSizeSelector from '../components/frame/PrintSizeSelector'
import Button from '../components/ui/Button'

function SettingsPage({
  settings,
  layouts,
  printSizes,
  onChangeSettings,
  onBack,
}) {
  const {
    selectedLayout,
    selectedPrintSize,
    totalPhotos,
    countdownSeconds,
    eventTitle,
    eventSubtitle,
  } = settings

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-4 text-white sm:px-6 sm:py-5">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium text-pink-300">
                Pengaturan Booth
              </p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                Setting Sesi
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Atur teks event, sesi foto, layout, dan ukuran cetak sebelum mulai foto.
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={onBack}
              className="w-full sm:w-auto"
            >
              Kembali
            </Button>
          </header>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.8rem]">
            <h2 className="text-lg font-semibold">Info Event</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Teks ini akan tampil pada hasil akhir photobooth.
            </p>

            <div className="mt-6">
              <EventSettings
                eventTitle={eventTitle}
                eventSubtitle={eventSubtitle}
                onChangeEventTitle={(value) =>
                  onChangeSettings({ eventTitle: value })
                }
                onChangeEventSubtitle={(value) =>
                  onChangeSettings({ eventSubtitle: value })
                }
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.8rem]">
            <h2 className="text-lg font-semibold">Sesi Foto</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Atur jumlah foto dan durasi countdown sebelum kamera mengambil gambar.
            </p>

            <div className="mt-6">
              <SessionSettings
                totalPhotos={totalPhotos}
                countdownSeconds={countdownSeconds}
                onChangeTotalPhotos={(value) =>
                  onChangeSettings({ totalPhotos: value })
                }
                onChangeCountdownSeconds={(value) =>
                  onChangeSettings({ countdownSeconds: value })
                }
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.8rem]">
            <h2 className="text-lg font-semibold">Layout Output</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Pilih bentuk hasil akhir yang akan di-download dan disimpan.
            </p>

            <div className="mt-6">
              <LayoutSelector
                layouts={layouts}
                selectedLayoutId={selectedLayout.id}
                onSelectLayout={(layout) =>
                  onChangeSettings({ selectedLayout: layout })
                }
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.8rem]">
            <h2 className="text-lg font-semibold">Ukuran Cetak</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Pilih ukuran hasil akhir untuk cetak foto.
            </p>

            <div className="mt-6">
              <PrintSizeSelector
                printSizes={printSizes}
                selectedPrintSizeId={selectedPrintSize?.id || '4r'}
                onSelectPrintSize={(printSize) =>
                  onChangeSettings({ selectedPrintSize: printSize })
                }
              />
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:rounded-[1.8rem] lg:sticky lg:top-5">
          <h2 className="text-lg font-semibold">Ringkasan</h2>

          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl bg-slate-900 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Event
              </p>
              <p className="mt-2 text-sm font-semibold">{eventTitle}</p>
              <p className="mt-1 text-sm text-slate-400">{eventSubtitle}</p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Jumlah Foto
              </p>
              <p className="mt-2 text-sm font-semibold">{totalPhotos} Foto</p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Countdown
              </p>
              <p className="mt-2 text-sm font-semibold">{countdownSeconds} Detik</p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Layout
              </p>
              <p className="mt-2 text-sm font-semibold">{selectedLayout.name}</p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Ukuran Cetak
              </p>
              <p className="mt-2 text-sm font-semibold">
                {selectedPrintSize?.name || '4R'}
              </p>
            </div>
          </div>

          <Button onClick={onBack} className="mt-6 w-full py-4 text-base">
            Simpan Pengaturan
          </Button>
        </aside>
      </div>
    </main>
  )
}

export default SettingsPage
