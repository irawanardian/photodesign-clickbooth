function PrintSizeSelector({
  printSizes,
  selectedPrintSizeId,
  onSelectPrintSize,
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {printSizes.map((printSize) => {
        const isSelected = printSize.id === selectedPrintSizeId

        return (
          <button
            key={printSize.id}
            type="button"
            onClick={() => onSelectPrintSize(printSize)}
            className={`rounded-2xl border p-4 text-left transition ${
              isSelected
                ? 'border-pink-400 bg-pink-500/15 text-white'
                : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10'
            }`}
          >
            <p className="text-lg font-bold">{printSize.name}</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {printSize.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}

export default PrintSizeSelector
