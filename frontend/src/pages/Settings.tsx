import React, { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { systemSettingAPI } from '../services/api';
import { AISettings } from '../types';

const Settings: React.FC = () => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: 'openai',
    api_key: '',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000,
    timeout: 60,
  });
  const [aiSettingsLoaded, setAiSettingsLoaded] = useState(false);

  const fetchAISettings = useCallback(async () => {
    try {
      const response = await systemSettingAPI.getAISettings();
      setAiSettings(response.data);
      setAiSettingsLoaded(true);
    } catch (error) {
      console.error('获取 AI 设置失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchAISettings();
  }, [fetchAISettings]);

  const handleUpdateAISettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aiSettings.api_key.trim()) {
      message.error('请输入 API 密钥');
      return;
    }

    setAiLoading(true);
    try {
      await systemSettingAPI.updateAISettings(aiSettings);
      message.success('AI 配置更新成功');
    } catch (error) {
      message.error('更新失败');
      console.error('更新失败:', error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>

      <div className="card p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 配置</h3>
        {aiSettingsLoaded ? (
          <form onSubmit={handleUpdateAISettings} className="space-y-4">
            <div>
              <label className="label">
                AI 服务提供商
              </label>
              <select
                value={aiSettings.provider}
                onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value })}
                className="input"
              >
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="local">本地 LLM (Ollama)</option>
              </select>
            </div>

            <div>
              <label className="label">
                API 密钥
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={aiSettings.api_key}
                  onChange={(e) => setAiSettings({ ...aiSettings, api_key: e.target.value })}
                  className="input pl-10"
                  placeholder="请输入 API 密钥"
                />
              </div>
            </div>

            <div>
              <label className="label">
                模型
              </label>
              <input
                type="text"
                value={aiSettings.model}
                onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                className="input"
                placeholder="gpt-4, gpt-3.5-turbo, claude-3-opus-20240229"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  温度参数
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={aiSettings.temperature}
                  onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">
                  最大 Token 数
                </label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  value={aiSettings.max_tokens}
                  onChange={(e) => setAiSettings({ ...aiSettings, max_tokens: parseInt(e.target.value) || 2000 })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">
                请求超时（秒）
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={aiSettings.timeout}
                onChange={(e) => setAiSettings({ ...aiSettings, timeout: parseInt(e.target.value) || 60 })}
                className="input"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={aiLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    更新中...
                  </span>
                ) : (
                  '更新 AI 配置'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            加载中...
          </div>
        )}
      </div>


      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h3>
        <div className="space-y-2 text-sm text-gray-500">
          <div>版本: 1.0.0</div>
          <div>React: 18.2.0</div>
          <div>Ant Design: 4.21.0</div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
