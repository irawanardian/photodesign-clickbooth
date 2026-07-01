function EventSettings({
  eventTitle,
  eventSubtitle,
  onChangeEventTitle,
  onChangeEventSubtitle,
}) {
  return (
    <div className="grid gap-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          Judul Event
        </label>
        <input
          type="text"
          value={eventTitle}
          onChange={(event) => onChangeEventTitle(event.target.value)}
          placeholder="Contoh: Dede & Rani Wedding"
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-pink-400"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          Subtitle / Tanggal
        </label>
        <input
          type="text"
          value={eventSubtitle}
          onChange={(event) => onChangeEventSubtitle(event.target.value)}
          placeholder="Contoh: 28 Juni 2026"
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-pink-400"
        />
      </div>
    </div>
  )
}

export default EventSettings
