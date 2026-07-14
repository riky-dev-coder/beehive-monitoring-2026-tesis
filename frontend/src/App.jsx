import { useState } from 'react'
import Tabs from './components/Layout/Tabs'
import LiveClock from './components/Layout/LiveClock'
import UserProfileButton from './components/Auth/UserProfileButton'
import ConnectionIndicator from './components/Layout/ConnectionIndicator'
import RealTimePage from './pages/RealTimePage'
import HistoricalPage from './pages/HistoricalPage'
import AlertsPage from './pages/AlertsPage'
import RecommendationsPage from './pages/RecommendationsPage'

const tabs = [
  { id: 'real-time', label: 'Tiempo Real' },
  { id: 'historical', label: 'Histórico' },
  { id: 'alerts', label: 'Alertas' },
  { id: 'recommendations', label: 'Recomendaciones IA' },
]

function App() {
  const [activeTab, setActiveTab] = useState('real-time')

  const renderPage = () => {
    switch (activeTab) {
      case 'real-time': return <RealTimePage />
      case 'historical': return <HistoricalPage />
      case 'alerts': return <AlertsPage />
      case 'recommendations': return <RecommendationsPage />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-[#071014] text-gray-200 flex flex-col">
      <header className="bg-[#0b1316] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo y título */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="rounded-md px-3 py-1 bg-gradient-to-r from-emerald-600 to-green-400 text-black font-bold">
                  Monitor de Colmenas
                </div>
                <span className="text-xs bg-[#06221a] text-emerald-300 px-2 py-1 rounded">
                  v1.1
                </span>
              </div>
              <div className="hidden sm:flex flex-col text-xs text-gray-400">
                <span className="font-medium text-gray-200">Sistema Inteligente</span>
                <span>Panel de monitoreo — Estado general</span>
              </div>
            </div>

            {/* Indicadores en vivo */}
            <div className="flex items-center gap-4">
              <ConnectionIndicator />
              <div className="text-sm font-mono text-emerald-500/80 hidden md:block">
                <LiveClock />
              </div>
              <UserProfileButton />
            </div>
          </div>

          <div className="py-3">
            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderPage()}
      </main>

      <footer className="bg-[#071014] border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Beehive Monitor - Sistema inteligente de monitoreo apícola
          </p>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Datos sincronizados</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App