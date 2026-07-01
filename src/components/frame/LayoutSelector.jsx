function LayoutSelector({ layouts, selectedLayoutId, onSelectLayout, disabled = false }) {
  return (
    <div className="grid gap-3">
      {layouts.map((layout) => {
        const isSelected = layout.id === selectedLayoutId

        return (
          <button
            key={layout.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectLayout(layout)}
            className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isSelected
                ? 'border-pink-400 bg-pink-500/15'
                : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
            }`}
          >
            <p className="text-sm font-semibold text-white">
              {layout.name}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {layout.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}

export default LayoutSelector
