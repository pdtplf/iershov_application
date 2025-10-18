import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '1rem' }}>
        Добро пожаловать на w3r4kl.ru
      </h1>

      <nav style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="button"
          style={{ padding: '1rem 2rem', fontSize: '1.25rem' }}
          onClick={() => navigate('/login')}
        >
          Войти в аккаунт
        </button>
        <button
          className="button primary-btn"
          style={{ padding: '1rem 2rem', fontSize: '1.25rem' }}
          onClick={() => navigate('/signup')}
        >
          Создать аккаунт
        </button>
      </nav>
    </div>
  )
}