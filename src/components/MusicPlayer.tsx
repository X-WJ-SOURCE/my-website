import { useRef, useState } from 'react'

export default function MusicPlayer({ url, title }: { url: string; title?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(false)

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) { a.play().catch(() => setError(true)); setPlaying(true) }
    else { a.pause(); setPlaying(false) }
  }

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Number(e.target.value)
    setCurrent(a.currentTime)
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-bg-card/50 rounded-lg px-3 py-1.5">
        <span className="text-xs text-red-400">无法播放此音频链接</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-bg-card/50 rounded-lg px-3 py-1.5">
      <audio ref={audioRef} src={url} preload="metadata"
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError(true)} />
      <button onClick={toggle}
        className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs cursor-pointer hover:opacity-80 shrink-0">
        {playing ? '⏸' : '▶'}
      </button>
      <div className="flex-1 min-w-0">
        {title && <p className="text-xs text-text-primary truncate">{title}</p>}
        <input type="range" min="0" max={duration || 0} value={current} onChange={seek}
          className="w-full h-0.5 accent-accent cursor-pointer" />
      </div>
      <span className="text-[10px] text-text-secondary w-10 text-right shrink-0">
        {formatDuration(current)}/{formatDuration(duration)}
      </span>
    </div>
  )
}

function formatDuration(s: number): string {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
