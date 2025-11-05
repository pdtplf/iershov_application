import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import CreateMailAdress from './pages/CreateMailAdress'
import DeactivatedPage from './pages/Deactivated'
import ChangeEmail from './pages/changeEmail'
import Help from './pages/help'
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
        <Route path="/change-email" element={<ChangeEmail />} />
        <Route path="/help" element={<Help />} />
        
      </Routes>
    </BrowserRouter>
  )
}
