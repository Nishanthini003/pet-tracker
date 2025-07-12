import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signup, clearError } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store';
import axios from 'axios';
export const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, user, token } = useSelector((state: RootState) => state.auth);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phoneNumber: ''
  });
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);

  useEffect(() => {
    if (user && token) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, token, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSignup = async (data: { email: string; password: string }) => {
    dispatch(signup(data));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowOtpField(true);
    const response = await axios.post('http://localhost:5000/api/auth/otp-send', {
      phoneNumber: formData.phoneNumber
    });
    console.log(response);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) {
      alert('Please enter a 4-digit OTP');
      return;
    }
    const response = await axios.post('http://localhost:5000/api/auth/otp-verify', {
      phoneNumber: formData.phoneNumber,
      otp
    });
    if(response.data.status === 'success') {
      handleSignup(formData);
    }else{
      alert('Invalid OTP');
    }
  };

  const handleResendOtp = () => {
    setOtp('');
    alert('OTP resent!');
  };

  if (user && token) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showOtpField ? 'Verify Your Phone' : 'Create your account'}
          </h2>
          {showOtpField && (
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent a verification code to your phone
            </p>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!showOtpField ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="sr-only">Phone Number</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  autoComplete="phone-number"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div>
              <button
                type='submit'
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'sending otp...' : 'send otp'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="flex justify-center space-x-2">
              {[...Array(4)].map((_, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={otp[i] || ''}
                  onChange={(e) => {
                    if (/^[0-9]$/.test(e.target.value) || e.target.value === '') {
                      const newOtp = otp.split('');
                      newOtp[i] = e.target.value;
                      setOtp(newOtp.join(''));
                      if (e.target.value && i < 3) {
                        document.getElementById(`otp-${i+1}`)?.focus();
                      }
                    }
                  }}
                  id={`otp-${i}`}
                  className="w-12 h-12 text-center text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>

            <div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 4}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading || otp.length !== 4 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Verifying...' : 'Verify & Complete Signup'}
              </button>
            </div>
            
            <div className="text-center">
              <button
                onClick={handleResendOtp}
                disabled={loading}
                className="font-medium text-blue-600 hover:text-blue-500 text-sm"
              >
                Didn't receive code? Resend OTP
              </button>
            </div>
          </div>
        )}

        {!showOtpField && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};