function SessionSettings({
  totalPhotos,
  countdownSeconds,
  onChangeTotalPhotos,
  onChangeCountdownSeconds,
  disabled = false,
}) {
  const photoOptions = [3, 4]
  const countdownOptions = [3, 5, 10]

  return (
    <div className="grid gap-5">
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-200">
          Jumlah Foto
        </p>

        <div className="grid grid-cols-2 gap-3">
          {photoOptions.map((option) => {
            const isSelected = option === totalPhotos

            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => onChangeTotalPhotos(option)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected
                    ? 'border-pink-400 bg-pink-500/15 text-white'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                {option} Foto
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-200">
          Countdown
        </p>

        <div className="grid grid-cols-3 gap-3">
          {countdownOptions.map((option) => {
            const isSelected = option === countdownSeconds

            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => onChangeCountdownSeconds(option)}
                className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected
                    ? 'border-pink-400 bg-pink-500/15 text-white'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                {option}s
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SessionSettings
