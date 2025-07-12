import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface Petition {
  _id: string;
  title: string;
  description: string;
  creator: {
    mobile: string;
    name?: string;
  };
  status: string;
  priority: string;
  createdAt: string;
  category: string;
}

interface PetitionTableProps {
  petitions: Petition[];
  onStatusChange: (id: string, status: string) => void;
  showReceiveButton?: boolean;
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-purple-100 text-purple-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const PetitionTable: React.FC<PetitionTableProps> = ({
  petitions,
  onStatusChange,
  showReceiveButton = false
}) => {
  return (
    <div className="mt-4 flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Title & Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Priority
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {petitions.map((petition) => (
                  <tr key={petition._id}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{petition.title}</div>
                        <div className="text-sm text-gray-500">{petition.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          By: {petition.creator.name || petition.creator.mobile}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{petition.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          petition.status
                        )}`}
                      >
                        {petition.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(
                          petition.priority
                        )}`}
                      >
                        {petition.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(petition.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {showReceiveButton && petition.status === 'new' && (
                        <button
                          onClick={() => onStatusChange(petition._id, 'received')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Receive
                        </button>
                      )}
                      {petition.status !== 'new' && petition.status !== 'resolved' && (
                        <select
                          value={petition.status}
                          onChange={(e) => onStatusChange(petition._id, e.target.value)}
                          className="text-sm border-gray-300 rounded-md"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      )}
                      <Link
                        to={`/petitions/${petition._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
