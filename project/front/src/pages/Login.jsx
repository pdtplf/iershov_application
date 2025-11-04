import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = `${window.location.protocol}//${window.location.hostname}:5000`;

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('') // Clear any previous errors

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      })

      localStorage.setItem('token', response.data.token);

      // Redirect to the dashboard
      navigate('/dashboard')
    } catch (err) {
      setError('Ошибка входа. Проверьте свои учетные данные.')
    }
  }

  return (
    <div className="container">
      <div className="form-section">
        <h1>w3r4kl.ru</h1>
        <h2 style={{ margin: '1rem 0' }}>Войдите в свой аккаунт</h2>

        <form style={{ marginTop: '2rem' }} onSubmit={handleLogin}>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label>Ваша почта</label>
            <input
              type="email"
              placeholder="example@email.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <label>Ваш пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>
          )}

          <button
            type="submit"
            className="button primary-btn"
            style={{ width: '100%', marginTop: '2rem' }}
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  )
}
