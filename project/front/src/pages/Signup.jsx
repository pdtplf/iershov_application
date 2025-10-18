import { useState } from 'react';
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submissions
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://193.135.137.144:5000/register', {
        name, 
        email, 
        password,
      });

      if (response.status !== 201) {
        throw new Error('Failed to sign up');
      }
      const log_resp = await axios.post('http://193.135.137.144:5000/login', {
        email,
        password,
      });
      localStorage.setItem('token', log_resp.data.token);
      navigate('/dashboard')
    } catch (err) {
      console.error(err);
      setError('Что-то пошло не так. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordSecure = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  const isEmailValid = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      re.test(email) &&
      email.length > 0
    );
  };

  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmationField, setShowConfirmationField] = useState(false);

  const sendConfirmationCode = async () => {
    try {
      await axios.post('http://193.135.137.144:5000/send-confirmation-code', { email });
      setShowConfirmationField(true);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Не удалось отправить код подтверждения. Попробуйте еще раз.');
    }
  };

  const verifyConfirmationCode = async () => {
    try {
      const response = await axios.post('http://193.135.137.144:5000/verify-confirmation-code', {
        email,
        code: confirmationCode,
      });

      if (response.status === 200) {
        setIsEmailConfirmed(true);
        setError('');
      } else {
        throw new Error('Invalid confirmation code');
      }
    } catch (err) {
      console.error(err);
      setError('Неверный код подтверждения. Попробуйте еще раз.');
    }
  };

  return (
    <div className="container">
      <div className="form-section">
        <h1>w3r4kl.ru</h1>
        <h2 style={{ margin: '1rem 0' }}>Создайте свой аккаунт прямо сейчас!</h2>

        <form
          onSubmit={(e) => {
            if (!isPasswordSecure(password)) {
              e.preventDefault();
              setError(
                'Пароль должен содержать минимум 8 символов, включая заглавные, строчные буквы, цифры и специальные символы.'
              );
              return;
            }
            if (!isEmailConfirmed) {
              e.preventDefault();
              setError('Пожалуйста, подтвердите ваш email перед регистрацией.');
              return;
            }
            handleSignup(e);
            }}
          >
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ marginRight: '0.5rem' }}>Ваше имя</label>
            <input
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ marginRight: '0.5rem' }}>Основной адрес</label>
            <input
              type="email"
              placeholder="example@example.com"
              value={email}
              onChange={(e) => {
              setEmail(e.target.value);
              if (!isEmailValid(e.target.value)) {
                setError('Пожалуйста, введите действительный email.');
              } else {
                setError('');
              }
              }}
              required
            />
            <button
              type="button"
              onClick={() => {
                if (!isEmailValid(email)) {
                  setError('Пожалуйста, введите действительный email.');
                  return;
                }
                sendConfirmationCode();
              }}
              disabled={showConfirmationField || isEmailConfirmed}
              style={{ marginLeft: '0.5rem' }}
            >
              {isEmailConfirmed ? 'Подтверждено' : 'Подтвердить'}
            </button>
          </div>

          {showConfirmationField && !isEmailConfirmed && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ marginRight: '0.5rem' }}>Код подтверждения</label>
              <input
                type="text"
                placeholder="Введите код"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={verifyConfirmationCode}
                style={{ marginLeft: '0.5rem' }}
              >
                Проверить
              </button>
            </div>
          )}

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <label style={{ marginRight: '0.5rem' }}>Ваш пароль</label>
            <input
              type="password"
              placeholder=">8 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p style={{ color: 'red', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {error}
            </p>
          )}

          <button
            className="button primary-btn"
            style={{ width: '100%', marginTop: '2rem', fontSize: '1.2rem' }}
          >
            Создать
          </button>
        </form>
      </div>
    </div>
  );
}
