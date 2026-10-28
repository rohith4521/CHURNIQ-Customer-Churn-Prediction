import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { CustomerExplorerPage } from './pages/CustomerExplorerPage';
import { PredictWorkspacePage } from './pages/PredictWorkspacePage';
import { ModelLabPage } from './pages/ModelLabPage';
import { StatisticalLabPage } from './pages/StatisticalLabPage';
import { PresentationModePage } from './pages/PresentationModePage';
import { DatasetSummary, EvaluationMetrics } from './types';
import { api } from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);

  // App Intelligence State
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [metrics, setMetrics] = useState<Record<string, EvaluationMetrics>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  const loadInitialData = async () => {
    setLoading(true);
    setBackendError(null);
    try {
      // Fetch summary and model evaluations in parallel
      const [sumRes, evalRes] = await Promise.all([
        api.getDatasetSummary().catch(() => null),
        api.getModelsEvaluation().catch(() => ({ models: {}, active_models_count: 0 })),
      ]);

      if (sumRes) {
        setSummary(sumRes);
      }
      if (evalRes && evalRes.models) {
        setMetrics(evalRes.models);
      }
    } catch (err: any) {
      console.error('Initialization error:', err);
      setBackendError('Cannot connect to CHURNIQ Backend at http://127.0.0.1:8000. Ensure the Python API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleModelTrained = (newMetrics: EvaluationMetrics) => {
    setMetrics((prev) => ({
      ...prev,
      [newMetrics.model_type]: newMetrics,
    }));
  };

  // Fullscreen Presentation Mode
  if (presentationMode || activeTab === 'presentation') {
    return (
      <PresentationModePage
        onExit={() => {
          setPresentationMode(false);
          if (activeTab === 'presentation') setActiveTab('overview');
        }}
      />
    );
  }

  const activeModelKeys = Object.keys(metrics);

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Workspace Area */}
      <div className="main-content">
        <Header
          summary={summary}
          activeModels={activeModelKeys}
          onOpenPresentation={() => setPresentationMode(true)}
        />

        {/* Backend Connection Error Warning */}
        {backendError && (
          <div
            style={{
              margin: '20px 28px 0',
              padding: '14px 20px',
              backgroundColor: 'var(--risk-high-bg)',
              border: '1px solid var(--risk-high-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--risk-high)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
              <AlertCircle size={18} />
              <span>{backendError}</span>
            </div>
            <button onClick={loadInitialData} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
              <RefreshCw size={13} /> Retry Connection
            </button>
          </div>
        )}

        {/* Page Content Rendering */}
        <main>
          {activeTab === 'overview' && (
            <OverviewPage
              summary={summary}
              metrics={metrics}
              loading={loading}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onRefreshData={loadInitialData}
            />
          )}

          {activeTab === 'explorer' && <CustomerExplorerPage />}

          {activeTab === 'predict' && <PredictWorkspacePage />}

          {activeTab === 'models' && (
            <ModelLabPage metrics={metrics} onModelTrained={handleModelTrained} />
          )}

          {activeTab === 'statistics' && <StatisticalLabPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
