function PhotoResult({ photos = [], totalPhotos = 4 }) {
  const emptySlots = Math.max(totalPhotos - photos.length, 0)

  return (
    <div className="h-full rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/30">
      <div className="mb-3">
        <h2 className="text-base font-semibold">Hasil Foto</h2>
        <p className="text-xs text-slate-400">
          {photos.length}/{totalPhotos} foto
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {photos.map((photoUrl, index) => (
          <div
            key={photoUrl}
            className="overflow-hidden rounded-xl border border-white/10 bg-slate-900"
          >
            <img
              src={photoUrl}
              alt={`Hasil foto ${index + 1}`}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        ))}

        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-900/70"
          >
            <span className="text-[11px] text-slate-500">
              Foto {photos.length + index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PhotoResult
