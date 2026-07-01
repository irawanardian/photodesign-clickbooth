import { forwardRef } from 'react'

const FramingGuide = forwardRef(function FramingGuide(props, ref) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div
        ref={ref}
        className="relative aspect-[4/3] h-[84%] max-h-[84%] max-w-[84%] overflow-hidden border-2 border-white/75 shadow-[0_0_0_9999px_rgba(2,6,23,0.28)]"
      >
        <div className="absolute left-1/3 top-0 h-full w-px bg-white/35" />
        <div className="absolute left-2/3 top-0 h-full w-px bg-white/35" />
        <div className="absolute left-0 top-1/3 h-px w-full bg-white/35" />
        <div className="absolute left-0 top-2/3 h-px w-full bg-white/35" />

        <div className="absolute left-3 top-3 rounded-full bg-slate-950/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
          Area Foto
        </div>
      </div>
    </div>
  )
})

export default FramingGuide
