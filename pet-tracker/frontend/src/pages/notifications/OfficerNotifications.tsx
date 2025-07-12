import React from 'react';
import { Card, Tag, Button, Badge, Tooltip } from 'antd';
import {
  ExclamationCircleOutlined,
  HistoryOutlined,
  BellOutlined
} from '@ant-design/icons';

interface Petition {
  _id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  count?: number;
}

interface NotificationsProps {
  urgentPetitions: Petition[];
  repetitivePetitions: Petition[];
  onViewDetails: (petition: Petition) => void;
}

const OfficerNotifications: React.FC<NotificationsProps> = ({
  urgentPetitions,
  repetitivePetitions,
  onViewDetails
}) => {
  // Enhanced grouping function that properly handles duplicates
  const groupedRepetitivePetitions = repetitivePetitions.reduce((acc, petition) => {
    // Normalize the title for comparison (trim whitespace and lowercase)
    const normalizedTitle = petition.title.trim().toLowerCase();
    
    // Check if we already have this petition (case-insensitive)
    const existingIndex = acc.findIndex(p => 
      p.title.trim().toLowerCase() === normalizedTitle
    );

    if (existingIndex >= 0) {
      // Petition exists - increment count and update most recent data
      const existing = acc[existingIndex];
      existing.count = (existing.count || 1) + 1;
      
      // Keep data from the most recent petition
      if (new Date(petition.createdAt) > new Date(existing.createdAt)) {
        existing._id = petition._id;
        existing.description = petition.description;
        existing.createdAt = petition.createdAt;
        existing.updatedAt = petition.updatedAt;
      }
    } else {
      // New petition - add to array with count = 1
      acc.push({ ...petition, count: 1 });
    }
    return acc;
  }, [] as Petition[]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        <Tag color="blue">
          <Badge count={urgentPetitions.length + groupedRepetitivePetitions.length} size="small">
            <BellOutlined className="mr-1" />
            Alerts
          </Badge>
        </Tag>
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
            {urgentPetitions.map(petition => (
              <div key={petition._id} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{petition.title}</h4>
                    <p className="text-gray-600 text-sm line-clamp-1">{petition.description}</p>
                    <div className="mt-1">
                      <Tag color="red">Urgent</Tag>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(petition.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button size="small" onClick={() => onViewDetails(petition)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={
        <div className="flex items-center">
          <HistoryOutlined className="text-purple-500 mr-2" />
          <span>Repetitive Petitions ({groupedRepetitivePetitions.length})</span>
        </div>
      }>
        {groupedRepetitivePetitions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No repetitive petitions</div>
        ) : (
          <div className="space-y-4">
            {groupedRepetitivePetitions.map(petition => (
              <div key={petition._id} className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium">{petition.title}</h4>
                      {petition.count && petition.count > 1 && (
                        <Tooltip title={`${petition.count} similar petitions`}>
                          <Tag color="magenta" className="ml-2 cursor-default">
                            x{petition.count+ 10}
                          </Tag>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-1">{petition.description}</p>
                    <div className="mt-1">
                      <Tag color="purple">Repetitive</Tag>
                      <span className="text-xs text-gray-500 ml-2">
                        Last submitted: {new Date(petition.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button size="small" onClick={() => onViewDetails(petition)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default OfficerNotifications;