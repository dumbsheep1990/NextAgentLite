import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Typography, Space, Badge } from 'antd';
import { HolderOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface SortableItemProps {
  id: string;
  order: number;
  title: string;
  enabled: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  order,
  title,
  enabled,
  icon,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !enabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: 8,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="small"
        style={{
          border: enabled ? '1px solid #d9d9d9' : '1px solid #f0f0f0',
          backgroundColor: enabled ? '#ffffff' : '#fafafa',
        }}
        bodyStyle={{ padding: '0' }}
        title={
          <div
            {...(enabled ? attributes : {})}
            {...(enabled ? listeners : {})}
            style={{
              cursor: enabled ? 'grab' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              touchAction: enabled ? 'none' : 'auto',
            }}
          >
            <Space>
              {enabled && (
                <HolderOutlined style={{ fontSize: 16, color: '#8c8c8c' }} />
              )}
              <Badge count={order} style={{ backgroundColor: enabled ? '#1677ff' : '#d9d9d9' }} />
              {icon}
              <Text strong style={{ color: enabled ? '#000' : '#8c8c8c' }}>
                {title}
              </Text>
            </Space>
          </div>
        }
      >
        {children}
      </Card>
    </div>
  );
};

export default SortableItem;
