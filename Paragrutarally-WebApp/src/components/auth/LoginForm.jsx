import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase/firebase';

const LoginForm = ({ onError }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect will be handled by router/auth context
        } catch (err) {
            const errorMessage = 'Failed to log in. Please check your credentials.';
            setError(errorMessage);
            if (onError) onError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-form-container">
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                <p>
                    <a href="/reset-password">Forgot password?</a>
                </p>
            </form>
        </div>
    );
};

export default LoginForm;