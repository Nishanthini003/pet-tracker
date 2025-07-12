import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axios from 'axios';
import Reason from '../components/dashboard/Reason';

interface Comment {
  text: string
}

interface Petition {
  _id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  category: string;
  priority: string;
  address: string;
  comments: Comment[]
}

function PetitionsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [petitionsList, setPetitionsList] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPetitions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/petitions/user/${user?._id}`);
      console.log(response.data);
      
      if (response.data) {
        setPetitionsList(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.length || 0,
        }));
      }
      setError('');
    } catch (err: any) {
      console.error('Petitions fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load petitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetitions();
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePetitionClick = (petition: Petition) => {
    setSelectedPetition(petition);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPetition(null);
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
        <div className="text-red-600 font-medium">{error}</div>
        <button
          onClick={fetchPetitions}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Petitions List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Petitions
            <span className="ml-2 text-sm text-gray-500">
              (Total: {pagination.total})
            </span>
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {petitionsList.length === 0 ? (
            <div className="px-6 py-4 text-center text-gray-500">
              No petitions found.
            </div>
          ) : (
            petitionsList.map((petition) => (
              <div 
                key={petition._id} 
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handlePetitionClick(petition)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {petition.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {petition.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(petition.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                        {petition.category}
                      </span>
                      {
                        petition.status === 'rejected' && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                            Reason : <span className="text-red-800">{petition?.comments[0]?.text || "reason not mentioned"}</span>
                          </span>
                        )
                      }
                    </div>
                  </div>
                  <span
                    className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      petition.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : petition.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {petition.status.replace('_', ' ').charAt(0).toUpperCase() +
                      petition.status.replace('_', ' ').slice(1)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} petitions
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Petition Details Modal */}
      {isModalOpen && selectedPetition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedPetition.title}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedPetition.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Address</h4>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedPetition.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <span
                      className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedPetition.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : selectedPetition.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedPetition.status.replace('_', ' ').charAt(0).toUpperCase() +
                        selectedPetition.status.replace('_', ' ').slice(1)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Category</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedPetition.category}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedPetition.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PetitionsPage;