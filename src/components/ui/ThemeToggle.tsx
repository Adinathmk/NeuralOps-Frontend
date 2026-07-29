import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const labels = {
    light: 'Light mode',
    dark: 'Dark mode'
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative h-8 w-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-all group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 dark:focus:ring-offset-slate-900"
      aria-label={`Current theme is ${theme}. Click to toggle.`}
      title={labels[theme]}
    >
      <div className="relative flex items-center justify-center h-full w-full overflow-hidden">
        <Sun
          size={16}
          className={`absolute transition-all duration-300 ${theme === 'light' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}`}
        />
        <Moon
          size={16}
          className={`absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}`}
        />
      </div>
    </button>
  )
}
