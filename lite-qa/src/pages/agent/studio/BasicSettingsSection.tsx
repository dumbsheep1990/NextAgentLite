import React from 'react';
import { Select, Switch, Input, InputNumber, Slider, Typography, Divider, Alert, Tag } from 'antd';
import type { OutputMode } from '../../../components/studio/StreamContentRenderer';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

export interface BasicSettingsProps {
  // 元数据开关移动到"高级配置"，此处保留可选占位以兼容历史调用
  useMetadata?: boolean;
  setUseMetadata?: (v: boolean) => void;
  hideMetadata?: boolean;
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  // 以下参数已废弃，保留仅为向后兼容
  /** @deprecated 不再在基础配置中显示，已移至后端默认配置 */
  simThreshold?: number;
  /** @deprecated 不再在基础配置中显示，已移至后端默认配置 */
  setSimThreshold?: (v: number) => void;
  /** @deprecated 不再在基础配置中显示，已移至后端默认配置 */
  simWeight?: number;
  /** @deprecated 不再在基础配置中显示，已移至后端默认配置 */
  setSimWeight?: (v: number) => void;
  /** @deprecated 不再在基础配置中显示，已移至后端默认配置 */
  topN?: number;
  /** @deprecated 不再在基础配置中显示，已移至后端默认配置 */
  setTopN?: (v: number) => void;
  multiTurn: boolean;
  setMultiTurn: (v: boolean) => void;
  maxRounds: number;
  setMaxRounds: (v: number) => void;
  reasoning: boolean;
  setReasoning: (v: boolean) => void;
  agentName: string;
  setAgentName: (v: string) => void;
  agentDesc: string;
  setAgentDesc: (v: string) => void;
  greeting: string;
  setGreeting: (v: string) => void;
  emptyReply: string;
  setEmptyReply: (v: string) => void;
  // 输出模式
  outputMode?: OutputMode;
  setOutputMode?: (v: OutputMode) => void;
}

const BasicSettingsSection: React.FC<BasicSettingsProps> = (props) => {
  const {
    useMetadata,
    setUseMetadata,
    hideMetadata,
    multiTurn,
    setMultiTurn,
    maxRounds,
    setMaxRounds,
    reasoning,
    setReasoning,
    agentName,
    setAgentName,
    agentDesc,
    setAgentDesc,
    greeting,
    setGreeting,
    emptyReply,
    setEmptyReply,
    outputMode,
    setOutputMode,
  } = props;

  return (
    <div>
      <div className="studio-section settings-group-basic">
        <div className="section-header">
          <span>助手基本信息</span>
          <span className="req-pill">必填</span>
        </div>

        <div className="agent-profile-area">
          <div className="basic-info-fields" style={{ width: '100%' }}>
            <div className="field-group">
              <Text type="secondary" className="setting-label">
                助手名称 *
              </Text>
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="为您的助手起个名字"
                size="large"
                className="styled-input"
              />
            </div>

            <div className="field-group">
              <Text type="secondary" className="setting-label">
                助手描述
              </Text>
              <TextArea
                rows={3}
                value={agentDesc}
                onChange={(e) => setAgentDesc(e.target.value)}
                placeholder="简要描述助手的功能特点..."
                className="styled-textarea"
              />
            </div>

            <div className="field-group">
              <Text type="secondary" className="setting-label">
                开场白
              </Text>
              <TextArea
                rows={2}
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="设置助手的欢迎语..."
                className="styled-textarea"
              />
            </div>

            <div className="field-group">
              <Text type="secondary" className="setting-label">
                空回复处理
              </Text>
              <TextArea
                rows={2}
                value={emptyReply}
                onChange={(e) => setEmptyReply(e.target.value)}
                placeholder="当助手无法回答时的提示语..."
                className="styled-textarea"
              />
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div className="field-group">
              <Text type="secondary" className="setting-label">
                输出模式
              </Text>
              <Select
                value={outputMode || 'markdown'}
                onChange={(value) => setOutputMode && setOutputMode(value)}
                style={{ width: '100%' }}
                size="large"
              >
                <Option value="markdown">
                  <Tag color="blue">Markdown</Tag>
                </Option>
                <Option value="html">
                  <Tag color="orange">HTML</Tag>
                </Option>
                <Option value="mixed">
                  <Tag color="green">混合模式（智能识别）</Tag>
                </Option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {!hideMetadata && (
        <div className="studio-section settings-group-knowledge">
          <Text type="secondary" className="setting-label">
            元数据
          </Text>
          <Select
            value={useMetadata ? 'enable' : 'disable'}
            onChange={(v) => setUseMetadata && setUseMetadata(v === 'enable')}
            style={{ width: '100%', marginTop: 8, borderRadius: 8 }}
            size="large"
          >
            <Option value="disable">禁用</Option>
            <Option value="enable">启用</Option>
          </Select>
        </div>
      )}

      <div className="studio-section settings-group-advanced">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text className="setting-label" style={{ margin: 0 }}>
            多轮对话优化
          </Text>
          <Switch checked={multiTurn} onChange={setMultiTurn} />
        </div>
        {multiTurn && (
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 12 }}>
            <Text className="setting-label" style={{ margin: 0 }}>
              最大轮数
            </Text>
            <Slider
              min={1}
              max={30}
              step={1}
              value={maxRounds}
              onChange={(v) => setMaxRounds(Number(v))}
              style={{ flex: 1 }}
            />
            <InputNumber
              min={1}
              max={50}
              step={1}
              value={maxRounds}
              onChange={(v) => setMaxRounds(Number(v))}
              style={{ borderRadius: 6 }}
            />
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          <Text className="setting-label" style={{ margin: 0 }}>
            推理
          </Text>
          <Switch checked={reasoning} onChange={setReasoning} />
        </div>
      </div>
    </div>
  );
};

export default BasicSettingsSection;
