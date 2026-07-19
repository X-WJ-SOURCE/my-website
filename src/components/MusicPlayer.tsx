import { useGlobalAudio } from '../hooks/useGlobalAudio'

export default function MusicPlayer({ url, title, highlightTime }: { url: string; title?: string; highlightTime?: number }) {
  const { state, play } = useGlobalAudio()
  const isThisPlaying = state?.url === url && state?.playing

  return (
    <div className="flex items-center gap-2 bg-bg-card/50 rounded-lg px-3 py-1.5">
      <button onClick={() => play(url, title, highlightTime)}
        className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs cursor-pointer hover:opacity-80 shrink-0">
        {isThisPlaying ? '⏸' : '▶'}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-primary truncate">{title || '未知歌曲'}</p>
      </div>
    </div>
  )
}
