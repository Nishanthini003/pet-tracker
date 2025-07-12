import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import type { RootState } from '../../store';
import { fetchAllPetitions } from '../../services/api';
import { toast, Toaster } from 'react-hot-toast';
import { Layout, Menu, Select, Button, Card, Tag, message, Modal, Statistic, Row, Col, Badge, Input } from 'antd';
import {
  LogoutOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  FileDoneOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { FiUser } from 'react-icons/fi';
import axios from 'axios';

const { Header, Sider, Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

interface Petition {
  _id: string;
  title: string;
  description: string;
  status: 'new' | 'pending' | 'in_progress' | 'resolved' | 'rejected';
  category: string;
  createdAt: string;
  updatedAt: string;
  isUrgent?: boolean;
  isRepetitive?: boolean;
  submittedBy: string;
  address: string;
  contact: string;
}

const statusColors = {
  new: 'blue',
  pending: 'orange',
  in_progress: 'processing',
  resolved: 'success',
  rejected: 'error'
};

const statusIcons = {
  new: <FileDoneOutlined />,
  pending: <ClockCircleOutlined />,
  in_progress: <SyncOutlined spin />,
  resolved: <CheckCircleOutlined />,
  rejected: <CloseCircleOutlined />
};

const URGENT_KEYWORDS = ['urgent', 'emergency', 'immediate', 'serious', 'critical', 'asap'];
const SIMILARITY_THRESHOLD = 0.8;

const OfficerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [collapsed, setCollapsed] = useState(false);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [filteredPetitions, setFilteredPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [urgentPetitions, setUrgentPetitions] = useState<Petition[]>([]);
  const [repetitiveGroups, setRepetitiveGroups] = useState<Petition[][]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('new');

  useEffect(() => {
    fetchPetitions();
  }, []);

  useEffect(() => {
    if (user?.department && petitions.length > 0) {
      const deptPetitions = petitions.filter(
        (petition) => petition.category?.toLowerCase() === user.department?.toLowerCase()
      );
      setFilteredPetitions(deptPetitions);
      
      // Get unique urgent petitions
      const urgent = deptPetitions.filter(isUrgentPetition);
      const uniqueUrgent = Array.from(new Map(urgent.map(p => [p._id, p])).values());
      setUrgentPetitions(Array.from(uniqueUrgent));
      
      setRepetitiveGroups(groupSimilarPetitions(deptPetitions));
    }
  }, [user?.department, petitions]);

  const calculateSimilarity = (str1: string, str2: string): number => {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  };

  const isUrgentPetition = (petition: Petition): boolean => {
    if (petition.isUrgent) return true;
    const text = `${petition.title} ${petition.description}`.toLowerCase();
    return URGENT_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
  };

  const findSimilarPetitions = (petition: Petition, allPetitions: Petition[]): Petition[] => {
    return allPetitions.filter(p => {
      if (p._id === petition._id) return false;
      if (p.isRepetitive) return true;
      if (p.category !== petition.category) return false;
      const similarity = calculateSimilarity(p.title, petition.title);
      return similarity >= SIMILARITY_THRESHOLD;
    });
  };

  const groupSimilarPetitions = (petitions: Petition[]): Petition[][] => {
    const groups: Petition[][] = [];
    const processedIds = new Set<string>();

    petitions.forEach(petition => {
      if (processedIds.has(petition._id)) return;

      const similar = findSimilarPetitions(petition, petitions);
      if (similar.length > 0) {
        const group = [petition, ...similar];
        group.forEach(p => processedIds.add(p._id));
        groups.push(group);
      }
    });

    return groups;
  };

  const isRepetitive = (petition: Petition): boolean => {
    return repetitiveGroups.some(group => group.some(p => p._id === petition._id));
  };

  const getRepetitiveCount = (petition: Petition): number => {
    const group = repetitiveGroups.find(group => group.some(p => p._id === petition._id));
    return group ? group.length : 0;
  };

  const handleStatusSelect = (value) => {
    setSelectedStatus(value);
    if (value === 'rejected') {
      setShowRejectionModal(true);
    } else {
      handleStatusChange(selectedPetition?._id || '', value);
      setIsModalVisible(false);
    }
  };

  const handleRejectionConfirm = async () => {
    if (!rejectionReason.trim()) {
      message.error('Please enter a rejection reason');
      return;
    }
    await axios.post(`http://localhost:5000/api/petitions/${selectedPetition?._id}/comment`, {
      comment: rejectionReason
    });
    handleStatusChange(selectedPetition?._id || '', 'rejected', rejectionReason);
    setShowRejectionModal(false);
    setIsModalVisible(false);
    setRejectionReason('');
  };

  const handleRejectionCancel = () => {
    setShowRejectionModal(false);
    setSelectedStatus(selectedPetition?.status || 'new');
    setRejectionReason('');
  };

  useEffect(() => {
    if (user?.department && petitions.length > 0) {
      const deptPetitions = petitions.filter(
        (petition) => petition.category?.toLowerCase() === user.department?.toLowerCase()
      );
      setFilteredPetitions(deptPetitions);
      const urgent = deptPetitions.filter(isUrgentPetition);
      setUrgentPetitions(urgent);
      setRepetitiveGroups(groupSimilarPetitions(deptPetitions));
    }
  }, [user?.department, petitions]);

  const fetchPetitions = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPetitions();
      setPetitions(data);
      message.success('Petitions loaded successfully');
    } catch (error) {
      message.error('Failed to fetch petitions');
      console.error('Error fetching petitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (petitionId: string, newStatus: string, comment = '') => {
    try {
      const result = await axios.patch(`http://localhost:5000/api/petitions/${petitionId}/status`, {
        status: newStatus,
        userId: user?._id,
        comment
      });
      setPetitions(petitions.map(p => 
        p._id === result.data._id ? { ...p, status: result.data.status } : p
      ));
      fetchPetitions();
      if (result.status === 200) {
        toast.success('Status updated successfully');
      }
    } catch (error) {
      console.error('Status update failed:', error);
      toast.error('Failed to update status');
    }
  };

  const handleViewDetails = (petition: Petition) => {
    setSelectedPetition(petition);
    setSelectedStatus(petition.status);
    setIsModalVisible(true);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const getStatusCount = (status: string) => {
    return filteredPetitions.filter(p => p.status === status).length;
  };

  const renderDashboard = () => (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.name}!</h2>
        <p className="text-gray-600">Here's what's happening with your department petitions today.</p>
      </div>
      <Toaster
        position='top-center'
        reverseOrder={false}
      />
      <Row gutter={16} className="mb-8">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Petitions"
              value={filteredPetitions.length}
              prefix={<FileDoneOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Petitions"
              value={getStatusCount('in_progress') + getStatusCount('pending')}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Resolved"
              value={getStatusCount('resolved')}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Urgent"
              value={urgentPetitions.length}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Department Petitions</h2>
        <Tag color="blue">{filteredPetitions.length} petitions</Tag>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <SyncOutlined spin className="text-4xl text-blue-500" />
        </div>
      ) : filteredPetitions.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <FileDoneOutlined className="text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No petitions found</h3>
            <p className="text-gray-500">There are currently no petitions assigned to your department</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredPetitions.map((petition) => {
  const isUrgent = urgentPetitions.some(p => p._id === petition._id);
  const repeatCount = getRepetitiveCount(petition);
  
  return (
    <Card key={petition._id} className="hover:shadow-lg transition-shadow" onClick={() => handleViewDetails(petition)}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-800">{petition.title}</h3>
            {isUrgent && (
              <Tag icon={<ExclamationCircleOutlined />} color="red">Urgent</Tag>
            )}
            {repeatCount > 0 && (
              <Tag icon={<HistoryOutlined />} color="purple">
                Repeats: ×{repeatCount}
              </Tag>
            )}
          </div>
          <p className="text-gray-600 mt-1 line-clamp-2">{petition.description}</p>
                  <div className="mt-3 flex items-center space-x-4">
                    <Tag icon={statusIcons[petition.status]} color={statusColors[petition.status]}>
                      {petition.status.replace('_', ' ')}
                    </Tag>
                    <span className="text-sm text-gray-500">
                      Received: {new Date(petition.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className='text-sm text-gray-500 bg-slate-200 px-2 rounded'>
                  {petition.status}
                </span>
        </div>
          </Card>
  );
})}
        </div>
      )}
    </>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        <Tag color="blue">{urgentPetitions.length + repetitiveGroups.length} alerts</Tag>
      </div>

      <Card title={
  <div className="flex items-center">
    <ExclamationCircleOutlined className="text-red-500 mr-2" />
    <span>Urgent Petitions ({urgentPetitions.length})</span>
  </div>
} className="mb-6">
  {urgentPetitions.length === 0 ? (
    <div className="text-center py-4 text-gray-500">No urgent petitions</div>
  ) : (
    <div className="space-y-4">
      {urgentPetitions.map(petition => {
        const repeatCount = getRepetitiveCount(petition);
        return (
          <div key={petition._id} className="border-l-4 border-red-500 pl-4 py-2">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">{petition.title}</h4>
                <p className="text-gray-600 text-sm line-clamp-1">{petition.description}</p>
                
                <div className="mt-1">
                  <Tag color={statusColors[petition.status]}>
                    {petition.status.replace('_', ' ')}
                  </Tag>
                  
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(petition.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <Button size="small" onClick={() => handleViewDetails(petition)}>
                View
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  )}
</Card>

      <Card title={
        <div className="flex items-center">
          <HistoryOutlined className="text-purple-500 mr-2" />
          <span>Repetitive Petitions ({repetitiveGroups.length})</span>
        </div>
      }>
        {repetitiveGroups.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No repetitive petitions</div>
        ) : (
          <div className="space-y-4">
            {repetitiveGroups.map((group, index) => {
              const mainPetition = group[0];
              return (
                <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{mainPetition.title}</h4>
                      <p className="text-gray-600 text-sm line-clamp-1">{mainPetition.description}</p>
                      <div className="mt-1">
                        <Tag color={statusColors[mainPetition.status]}>
                          {mainPetition.status.replace('_', ' ')}
                        </Tag>
                        <Tag color="purple">Repeats: ×{group.length}</Tag>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(mainPetition.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button size="small" onClick={() => handleViewDetails(mainPetition)}>
                      View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        theme="light"
      >
        <div className="p-4 flex items-center justify-center">
          <h1 className="text-xl font-bold text-blue-600">
            {collapsed ? 'PD' : 'Petition Dashboard'}
          </h1>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[activeTab]}
          onSelect={({ key }) => setActiveTab(key)}
          items={[
            {
              key: 'dashboard',
              icon: <FileDoneOutlined />,
              label: 'Dashboard',
            },
            {
              key: 'notifications',
              icon: (
                <Badge count={urgentPetitions.length + repetitiveGroups.length} size="small">
                  <BellOutlined />
                </Badge>
              ),
              label: 'Notifications',
            },
          ]}
        />
      </Sider>

      <Layout>
        <Header className="bg-white shadow-sm p-0">
          <div className="flex justify-between h-full px-6">
            <div className="flex space-x-4 items-center">
              {
                user?.photo ? <img src={user?.photo} alt={user?.name} className='w-8 h-8 rounded-full' /> : <FiUser className='size-8' />
              }
              <div>
                <div className='flex items-center'>
                  <h1 className="font-semibold">{user?.name || user?.email}</h1>
                  <p className="text-xs text-gray-500 ml-10">
                  {user?.department} Department
                </p>
                </div>
              </div>
            </div>
            <Button
              className='mt-2'
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              {!collapsed && 'Logout'}
            </Button>
          </div>
        </Header>

        <Content className="p-6 bg-gray-50">
          {activeTab === 'dashboard' ? renderDashboard() : renderNotifications()}
        </Content>
      </Layout>

      {/* Rejection Reason Modal */}
      <Modal
        title="Rejection Reason"
        open={showRejectionModal}
        onOk={handleRejectionConfirm}
        onCancel={handleRejectionCancel}
        okText="Confirm Rejection"
        cancelText="Cancel"
      >
        <p>Please provide a reason for rejecting this petition:</p>
        <Input.TextArea
          rows={4}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter the reason for rejection..."
        />
      </Modal>

      {/* Petition Detail Modal */}
      <Modal
        title="Petition Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedPetition && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900 text-lg">{selectedPetition.title}</h4>
                <div className="mt-2 flex items-center space-x-2">
                  <Tag icon={statusIcons[selectedPetition.status]} color={statusColors[selectedPetition.status]}>
                    {selectedPetition.status.replace('_', ' ')}
                  </Tag>
                  {urgentPetitions.some(p => p._id === selectedPetition._id) && (
                    <Tag icon={<ExclamationCircleOutlined />} color="red">Urgent</Tag>
                  )}
                  {getRepetitiveCount(selectedPetition) > 0 && (
            <Tag icon={<HistoryOutlined />} color="purple">
              Repeats: ×{getRepetitiveCount(selectedPetition)}
            </Tag>
          )}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <div>Created: {new Date(selectedPetition.createdAt).toLocaleString()}</div>
                <div>Updated: {new Date(selectedPetition.updatedAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="whitespace-pre-line">{selectedPetition.description}</p>
              <p className="text-gray-600 text-sm line-clamp-1 mt-2">{selectedPetition.submittedBy}</p>
              <p className="text-gray-600 text-sm line-clamp-1">{selectedPetition.address}</p>
              <p className="text-gray-600 text-sm line-clamp-1">{selectedPetition.contact}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Category</h4>
                <p>{selectedPetition.category}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Status</h4>
                <Select
                  style={{ width: '100%' }}
                  value={selectedStatus}
                  onChange={handleStatusSelect}
                >
                  <Option value="new">New</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="resolved">Resolved</Option>
                  <Option value="rejected">Rejected</Option>
                </Select>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default OfficerDashboard;