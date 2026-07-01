function CountdownOverlay({
  count,
  countdown,
  isCountingDown,
  isVisible,
  show,
}) {
  const visible = isCountingDown || isVisible || show
  const displayCount = count ?? countdown ?? ''

  if (!visible) return null

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-30">
      <div className="rounded-2xl border border-pink-300/40 bg-slate-950/75 px-5 py-3 text-center shadow-2xl shadow-black/40 backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-pink-200">
          Timer
        </p>

        <p className="mt-1 text-4xl font-black leading-none text-white sm:text-5xl">
          {displayCount}
        </p>
      </div>
    </div>
  )
}

export default CountdownOverlay
