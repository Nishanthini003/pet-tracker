import { useEffect } from 'react';
import { OfficerAuthForm } from '../../components/auth/OfficerAuthForm'
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { officerLogin, clearError } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store';

export const OfficerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, user, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user && token && user.role === 'department_officer') {
      navigate('/officer/dashboard', { replace: true });
    }
  }, [user, token, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleOfficerLogin = async (data: { email: string; badgeNumber: string; password: string }) => {
    dispatch(officerLogin(data));
  };

  if (user && token) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Officer Login
          </h2>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <OfficerAuthForm onSubmit={handleOfficerLogin} disabled={loading} />
      </div>
    </div>
  );
};