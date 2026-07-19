import { useGlobalAudio } from '../hooks/useGlobalAudio'

export default function GlobalPlayer() {
  const { state, toggle, seek, stop } = useGlobalAudio()
  if (!state) return null

  const dur = state.duration || 0
  const cur = state.currentTime
  const hl = state.highlightTime || 0
  const hlPercent = dur > 0 && hl > 0 ? (hl / dur) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card/95 backdrop-blur border-t border-bg-card p-2 px-4">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <button onClick={toggle}
          className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white cursor-pointer hover:opacity-80 shrink-0">
          {state.playing ? '⏸' : '▶'}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-primary truncate">{state.title || '未知歌曲'}</p>
          <div className="relative">
            <input type="range" min="0" max={dur || 0} value={cur}
              onChange={e => seek(Number(e.target.value))}
              className="w-full h-1 accent-accent cursor-pointer" />
            {hlPercent > 0 && (
              <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-400 border border-white cursor-pointer hover:scale-125 transition-transform"
                style={{ left: `calc(${hlPercent}% - 5px)` }}
                title="高潮点"
                onClick={(e) => { e.stopPropagation(); seek(hl) }} />
            )}
          </div>
        </div>
        <span className="text-[10px] text-text-secondary w-16 text-right shrink-0">
          {fmt(cur)} / {fmt(dur)}
        </span>
        <button onClick={stop}
          className="text-text-secondary hover:text-text-primary text-sm cursor-pointer">✕</button>
      </div>
    </div>
  )
}

function fmt(s: number): string {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
