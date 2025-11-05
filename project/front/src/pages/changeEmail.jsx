import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMain, sendConfirmationCode, verifyConfirmationCode, changeMainEmail } from '../api.jsx'

export default function ChangeEmail() {
	const [current, setCurrent] = useState('')
	const [newEmail, setNewEmail] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const [showConfirmationField, setShowConfirmationField] = useState(false)
	const [confirmationCode, setConfirmationCode] = useState('')
	const [isEmailConfirmed, setIsEmailConfirmed] = useState(false)
	const navigate = useNavigate()

	const token = localStorage.getItem('token')

	useEffect(() => {
		let mounted = true
		async function load() {
			if (!token) return
			try {
				const res = await fetchMain(token)
				if (mounted) setCurrent(res.main || '')
			} catch (err) {
				console.error(err)
			}
		}
		load()
		return () => { mounted = false }
	}, [token])

	const isEmailValid = (email) => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return re.test(email) && email.length > 0
	}

	const handleSendCode = async () => {
		setError('')
		if (!isEmailValid(newEmail)) {
			setError('Пожалуйста, введите действительный email.')
			return
		}
		try {
			await sendConfirmationCode(newEmail)
			setShowConfirmationField(true)
		} catch (err) {
			console.error(err)
			setError('Не удалось отправить код подтверждения. Попробуйте еще раз.')
		}
	}

	const handleVerify = async () => {
		setError('')
		if (!confirmationCode) {
			setError('Введите код подтверждения')
			return
		}
		try {
			await verifyConfirmationCode(newEmail, confirmationCode)
			setIsEmailConfirmed(true)
			// now call change-email
			setLoading(true)
			await changeMainEmail(token, newEmail)
			// on success navigate to dashboard
			navigate('/dashboard')
		} catch (err) {
			console.error(err)
			setError('Неверный код подтверждения или ошибка при изменении email.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="container">
			<div className="form-section">
				<h1>w3r4kl.ru</h1>
				<h2 style={{ margin: '1rem 0' }}>Изменить основной адрес</h2>

				<div style={{ marginBottom: '1rem' }}>
					<strong>Текущий адрес:</strong>
					<div style={{ marginTop: '0.5rem' }}>{current || 'Не задан'}</div>
				</div>

				<div className="form-group" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
					<label style={{ marginRight: '0.5rem' }}>Новый адрес</label>
					<input
						type="email"
						placeholder="example@example.com"
						value={newEmail}
						onChange={(e) => setNewEmail(e.target.value)}
					/>
					<button
						type="button"
						onClick={handleSendCode}
						disabled={showConfirmationField || isEmailConfirmed}
						style={{ marginLeft: '0.5rem' }}
					>
						Отправить код
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
						/>
						<button
							type="button"
							onClick={handleVerify}
							style={{ marginLeft: '0.5rem' }}
							disabled={loading}
						>
							Подтвердить и сохранить
						</button>
					</div>
				)}

				{isEmailConfirmed && (
					<p style={{ color: 'green' }}>Email подтверждён и обновлён.</p>
				)}

				{error && (
					<p style={{ color: 'red', fontSize: '0.9rem', marginTop: '0.5rem' }}>{error}</p>
				)}

			</div>
		</div>
	)
}
