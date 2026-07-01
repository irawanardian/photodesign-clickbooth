function PhotoStripPreview({ stripUrl }) {
  if (!stripUrl) return null

  return (
    <div className="h-full rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30">
      <div className="mb-3">
        <h2 className="text-base font-semibold">Final Output</h2>
        <p className="text-xs text-slate-400">
          Hasil siap di-download.
        </p>
      </div>

      <div className="flex h-[calc(100%-56px)] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white p-2">
        <img
          src={stripUrl}
          alt="Final photobooth output"
          className="max-h-full w-auto max-w-full object-contain"
        />
      </div>
    </div>
  )
}

export default PhotoStripPreview
