import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading, setToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      setToken(tokenFromUrl);
    }
  }, [setToken]);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    } else if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  return <div>Processing authentication...</div>;
};

export default AuthCallback;