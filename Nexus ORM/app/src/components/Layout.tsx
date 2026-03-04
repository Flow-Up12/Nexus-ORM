import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Database,
  FileCode,
  GitBranch,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Table,
  List,
  Plus,
  Settings,
  LogOut,
  Sun,
  Moon,
  Terminal,
} from 'lucide-react'
import { SearchInput, Button } from '@/ui'
import { useSchema } from '@/hooks'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

const SIDEBAR_COLLAPSED_KEY = 'nexus-sidebar-collapsed'

export function Layout() {
  const location = useLocation()
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [search, setSearch] = useState('')
  const [modelsOpen, setModelsOpen] = useState(true)
  const [enumsOpen, setEnumsOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed))
    } catch {
      return
    }
  }, [sidebarCollapsed])

  const { models, enums } = useSchema()

  const searchLower = search.toLowerCase().trim()
  const filteredModels = searchLower
    ? models.filter((m) => m.name.toLowerCase().includes(searchLower))
    : models
  const filteredEnums = searchLower
    ? enums.filter((e) => e.name.toLowerCase().includes(searchLower))
    : enums

  const navItems = [
    { path: '/schema/canvas', label: 'Full Schema ER Diagram', icon: GitBranch },
    { path: '/schema/editor', label: 'Schema Editor', icon: FileCode },
    { path: '/query', label: 'SQL Playground', icon: Terminal },
    { path: '/create/model', label: 'Create Model', icon: Plus },
    { path: '/create/enum', label: 'Create Enum', icon: Plus },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <aside
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-sm flex flex-col transition-all duration-200 ${sidebarWidth}`}
      >
        <div className={`border-b border-slate-200 dark:border-slate-700 ${sidebarCollapsed ? 'p-3' : 'p-6'}`}>
          <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'flex-col' : 'justify-between'}`}>
            <div className={`flex items-center gap-2 min-w-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <Database className="w-8 h-8 text-indigo-600 shrink-0" />
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="font-bold text-slate-900 dark:text-slate-100 truncate">Nexus ORM</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Database Manager</p>
                </div>
              )}
            </div>
            <Button
              variant="icon"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <SearchInput
              placeholder="Search models, enums..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        <nav className={`flex-1 overflow-y-auto p-4 space-y-1 ${sidebarCollapsed ? 'p-2' : ''}`}>
          {navItems.slice(0, 3).map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              title={sidebarCollapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-lg transition-colors ${
                sidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'
              } ${
                isActive(path)
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && label}
            </Link>
          ))}

          {!sidebarCollapsed && (
            <>
              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setModelsOpen(!modelsOpen)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  {modelsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Table className="w-4 h-4" />
                  <span className="font-medium">Models</span>
                  <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                    {models.length}
                  </span>
                </button>
                {modelsOpen && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {filteredModels.map((m) => (
                      <Link
                        key={m.name}
                        to={`/model/${m.name}/data`}
                        className={`block px-4 py-2 rounded-lg text-sm ${
                          location.pathname.startsWith(`/model/${m.name}`)
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {m.name}
                      </Link>
                    ))}
                    {filteredModels.length === 0 && (
                      <p className="px-4 py-2 text-sm text-slate-400 dark:text-slate-500">No models match</p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setEnumsOpen(!enumsOpen)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  {enumsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <List className="w-4 h-4" />
                  <span className="font-medium">Enums</span>
                  <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                    {enums.length}
                  </span>
                </button>
                {enumsOpen && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {filteredEnums.map((e) => (
                      <Link
                        key={e.name}
                        to={`/enum/${e.name}`}
                        className={`block px-4 py-2 rounded-lg text-sm ${
                          location.pathname === `/enum/${e.name}`
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {e.name}
                      </Link>
                    ))}
                    {filteredEnums.length === 0 && (
                      <p className="px-4 py-2 text-sm text-slate-400 dark:text-slate-500">No enums match</p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                <Link
                  to="/create/model"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/create/model')
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Plus className="w-5 h-5 shrink-0" />
                  Create Model
                </Link>
                <Link
                  to="/create/enum"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/create/enum')
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Plus className="w-5 h-5 shrink-0" />
                  Create Enum
                </Link>
                <Link
                  to="/settings"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/settings')
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Settings className="w-5 h-5 shrink-0" />
                  Settings
                </Link>
              </div>
            </>
          )}

          {sidebarCollapsed && (
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
              {filteredModels.map((m) => (
                <Link
                  key={m.name}
                  to={`/model/${m.name}/data`}
                  title={m.name}
                  className={`flex justify-center p-2 rounded-lg transition-colors ${
                    location.pathname.startsWith(`/model/${m.name}`)
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Table className="w-5 h-5" />
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className={`border-t border-slate-200 dark:border-slate-700 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors shrink-0 ${
                sidebarCollapsed ? 'w-full p-3' : 'p-2'
              }`}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
            {!sidebarCollapsed && (
              <button
                onClick={logout}
                className="flex flex-1 items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Logout
              </button>
            )}
          </div>
          {sidebarCollapsed && (
            <button
              onClick={logout}
              title="Logout"
              className="mt-2 flex justify-center w-full p-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
      <main className={`p-8 transition-all duration-200 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Outlet />
      </main>
    </div>
  )
}
