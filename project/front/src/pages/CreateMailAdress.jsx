import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CreateMailAddress() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [signature, setSignature] = useState('');
  const [service, setService] = useState('');
  const [serviceUrl, setServiceUrl] = useState('');
  const [errors, setErrors] = useState({});

  const generateEmail = () => {
    const randomString = Array.from({ length: 10 }, () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    return `${randomString}`;
  };

  const handleGenerate = () => {
    setEmail(generateEmail());
  };

  const validate = () => {
    const newErrors = {};
    if (!/^[^\s]+$/.test(email)) {
      newErrors.email = 'Email адрес некорректен';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'http://193.135.137.144:5000/emails',
          {
            temp: [email, service, serviceUrl, signature]
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        navigate('/dashboard');
      } catch (err) {
        setErrors({ form: 'Ошибка создания адреса. Попробуйте снова.' });
      }
    }
  };

  return (
    <div className="container">
      <div className="form-section">
        <h1>Создайте свой доп. адрес</h1>

        <form style={{ marginTop: '2rem' }} onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Название вашего дополнительного адреса</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', padding: '0.5rem', borderRadius: '4px' }}>
                <span>{email || 'example'}</span>
                <span>@w3r4kl.ru</span>
              </div>
              <button
                type="button"
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={async () => {
                  try {
                    const response = await axios.get('http://193.135.137.144:5000/gen');
                    setEmail(response.data.email);
                    setSignature(response.data.signature);
                  } catch (err) {
                    setErrors({ email: 'Ошибка получения адреса. Попробуйте снова.' });
                  }
                }}
              >
                Получить адрес
              </button>
            </div>
            {errors.email && <p style={{ color: 'red' }}>{errors.email}</p>}
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Сервис к которому привязана почта</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Ссылка на этот сервис</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                value={serviceUrl}
                onChange={(e) => setServiceUrl(e.target.value)}
                required
              />
            </div>
          </div>

          {errors.form && <p style={{ color: 'red', marginTop: '1rem' }}>{errors.form}</p>}

          <button
            type="submit"
            className="button primary-btn"
            style={{ width: '100%', marginTop: '2rem' }}
          >
            Создать
          </button>
        </form>
      </div>
    </div>
  );
}