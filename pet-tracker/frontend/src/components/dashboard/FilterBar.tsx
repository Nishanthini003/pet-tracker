import React from 'react';

interface FilterBarProps {
  filters: {
    status: string;
    priority: string;
    sortBy: string;
    search: string;
  };
  onFilterChange: (name: string, value: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          value={filters.priority}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div>
        <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
          Sort By
        </label>
        <select
          id="sortBy"
          name="sortBy"
          value={filters.sortBy}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="createdAt">Submission Date</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
        </select>
      </div>

      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">
          Search
        </label>
        <input
          type="text"
          name="search"
          id="search"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          placeholder="Search petitions..."
        />
      </div>
    </div>
  );
};
