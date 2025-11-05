import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDeactivated, activateEmail } from '../api.jsx';

export default function DeactivatedPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    async function load() {
      try {
        const data = await fetchDeactivated(token);
        setRows(data || []);
      } catch (err) {
        console.error('Error fetching deactivated:', err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleActivate = async (row) => {
    const local = Array.isArray(row.data) && row.data.length > 0 ? row.data[0] : (row.data?.email || row.data?.local || '');
    const confirmed = window.confirm(`Активировать адрес ${local}@w3r4kl.ru?`);
    if (!confirmed) return;
    const token = localStorage.getItem('token');
    try {
      const d = row.data || [];
      await activateEmail(token, d);
      navigate('/dashboard');
      // remove from UI by uuid
      setRows(prev => prev.filter(r => r.uuid !== row.uuid));
    } catch (err) {
      console.error(err);
      window.alert('Не удалось активировать адрес.');
    }
  };

  if (loading) return <div className="container"><div className="form-section">Loading...</div></div>;

  return (
    <div className="container">
      <div className="form-section">
        <h1>Отключенные адреса</h1>

        {rows.length === 0 ? (
          <p style={{ marginTop: '1rem' }}>У вас нет отключенных адресов.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', textAlign: 'left' }}>Адрес</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Сервис</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const d = r.data || [];
                const local = Array.isArray(d) && d.length > 0 ? d[0] : (d?.email || d?.local || '');
                const service = Array.isArray(d) && d.length > 1 ? d[1] : (d?.service || d?.name || '');
                const url = Array.isArray(d) && d.length > 2 ? d[2] : (d?.serviceUrl || d?.url || '');
                return (
                  <tr key={r.uuid}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{local}@w3r4kl.ru</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {service || 'Нет описания'}
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
                      <button className="button" onClick={() => handleActivate(r)}>Активировать</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
