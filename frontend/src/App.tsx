import { Routes, Route } from 'react-router-dom'
import { SearchPage } from './pages/SearchPage'
import { ProviderPage } from './pages/ProviderPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/provider/:odsCode" element={<ProviderPage />} />
    </Routes>
  )
}
