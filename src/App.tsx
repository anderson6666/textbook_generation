import { Routes, Route } from 'react-router-dom'
import './App.css'
import './components/sidebar.css'
import { WorkflowProvider } from './context/WorkflowContext'
import Sidebar from './components/Sidebar'
import WorkflowPreview from './components/WorkflowPreview'
import Home from './pages/Home'
import Outline from './pages/Outline'
import DetailOutline from './pages/DetailOutline'
import KnowledgeOutput from './pages/KnowledgeOutput'
import Settings from './pages/Settings'

function App() {
  return (
    <WorkflowProvider>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/outline" element={<Outline />} />
            <Route path="/detail-outline" element={<DetailOutline />} />
            <Route path="/knowledge-output" element={<KnowledgeOutput />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <WorkflowPreview />
      </div>
    </WorkflowProvider>
  )
}

export default App