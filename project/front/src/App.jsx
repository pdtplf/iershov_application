import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import CreateMailAdress from './pages/CreateMailAdress'
import DeactivatedPage from './pages/Deactivated'
import Activate from './pages/Activate'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreateMailAdress />} />
        <Route path="/deactivated" element={<DeactivatedPage />} />
        <Route path="/activate" element={<Activate />} />
      </Routes>
    </BrowserRouter>
  )
}
