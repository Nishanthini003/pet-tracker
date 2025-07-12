import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import type { RootState } from '../../store';

export const OfficerProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/officer/login');
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-4">
        <div className="bg-blue-500 rounded-full p-3">
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
          <p className="text-gray-600">Department Officer</p>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Department</p>
            <p className="mt-1 text-sm text-gray-900">{user?.department}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Mobile</p>
            <p className="mt-1 text-sm text-gray-900">{user?.mobile}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
