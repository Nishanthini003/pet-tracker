import { useEffect } from 'react';
import { AuthForm } from '../../components/auth/AuthForm';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, user, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Redirect based on user role
    if (user && token) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });

      }else if(user.role === 'department_officer') {
        navigate('/officer/dashboard', { replace: true });
      }else {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [user, token, navigate, location]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleLogin = async (data: { email: string; password: string }) => {
    dispatch(login(data));
  };

  if (user && token) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <h2 className="text-lg font-bold text-gray-900 mb-8 absolute top-4 left-4">Petition Tracking system</h2>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <AuthForm isLogin={true} onSubmit={handleLogin} disabled={loading} />
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up here
            </Link>
            
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            If you are an officer ?{' '}
            <Link to="/officer/login" className="font-medium text-blue-600 hover:text-blue-500">
               login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
