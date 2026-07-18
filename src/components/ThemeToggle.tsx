import { useTheme, themes } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, nextTheme } = useTheme()
  const current = themes.find(t => t.id === theme) || themes[0]

  return (
    <button
      onClick={nextTheme}
      className="p-2 rounded-lg hover:bg-bg-card transition-colors duration-200 text-sm cursor-pointer whitespace-nowrap"
      title={`当前: ${current.name}`}
    >
      <span className="mr-1">{current.icon}</span>
      <span className="text-text-secondary hidden sm:inline">{current.name}</span>
    </button>
  )
}
