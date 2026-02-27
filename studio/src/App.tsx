import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Dashboard } from '@/pages/Dashboard'
import { FullSchemaDiagram } from '@/pages/FullSchemaDiagram'
import { SchemaEditor } from '@/pages/SchemaEditor'
import { ModelLayout } from '@/pages/ModelLayout'
import { ModelStructure } from '@/pages/ModelStructure'
import { ModelData } from '@/pages/ModelData'
import { RecordDetail } from '@/pages/RecordDetail'
import { ModelRelationships } from '@/pages/ModelRelationships'
import { ModelDiagram } from '@/pages/ModelDiagram'
import { EnumEditor } from '@/pages/EnumEditor'
import { CreateModelForm } from '@/pages/CreateModelForm'
import { CreateEnumForm } from '@/pages/CreateEnumForm'
import { Login } from '@/pages/Login'
import { Settings } from '@/pages/Settings'
import { useAuth } from '@/context/AuthContext'

const API_BASE = '/ufo-studio/api'

export { API_BASE }

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

function App() {
  const [showLoading, setShowLoading] = useState(true)

  return (
    <>
      {showLoading && (
        <LoadingScreen
          onComplete={() => setShowLoading(false)}
          duration={1800}
        />
      )}
      <BrowserRouter basename="/ufo-studio">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }>
          <Route index element={<Dashboard />} />
          <Route path="schema/overview" element={<FullSchemaDiagram />} />
          <Route path="schema/editor" element={<SchemaEditor />} />
          <Route path="model/:modelName" element={<ModelLayout />}>
            <Route index element={<Navigate to="data" replace />} />
            <Route path="structure" element={<ModelStructure />} />
            <Route path="data" element={<ModelData />} />
            <Route path="record/:id" element={<RecordDetail mode="edit" />} />
            <Route path="record/:id/show" element={<RecordDetail mode="show" />} />
            <Route path="record/:id/edit" element={<RecordDetail mode="edit" />} />
            <Route path="relationships" element={<ModelRelationships />} />
            <Route path="diagram" element={<ModelDiagram />} />
          </Route>
          <Route path="enum/:enumName" element={<EnumEditor />} />
          <Route path="create/model" element={<CreateModelForm />} />
          <Route path="create/enum" element={<CreateEnumForm />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
