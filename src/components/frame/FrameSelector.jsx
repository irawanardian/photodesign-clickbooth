function FrameSelector({
  frames,
  selectedFrameId,
  onSelectFrame,
}) {
  return (
    <div className="grid gap-2">
      {frames.map((frame) => {
        const isSelected = frame.id === selectedFrameId

        return (
          <button
            key={frame.id}
            type="button"
            onClick={() => onSelectFrame(frame)}
            className={`flex items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
              isSelected
                ? 'border-pink-400 bg-pink-500/15 text-white'
                : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10'
            }`}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2"
              style={{
                borderColor: frame.accentColor,
                backgroundColor: frame.backgroundColor,
              }}
            >
              <span
                className="h-4 w-4 rounded-md"
                style={{ backgroundColor: frame.accentColor }}
              />
            </span>

            <span className="min-w-0">
              <span className="block text-sm font-bold">
                {frame.name}
              </span>

              <span className="mt-0.5 block text-xs leading-5 text-slate-400">
                {frame.description}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default FrameSelector
