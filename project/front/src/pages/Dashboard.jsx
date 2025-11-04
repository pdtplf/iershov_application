import { useEffect, useState } from 'react';
import { fetchEmails, fetchMain } from '../api';

export default function Dashboard() {
  const [mainEmail, setMainEmail] = useState('');
  const [emails, setEmails] = useState([]);
  const [descs, setDesc] = useState([]);
  const [urls, setUrls] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    async function getData(token) {
      try {
        const main = await fetchMain(token);
        setMainEmail(main.main);

        const data = await fetchEmails(token);
        const extractedEmails = data.emails.map(item => item.temp[0]);
        setEmails(extractedEmails.slice(0));

        const extractedDescriptions = data.emails.map(item => item.temp[1]);
        setDesc(extractedDescriptions.slice(0));

        const extractedUrls = data.emails.map(item => item.temp[2]);
        setUrls(extractedUrls.slice(0));
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
        </div>
        
        <div style={{ marginTop: '2rem' }}>
          <h2>Главный почтовый адрес: {mainEmail}</h2>
          
          <h3 style={{ margin: '1.5rem 0 1rem' }}>Дополнительные адреса и привязанные сервисы:</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '0px solid #ddd', padding: '8px', textAlign: 'left' }}>Адрес</th>
                <th style={{ border: '0px solid #ddd', padding: '8px', textAlign: 'left' }}>Сервис</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email, index) => (
                <tr key={email}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {email}@w3r4kl.ru
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {descs[index] || 'Нет описания'}
                    <br />
                    {urls[index] && (
                      <a 
                        href={urls[index].startsWith('http://') || urls[index].startsWith('https://') ? urls[index] : `https://${urls[index]}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ fontSize: '0.8rem' }}
                      >
                        {urls[index]}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
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
