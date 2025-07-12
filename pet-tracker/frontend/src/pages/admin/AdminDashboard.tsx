import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import axios from 'axios';
import type { RootState } from '../../store';
import { FiLogOut, FiUser, FiHome, FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronRight, FiFolder } from 'react-icons/fi';
import { Modal, Button, Input, Select, message, Card, Tag, Divider, Empty, Tooltip } from 'antd';
import { exportToCsv } from '../../utils/exportToCsv';
import { FiDownload } from 'react-icons/fi';
const { Option } = Select;

interface Officer {
  _id: string;
  email: string;
  name: string;
  badgeNumber: string;
  department: string;
  position: string;
  contactNumber: string;
  isActive: boolean;
  photo?: string;
}

interface Petition {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [filteredOfficers, setFilteredOfficers] = useState<Officer[]>([]);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    badgeNumber: '',
    department: '',
    position: '',
    contactNumber: ''
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const departments = [
    'Environment', 'Justice', 'Health', 'Education', 'Housing',
    'Transportation', 'Labor', 'Energy', 'Agriculture', 'Finance',
    'Public Safety', 'Social Welfare', 'Water', 'Communications', 
    'Consumer'
  ];

  const handleLogout = () => {
    dispatch(logout());
  };

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get<ApiResponse>('http://localhost:5000/api/department/');
      
      if (response.data.status === 'success' && Array.isArray(response.data.data.officers)) {
        setOfficers(response.data.data.officers);
        setFilteredOfficers(response.data.data.officers);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Error fetching officers:', err);
      setError('Failed to fetch officers');
      message.error('Failed to fetch officers. Please try again later.');
      setOfficers([]);
      setFilteredOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPetitionsByDepartment = async (department: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/petitions/admin/`, {
        params: { department } // Send as query parameter
      });
      
      setPetitions(response.data.data);
      setSelectedDepartment(department);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch petitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  useEffect(() => {
    const filtered = officers.filter(officer =>
      officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOfficers(filtered);
  }, [searchTerm, officers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const showModal = (officer: Officer | null = null) => {
    if (officer) {
      setCurrentOfficer(officer);
      setFormData({
        email: officer.email,
        password: '',
        name: officer.name,
        badgeNumber: officer.badgeNumber,
        department: officer.department,
        position: officer.position,
        contactNumber: officer.contactNumber
      });
    } else {
      setCurrentOfficer(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        badgeNumber: '',
        department: '',
        position: '',
        contactNumber: ''
      });
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

// Add this to your AdminDashboard component
const handleExportPetitions = () => {
  if (petitions.length === 0) {
    alert('No petitions to export');
    return;
  }

  // Transform the data if needed (simplify nested objects)
  const simplifiedPetitions = petitions.map(petition => ({
    ID: petition._id,
    Title: petition.title,
    Description: petition.description,
    Status: petition.status,
    'Created At': new Date(petition.createdAt).toLocaleString(),
    Department: selectedDepartment || 'All Departments'
  }));

  exportToCsv(`petitions_${selectedDepartment || 'all'}`, simplifiedPetitions);
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setFormData(prev => ({ ...prev, department: value }));
  };

  const handleSubmit = async () => {
    try {
      if (currentOfficer) {
        // Update existing officer
        await axios.patch(`http://localhost:5000/api/department/${currentOfficer._id}`, formData);
        message.success('Officer updated successfully');
      } else {
        // Create new officer
        await axios.post('http://localhost:5000/api/department/', formData);
        message.success('Officer created successfully');
      }
      fetchOfficers();
      setIsModalVisible(false);
    } catch (err) {
      message.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/department/${id}`);
      message.success('Officer deleted successfully');
      fetchOfficers();
    } catch (err) {
      message.error('Failed to delete officer');
    }
  };

  const backToDepartments = () => {
    setSelectedDepartment(null);
    setPetitions([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'reviewed': return 'blue';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-indigo-700 text-white">
          <div className="flex items-center justify-center h-16 px-4 bg-indigo-800">
            <h1 className="text-xl font-bold">Admin Portal</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            <a href="#" className="flex items-center px-4 py-2 text-white bg-indigo-800 rounded-lg">
              <FiHome className="mr-3" />
              Dashboard
            </a>
            
          </nav>
          <div className="p-4 border-t border-indigo-600">
            <div className="flex items-center">
              <div className="mr-3">
                <FiUser className="w-8 h-8 text-indigo-200" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <button 
                  onClick={handleLogout}
                  className="text-xs text-indigo-200 hover:text-white flex items-center"
                >
                  <FiLogOut className="mr-1" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-800">
              {selectedDepartment ? (
                <div className="flex items-center">
                  <button 
                    onClick={backToDepartments}
                    className="text-indigo-600 hover:text-indigo-800 mr-2"
                  >
                    Departments
                  </button>
                  <FiChevronRight className="mx-2 text-gray-400" />
                  <span>{selectedDepartment}</span>
                </div>
              ) : 'Department Management'}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  placeholder="Search officers..."
                  prefix={<FiSearch className="text-gray-400" />}
                  className="w-64"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <Button
                type="primary"
                icon={<FiPlus />}
                onClick={() => showModal()}
              >
                Add Officer
              </Button>
              <div className="relative">
                <FiUser className="w-6 h-6" />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {selectedDepartment ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Petitions in {selectedDepartment}
                </h2>
                <div className="flex space-x-2">
                <Tooltip 
                  title="Export all petitions to CSV file" 
                  placement="top" 
                  arrow={{ pointAtCenter: true }}
                >                   
                  <Button onClick={() => handleExportPetitions()}>
                    <FiDownload className="mr-2" /> Export CSV
                  </Button>
                </Tooltip>
              </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Loading petitions...</p>
                </div>
              ) : petitions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {petitions.map(petition => (
                    <Card key={petition._id} className="hover:shadow-md transition-shadow">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium">{petition.title}</h3>
                          <p className="text-gray-600 mt-1">{petition.description}</p>
                          <div className="mt-2 flex items-center">
                            <Tag color={getStatusColor(petition.status)}>
                              {petition.status.toUpperCase()}
                            </Tag>
                            
                          </div>
                        </div>
                        
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty
                  description={
                    <span className="text-gray-500">
                      No petitions found for this department
                    </span>
                  }
                  className="flex flex-col items-center justify-center h-64"
                />
              )}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">All Departments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map(department => {
                    const officerCount = officers.filter(o => o.department === department).length;
                    return (
                      <Card
                        key={department}
                        hoverable
                        onClick={() => fetchPetitionsByDepartment(department)}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center">
                          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                            <FiFolder className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">{department}</h3>
                            <p className="text-sm text-gray-500">
                              {officerCount} {officerCount === 1 ? 'officer' : 'officers'}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Divider />

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Officers Management</h3>
                </div>
                {loading ? (
                  <div className="p-6 text-center">
                    <p>Loading officers...</p>
                  </div>
                ) : error ? (
                  <div className="p-6 text-center text-red-500">
                    {error}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Officer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOfficers.map((officer) => (
                          <tr key={officer._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full" src={officer.photo || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTo0vRipjHMf43IZOUDNl-pnZl5gTiNnCSHcQ&s'} alt="" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{officer.name}</div>
                                  <div className="text-sm text-gray-500">{officer.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{officer.department}</div>
                              <div className="text-sm text-gray-500">{officer.position}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${officer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {officer.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => showModal(officer)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <FiEdit2 className="inline mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(officer._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 className="inline mr-1" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Officer Form Modal */}
      <Modal
        title={currentOfficer ? "Edit Officer" : "Add New Officer"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText={currentOfficer ? "Update" : "Create"}
        cancelText="Cancel"
        width={700}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Officer Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Officer Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Number</label>
            <Input
              name="badgeNumber"
              value={formData.badgeNumber}
              onChange={handleInputChange}
              placeholder="Badge Number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <Select
              className="w-full"
              value={formData.department}
              onChange={handleDepartmentChange}
              placeholder="Select Department"
            >
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <Input
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="Position/Rank"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <Input
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              placeholder="Contact Number"
            />
          </div>
          {!currentOfficer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input.Password
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;