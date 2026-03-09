import { Database, Sun, Moon, LogOut } from 'lucide-react'
import { Button } from '@/ui'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { NotificationBell } from '@/components/NotificationBell'
import { ProjectsDashboard } from './ProjectsDashboard'

/**
 * Standalone Projects view - no schema sidebar.
 * Clicking a project's Open goes to /project/:id (studio filtered by that project).
 */
export function ProjectsView() {
  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h1 className="font-bold text-slate-900 dark:text-slate-100">Nexus ORM</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Projects</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="icon" onClick={toggleTheme} title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Button variant="secondary" size="sm" onClick={logout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <ProjectsDashboard />
      </main>
    </div>
  )
}
