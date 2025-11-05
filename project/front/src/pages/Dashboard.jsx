import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEmails, fetchMain, deactivateEmail, deleteAccount } from '../api.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const [mainEmail, setMainEmail] = useState('');
  const [emails, setEmails] = useState([]);
  const [descs, setDesc] = useState([]);
  const [urls, setUrls] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    async function getData(token) {
      try {
        const main = await fetchMain(token);
        setMainEmail(main.main);
        const data = await fetchEmails(token);
        // API now returns items as { uuid, data }
        setEmails(data.emails || []);
        // clear descs/urls if present — derived from data when rendering
        setDesc([]);
        setUrls([]);
      } catch (error) {
        console.error('Error fetching emails:', error);
      }
    }

    getData(token);
  }, []);
  if (emails.length === 0) {
    return (
      <div className="container">
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>w3r4kl emails</h1>
        </div>

        <div style={{ marginTop: '2rem' }}>
        <h2>Главный почтовый адрес: {mainEmail}</h2>
        <p style={{ marginTop: '2rem', fontSize: '1.2rem' }}>У вас еще нет почтовых адресов, но вы можете создать один ниже</p>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-start', gap: '1rem' }}>
          <button 
          className="button primary-btn"
          onClick={() => window.location.href = '/create'}
          >
          Добавить почтовый адрес
          </button>
          <button
          className="button"
          onClick={handleLogout}
          >
          Выйти
          </button>
        </div>
        </div>
      </div>
      </div>
    );
  }
  return (
    <div className="container">
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>w3r4kl emails</h1>
          {/* Burger menu */}
          <div style={{ position: 'relative' }}>
            <button
              aria-label="Открыть меню"
              className="button"
              onClick={() => setMenuOpen(open => !open)}
              style={{ padding: '0.5rem', minWidth: '40px' }}
            >
              <div style={{ width: '20px', height: '2px', background: '#333', marginBottom: '4px' }} />
              <div style={{ width: '20px', height: '2px', background: '#333', marginBottom: '4px' }} />
              <div style={{ width: '20px', height: '2px', background: '#333' }} />
            </button>

            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'white', border: '1px solid #ddd', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 50 }}>
                <button onClick={() => { setMenuOpen(false); navigate('/help'); }} style={{ display: 'block', padding: '0.75rem 1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>Помощь</button>
                <button onClick={() => { setMenuOpen(false); navigate('/dashboard'); }} style={{ display: 'block', padding: '0.75rem 1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>Активные адреса</button>
                <button onClick={() => { setMenuOpen(false); navigate('/deactivated'); }} style={{ display: 'block', padding: '0.75rem 1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>Отключенные адреса</button>
                <button onClick={() => { setMenuOpen(false); navigate('/change-email'); }} style={{ display: 'block', padding: '0.75rem 1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}>Сменить основную почту</button>
                <button onClick={async () => {
                    setMenuOpen(false);
                    const confirmed = window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.');
                    if (!confirmed) return;
                    try {
                      const token = localStorage.getItem('token');
                      await deleteAccount(token);
                      localStorage.removeItem('token');
                      navigate('/login');
                    } catch (err) {
                      console.error('Failed to delete account', err);
                      window.alert('Не удалось удалить аккаунт. Попробуйте снова.');
                    }
                  }} style={{ display: 'block', padding: '0.75rem 1.25rem', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', color: 'red' }}>Удалить аккаунт</button>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ marginTop: '2rem' }}>
          <h2>Главный почтовый адрес: {mainEmail}</h2>
          
          <h3 style={{ margin: '1.5rem 0 1rem' }}>Дополнительные адреса и привязанные сервисы:</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '0px solid #ddd', padding: '8px', textAlign: 'left' }}>Адрес</th>
                <th style={{ border: '0px solid #ddd', padding: '8px', textAlign: 'left' }}>Сервис</th>
                <th style={{ border: '0px solid #ddd', padding: '8px', textAlign: 'left' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((item, index) => {
                    const d = item.data || [];
                    const local = Array.isArray(d) && d.length > 0 ? d[0] : (d?.email || d?.local || '');
                    const desc = Array.isArray(d) && d.length > 1 ? d[1] : (d?.service || d?.name || '');
                    const url = Array.isArray(d) && d.length > 2 ? d[2] : (d?.serviceUrl || d?.url || '');
                    return (
                    <tr key={item.uuid || index}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {local}@w3r4kl.ru
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {desc || 'Нет описания'}
                        <br />
                        {url && (
                          <a 
                            href={url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ fontSize: '0.8rem' }}
                          >
                            {url}
                          </a>
                        )}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        <button
                          className="button danger"
                          onClick={async () => {
                            const confirmed = window.confirm(`Деактивировать адрес ${local}@w3r4kl.ru ?`);
                            if (!confirmed) return;
                            const token = localStorage.getItem('token');
                            try {
                              await deactivateEmail(token, d);
                              // remove the item from local state by uuid
                              setEmails(prev => prev.filter(p => p.uuid !== item.uuid));
                            } catch (err) {
                              console.error(err);
                              window.alert('Не удалось деактивировать адрес. Попробуйте снова.');
                            }
                          }}
                        >
                          Деактивировать
                        </button>
                      </td>
                    </tr>
                  );
                  })}
            </tbody>
          </table>

          <button 
            className="button primary-btn" 
            style={{ marginTop: '2rem' }}
            onClick={() => window.location.href = '/create'}
          >
            Добавить почтовый адрес
          </button>
          <button
            className="button"
            style={{ marginLeft: '1rem' }}
            onClick={handleLogout}
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
