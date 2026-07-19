import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from 'react'

interface AudioState {
  url: string
  title: string
  highlightTime: number
  playing: boolean
  currentTime: number
  duration: number
}

interface AudioContextType {
  state: AudioState | null
  play: (url: string, title?: string, highlightTime?: number) => void
  stop: () => void
  toggle: () => void
  seek: (time: number) => void
}

const AudioCtx = createContext<AudioContextType>({
  state: null,
  play: () => {},
  stop: () => {},
  toggle: () => {},
  seek: () => {},
})

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<AudioState | null>(null)

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio()
      a.preload = 'metadata'
      audioRef.current = a
    }
    return audioRef.current
  }, [])

  const play = useCallback((url: string, title?: string, highlightTime?: number) => {
    const a = getAudio()
    const current = state

    if (current?.url === url) {
      if (a.paused) {
        a.play()
        setState(s => s ? { ...s, playing: true } : null)
      } else {
        a.pause()
        setState(s => s ? { ...s, playing: false } : null)
      }
      return
    }

    a.src = url
    a.play().catch(() => {})
    
    const newState: AudioState = {
      url, title: title || '', highlightTime: highlightTime || 0,
      playing: true, currentTime: 0, duration: 0,
    }
    setState(newState)

    const onMeta = () => setState(s => s ? { ...s, duration: a.duration || 0 } : null)
    const onTime = () => setState(s => s ? { ...s, currentTime: a.currentTime } : null)
    const onEnd = () => setState(s => s ? { ...s, playing: false } : null)

    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
  }, [getAudio, state])

  const stop = useCallback(() => {
    const a = audioRef.current
    if (a) { a.pause(); a.src = '' }
    setState(null)
  }, [])

  const toggle = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) { a.play(); setState(s => s ? { ...s, playing: true } : null) }
    else { a.pause(); setState(s => s ? { ...s, playing: false } : null) }
  }, [])

  const seek = useCallback((time: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = time
    setState(s => s ? { ...s, currentTime: time } : null)
  }, [])

  return (
    <AudioCtx.Provider value={{ state, play, stop, toggle, seek }}>
      {children}
    </AudioCtx.Provider>
  )
}

export function useGlobalAudio() {
  return useContext(AudioCtx)
}
