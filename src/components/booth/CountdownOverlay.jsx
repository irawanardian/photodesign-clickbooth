function CountdownOverlay({
  count,
  isCountingDown,
}) {
  if (!isCountingDown) return null

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[80] flex h-32 w-32 items-center justify-center rounded-[2rem] border border-pink-300/35 bg-slate-950/80 shadow-2xl shadow-black/50 backdrop-blur-md sm:right-8 sm:top-8 sm:h-44 sm:w-44 sm:rounded-[2.5rem]">
      <div className="text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-pink-200 sm:text-sm">
          Timer
        </p>

        <p className="mt-1 text-7xl font-black leading-none tracking-tight text-white sm:text-[7.5rem]">
          {count}
        </p>
      </div>
    </div>
  )
}

export default CountdownOverlay
