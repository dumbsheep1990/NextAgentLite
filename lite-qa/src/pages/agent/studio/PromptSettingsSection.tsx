import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Input, Tag, Button, Space, Card, Alert, message, Segmented, Tooltip, Divider, Row, Col } from 'antd';
import { renderPromptPreview, wsGeneratePrompt, autoGeneratePrompt } from '../../../services/promptService';

const { Text } = Typography;
const { TextArea } = Input;

interface PromptSettingsProps {
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  selectedTools: string[];
  resources: { knowledge_collection?: { collection_id?: string }, cross_collections?: string[] };
  simThreshold?: number;
}

const PromptSettingsSection: React.FC<PromptSettingsProps> = ({ systemPrompt, setSystemPrompt, selectedTools, resources, simThreshold }) => {
  const hasKB = !!(resources?.knowledge_collection?.collection_id);
  const hasTools = (selectedTools || []).length > 0;
  const [preview, setPreview] = useState<{ final_prompt: string; injections: { knowledge_preview: string; tools_exec_preview: string } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState('');
  const [keywords, setKeywords] = useState('');
  const [genText, setGenText] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [mode, setMode] = useState<'combined'|'annotated'>('combined');

  const tokenEstimate = useMemo(() => {
    const txt = preview?.final_prompt || '';
    // 粗略估算：中文/英文混合，约 3.5 chars ~ 1 token
    return Math.max(1, Math.ceil(txt.length / 3.5));
  }, [preview]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const data = await renderPromptPreview({
          prompt_text: systemPrompt || '',
          question: '（预览示例问题）请回答：该智能体的职责是什么？',
          selected_tools: selectedTools || [],
          resources,
          top_n: 5,
          sim_threshold: simThreshold,
        });
        setPreview(data);
      } catch (e) {
        setPreview(null);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemPrompt, JSON.stringify(selectedTools), JSON.stringify(resources), simThreshold]);

  // 组合“最终提示词”：将软性提示 + 必要占位拼接为完整、简洁的最终模板
  const composedFinal = useMemo(() => {
    const softEffective = (genText && genText.trim()) ? genText.trim() : (systemPrompt || '').trim();
    const lines: string[] = [];
    if (softEffective) {
      lines.push(softEffective);
    } else {
      // 最小基础模板（简洁）：按能力自动给出要点
      lines.push('你是一个严谨且高效的中文智能助手，回答简洁准确、结构清晰。');
      if (hasKB) lines.push('优先基于知识库内容作答，不要臆造。');
      if (hasTools) lines.push('需要时可使用已授权的工具完成检索与操作。');
    }
    if (hasKB) {
      lines.push('（知识库上下文）');
      lines.push('{{knowledge}}');
    }
    if (hasTools) {
      lines.push('（工具执行结果摘要）');
      lines.push('{{tools_exec}}');
    }
    lines.push('请直接给出最终答案，避免无关赘述。');
    return lines.join('\n');
  }, [systemPrompt, hasKB, hasTools]);

  return (
    <div className="studio-section settings-group-basic">
      <Row gutter={16}>
        {/* 左侧：设置与生成 */}
        <Col xs={24} md={12}>
          <div style={{ marginBottom: 8 }}>
            <Text className="setting-label">系统注入（只读）</Text>
            <div style={{ marginTop: 6, display:'flex', gap:8, flexWrap:'wrap' }}>
              <Tag color={hasKB ? 'green' : 'red'}>知识上下文 {hasKB ? '（自动注入）' : '（未绑定）'}</Tag>
              <Tag color={hasTools ? 'gold' : 'default'}>工具摘要 {hasTools ? '（自动注入）' : '（未启用）'}</Tag>
            </div>
            <Text type="secondary" style={{ marginTop: 6, display:'block' }}>
              系统会按需注入占位：<code>{'{{knowledge}}'}</code>、<code>{'{{tools_exec}}'}</code>；右侧可查看注入内容与合成后的最终提示词。
            </Text>
          </div>

          <Text type="secondary" className="setting-label">用户提示（软性）</Text>
          <TextArea
            rows={6}
            value={systemPrompt}
            onChange={(e)=>setSystemPrompt(e.target.value)}
            style={{ marginTop: 8, borderRadius: 8 }}
            placeholder="为助手提供系统级提示（角色、风格、边界等）。不需要写 {{knowledge}} 或 {{tools_exec}}，系统会按需自动注入。"
          />

          <div style={{ marginTop: 12 }}>
            <Text type="secondary" className="setting-label">自动生成（使用默认LLM）</Text>
            <div style={{ marginTop: 6 }}>
              <Space direction="vertical" style={{ width:'100%' }} size={8}>
                <Input placeholder="使用场景（如：企业知识库问答与工具协作）" value={scenario} onChange={e=>setScenario(e.target.value)} />
                <Input placeholder="基础功能关键词（逗号分隔，例如：FAQ, 文档摘要, 搜索）" value={keywords} onChange={e=>setKeywords(e.target.value)} />
                <TextArea rows={5} value={genText} onChange={e=>setGenText(e.target.value)} placeholder="自动生成结果（可微调后再使用）" />
              </Space>
            </div>
          </div>
        </Col>

        {/* 右侧：预览区域 */}
        <Col xs={24} md={12}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Text type="secondary" className="setting-label">预览</Text>
            <Segmented
              size="small"
              value={mode}
              onChange={(v)=> setMode(v as any)}
              options={[{label:'合成视图',value:'combined'},{label:'标注视图',value:'annotated'}]}
            />
          </div>
          <Card size="small" loading={loading} style={{ marginTop: 6 }}>
            {!preview ? (
              <Text type="secondary">暂无预览</Text>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
                {mode === 'combined' ? (
                  <>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <Text type="secondary">最终提示词</Text>
                      <Space size={6}>
                        <Tooltip title={`约 ${tokenEstimate} tokens`}>
                          <Tag>估算 {tokenEstimate} tokens</Tag>
                        </Tooltip>
                        <Button size="small" onClick={()=>{
                          navigator.clipboard.writeText(composedFinal);
                          message.success('已复制最终提示词');
                        }}>复制</Button>
                        <Button size="small" type="link" onClick={()=>{
                          setSystemPrompt(composedFinal);
                          message.success('已用合成提示词覆盖软性提示');
                        }}>覆盖为合成提示词</Button>
                      </Space>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      合成依据：{(genText && genText.trim()) ? '自动生成内容' : '当前软性提示'}
                    </Text>
                    <pre style={{ whiteSpace:'pre-wrap', background:'#0b1020', color:'#e6edf3', padding:12, borderRadius:8, maxHeight:280, overflow:'auto', fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Monospace' }}>
                      {composedFinal}
                    </pre>

                    <Divider style={{ margin:'8px 0' }}>注入预览</Divider>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <Text type="secondary">知识（<code>{'{{knowledge}}'}</code>）</Text>
                        <pre style={{ whiteSpace:'pre-wrap', background:'#f8fafc', padding:10, borderRadius:6, maxHeight:180, overflow:'auto' }}>{preview.injections.knowledge_preview || '（无）'}</pre>
                      </div>
                      <div>
                        <Text type="secondary">工具（<code>{'{{tools_exec}}'}</code>）</Text>
                        <pre style={{ whiteSpace:'pre-wrap', background:'#f8fafc', padding:10, borderRadius:6, maxHeight:180, overflow:'auto' }}>{preview.injections.tools_exec_preview || '（无）'}</pre>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Alert type="info" showIcon message="标注视图：以结构方式展示各部分来源，便于理解组成。" style={{ marginBottom:8 }} />
                    <Card size="small" style={{ background:'#fcfffa', borderColor:'#e7f4e4' }}>
                      <Text strong>系统注入 · 知识（<code>{'{{knowledge}}'}</code>）</Text>
                      <pre style={{ whiteSpace:'pre-wrap', background:'#f8fafc', padding:10, borderRadius:6, marginTop:6, maxHeight:160, overflow:'auto' }}>{preview.injections.knowledge_preview || '（无）'}</pre>
                    </Card>
                    <Card size="small" style={{ background:'#fffdf6', borderColor:'#f6edd4', marginTop:8 }}>
                      <Text strong>系统注入 · 工具（<code>{'{{tools_exec}}'}</code>）</Text>
                      <pre style={{ whiteSpace:'pre-wrap', background:'#f8fafc', padding:10, borderRadius:6, marginTop:6, maxHeight:160, overflow:'auto' }}>{preview.injections.tools_exec_preview || '（无）'}</pre>
                    </Card>
                    <Card size="small" style={{ background:'#f6f9ff', borderColor:'#dfeaff', marginTop:8 }}>
                      <Text strong>用户提示（软性）</Text>
                      <pre style={{ whiteSpace:'pre-wrap', background:'#f8fafc', padding:10, borderRadius:6, marginTop:6, maxHeight:160, overflow:'auto' }}>{systemPrompt || '（未填写）'}</pre>
                    </Card>
                  </>
                )}
              </div>
            )}
          </Card>
          {/* 右侧底部操作区：自动生成与应用按钮 */}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop: 10 }}>
            <Button size="small" loading={genLoading} disabled={genLoading} onClick={()=>{
              setGenText('');
              setGenLoading(true);
              const ws = wsGeneratePrompt({
                scenario, keywords,
                selected_tools: (selectedTools||[]),
                resources
              }, (text)=> setGenText(prev => (prev ? prev + text : text)));
              if (!ws) {
                // 回退HTTP
                autoGeneratePrompt({ scenario, keywords, selected_tools: selectedTools||[], resources })
                  .then(res => setGenText(res.text || ''))
                  .catch(()=> message.error('自动生成失败'))
                  .finally(()=> setGenLoading(false));
              } else {
                setTimeout(()=> setGenLoading(false), 6000);
              }
            }}>自动生成（WS）</Button>
            <Button size="small" type="primary" disabled={genLoading} onClick={()=>{
              if (!genText) { message.warning('请先生成提示词'); return; }
              setSystemPrompt(genText);
              message.success('已应用到当前智能体');
            }}>使用此提示词</Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default PromptSettingsSection;
