import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { petitions } from '../../services/api';
import AddPetitionForm from '../../components/petitions/AddPetitionForm';
import axios from 'axios';

interface StatCard {
  name: string;
  value: number;
}

interface Petition {
  _id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  category: string;
  priority: string;
}

interface ApiResponse {
  success: boolean;
  count?: number;
  total?: number;
  data: Petition[];
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

export const Dashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddPetition, setShowAddPetition] = useState(false);
  const [petitionsList, setPetitionsList] = useState<Petition[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse>(`http://localhost:5000/api/petitions/user/${user?._id}`);
      
      // Access the data property from the response
      const responseData = response.data.data || [];
      setPetitionsList(responseData);
      
      // Calculate stats based on the response data
      const total = response.data.total || responseData.length;
      const active = responseData.filter(p => p.status === 'pending' || p.status === 'in_progress').length;
      const resolved = responseData.filter(p => p.status === 'resolved').length;
      
      setStats([
        { name: 'Total Petitions', value: total },
        { name: 'Active Petitions', value: active },
        { name: 'Resolved Petitions', value: resolved }
      ]);
      
      setError('');
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchDashboardData();
    }
  }, [user?._id]);

  const handlePetitionSuccess = () => {
    setShowAddPetition(false);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg">
        <div className="text-blue-600 font-medium">{error}</div>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            {user ? (
              <>
                <h2 className="text-2xl font-bold">
                  Welcome back, {user.name}!
                </h2>
                <p className="mt-2 opacity-90">
                  Here's an overview of your {petitionsList.length} petitions
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold">Welcome!</h2>
                <p className="mt-2 opacity-90">
                  Please sign in to manage your petitions
                </p>
              </>
            )}
          </div>
          {user && (
            <button
              onClick={() => setShowAddPetition(true)}
              className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white font-medium"
            >
              Add Petition
            </button>
          )}
        </div>
      </div>

      {/* Add Petition Modal */}
      {showAddPetition && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Petition</h3>
            <AddPetitionForm
              onSuccess={handlePetitionSuccess}
              onCancel={() => setShowAddPetition(false)}
            />
          </div>
        </div>
      )}

      {/* Stats grid - only shown for authenticated users */}
      {user && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">{stat.name}</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Petitions list */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Recent Petitions</h3>
            {petitionsList.length > 0 ? (
              <div className="space-y-4">
                {petitionsList.slice(0, 5).map((petition) => (
                  <div key={petition._id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{petition.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{petition.category}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        petition.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        petition.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {petition.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{petition.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">You haven't created any petitions yet.</p>
            )}
          </div>
        </>
      )}

      {/* Guest message */}
      {!user && (
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-2">Get Started</h3>
          <p className="text-gray-600 mb-4">
            Sign in to create and manage your petitions
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;