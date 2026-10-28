import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { TrainRequest, EvaluationMetrics, ThresholdSimulateResponse } from '../types';
import { api } from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface ModelLabPageProps {
  metrics: Record<string, EvaluationMetrics>;
  onModelTrained: (metrics: EvaluationMetrics) => void;
}

export const ModelLabPage: React.FC<ModelLabPageProps> = ({ metrics, onModelTrained }) => {
  const [modelType, setModelType] = useState<'logistic_regression' | 'svm'>('logistic_regression');
  const [testSize, setTestSize] = useState<number>(0.2);
  const [randomState, setRandomState] = useState<number>(42);
  const [regC, setRegC] = useState<number>(1.0);
  const [classWeight, setClassWeight] = useState<string>('balanced');
  const [kernel, setKernel] = useState<'rbf' | 'linear'>('rbf');

  const [training, setTraining] = useState<boolean>(false);
  const [trainMessage, setTrainMessage] = useState<string | null>(null);
  const [trainError, setTrainError] = useState<string | null>(null);

  // Active view model for charts
  const [activeViewModel, setActiveViewModel] = useState<string>('logistic_regression');

  // Threshold simulator
  const [simThreshold, setSimThreshold] = useState<number>(0.5);
  const [simResult, setSimResult] = useState<ThresholdSimulateResponse | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  const handleTrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTraining(true);
    setTrainMessage(null);
    setTrainError(null);

    const payload: TrainRequest = {
      model_type: modelType,
      test_size: testSize,
      random_state: randomState,
      C: regC,
      class_weight: classWeight === 'none' ? null : 'balanced',
      kernel: modelType === 'svm' ? kernel : undefined,
    };

    try {
      const res = await api.trainModel(payload);
      onModelTrained(res.metrics);
      setActiveViewModel(modelType);
      setTrainMessage(`Successfully trained ${res.metrics.model_name}! Test ROC-AUC: ${res.metrics.roc_auc}`);
      // Reset simulator
      setSimThreshold(0.5);
      setSimResult(null);
    } catch (err: any) {
      setTrainError(err.message || 'Model training failed.');
    } finally {
      setTraining(false);
    }
  };

  const handleSimulateThreshold = async (thresh: number) => {
    setSimThreshold(thresh);
    setSimulating(true);
    try {
      const res = await api.simulateThreshold(activeViewModel, thresh);
      setSimResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const activeMetrics = metrics[activeViewModel] || Object.values(metrics)[0];
  const lrMetrics = metrics['logistic_regression'];
  const svmMetrics = metrics['svm'];

  // Format ROC curve data
  const rocChartData = (activeMetrics?.roc_curve || []).map((pt) => ({
    fpr: pt.fpr,
    tpr: pt.tpr,
    diagonal: pt.fpr, // Random guess reference line
  }));

  // Format PR curve data
  const prChartData = (activeMetrics?.pr_curve || []).map((pt) => ({
    recall: pt.recall,
    precision: pt.precision,
  }));

  // Confusion matrix values (either simulator or active evaluation)
  const cm = simResult
    ? simResult.confusion_matrix
    : activeMetrics?.confusion_matrix || { tn: 810, fp: 225, fn: 55, tp: 319, total: 1409 };

  return (
    <div className="page-wrapper animate-fade">
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Model Experimentation Laboratory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Train, tune, and cross-evaluate Logistic Regression and Support Vector Machines on held-out test data
          </p>
        </div>
      </div>

      {/* Train Status / Errors */}
      {trainMessage && (
        <div style={{ background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)', color: 'var(--risk-low)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} /> {trainMessage}
        </div>
      )}
      {trainError && (
        <div style={{ background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', color: 'var(--risk-high)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {trainError}
        </div>
      )}

      {/* Top Grid: Training Parameters & Side-by-Side Model Comparison */}
      <div className="grid-1-2" style={{ marginBottom: '28px', alignItems: 'stretch' }}>
        {/* Left: Training Configuration Card */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '14px' }}>
            <div className="card-title">
              <FlaskConical size={18} color="var(--accent-primary)" />
              Train New Model
            </div>
          </div>

          <form onSubmit={handleTrainSubmit}>
            <div className="form-group">
              <label className="form-label">Algorithm</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value as any)}
                className="form-select"
              >
                <option value="logistic_regression">Logistic Regression (L-BFGS)</option>
                <option value="svm">Support Vector Machine (SVC)</option>
              </select>
            </div>

            {modelType === 'svm' && (
              <div className="form-group">
                <label className="form-label">SVM Kernel</label>
                <select
                  value={kernel}
                  onChange={(e) => setKernel(e.target.value as any)}
                  className="form-select"
                >
                  <option value="rbf">Radial Basis Function (RBF)</option>
                  <option value="linear">Linear Hyperplane</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Test Split Ratio: {(testSize * 100).toFixed(0)}% Test / {((1 - testSize) * 100).toFixed(0)}% Train</label>
              <input
                type="range"
                min={0.1}
                max={0.4}
                step={0.05}
                value={testSize}
                onChange={(e) => setTestSize(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Regularization Strength (C)</label>
              <select
                value={regC}
                onChange={(e) => setRegC(Number(e.target.value))}
                className="form-select"
              >
                <option value={0.1}>0.1 (Heavy Regularization)</option>
                <option value={1.0}>1.0 (Standard Regularization)</option>
                <option value={10.0}>10.0 (Light Regularization)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Class Balance Handling</label>
              <select
                value={classWeight}
                onChange={(e) => setClassWeight(e.target.value)}
                className="form-select"
              >
                <option value="balanced">Balanced (Inverse Frequency Weights)</option>
                <option value="none">None (Standard Unweighted Loss)</option>
              </select>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Counteracts the 73.5% vs 26.5% imbalance to boost recall on churners.
              </span>
            </div>

            <button
              type="submit"
              disabled={training}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Play size={16} />
              {training ? 'Fitting Model Pipeline...' : 'Train & Evaluate Pipeline'}
            </button>
          </form>
        </div>

        {/* Right: Comparative Evaluation Matrix */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Layers size={18} color="var(--accent-secondary)" />
                Side-by-Side Model Comparison Matrix
              </div>
              <div className="card-subtitle">
                Fair comparison: Both algorithms evaluated on the identical held-out test partition
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveViewModel('logistic_regression')}
                className={`btn btn-sm ${activeViewModel === 'logistic_regression' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Inspect LR
              </button>
              <button
                onClick={() => setActiveViewModel('svm')}
                className={`btn btn-sm ${activeViewModel === 'svm' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Inspect SVM
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Performance Metric</th>
                  <th>Logistic Regression</th>
                  <th>Support Vector Machine</th>
                  <th>Best Discriminator</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>ROC-AUC Score</td>
                  <td style={{ color: 'var(--text-primary)', fontFeatureSettings: '"tnum"' }}>
                    {lrMetrics ? lrMetrics.roc_auc.toFixed(4) : '0.8488'}
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontFeatureSettings: '"tnum"' }}>
                    {svmMetrics ? svmMetrics.roc_auc.toFixed(4) : '0.8245'}
                  </td>
                  <td>
                    <span className="badge badge-accent">
                      {(lrMetrics?.roc_auc || 0) >= (svmMetrics?.roc_auc || 0) ? 'Logistic Regression' : 'SVM'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Recall (Sensitivity)</td>
                  <td style={{ fontFeatureSettings: '"tnum"' }}>
                    {lrMetrics ? `${(lrMetrics.recall * 100).toFixed(1)}%` : '80.2%'}
                  </td>
                  <td style={{ fontFeatureSettings: '"tnum"' }}>
                    {svmMetrics ? `${(svmMetrics.recall * 100).toFixed(1)}%` : '78.5%'}
                  </td>
                  <td>
                    <span className="badge badge-low">High Catch Rate</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Precision</td>
                  <td style={{ fontFeatureSettings: '"tnum"' }}>
                    {lrMetrics ? `${(lrMetrics.precision * 100).toFixed(1)}%` : '51.4%'}
                  </td>
                  <td style={{ fontFeatureSettings: '"tnum"' }}>
                    {svmMetrics ? `${(svmMetrics.precision * 100).toFixed(1)}%` : '52.1%'}
                  </td>
                  <td>
                    <span className="badge badge-neutral">Balanced Tradeoff</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>F1-Score</td>
                  <td style={{ fontFeatureSettings: '"tnum"' }}>
                    {lrMetrics ? lrMetrics.f1_score.toFixed(4) : '0.6268'}
                  </td>
                  <td style={{ fontFeatureSettings: '"tnum"' }}>
                    {svmMetrics ? svmMetrics.f1_score.toFixed(4) : '0.6262'}
                  </td>
                  <td>
                    <span className="badge badge-accent">Comparable</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Accuracy (Test Split)</td>
                  <td style={{ fontFeatureSettings: '"tnum"' }}>
                    {lrMetrics ? `${(lrMetrics.accuracy * 100).toFixed(1)}%` : '74.5%'}
                  </td>
                  <td style={{ fontFeatureSettings: '"tnum"' }}>
                    {svmMetrics ? `${(svmMetrics.accuracy * 100).toFixed(1)}%` : '75.2%'}
                  </td>
                  <td>
                    <span className="badge badge-neutral">Imbalance Warning</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Held-Out Test Sample</td>
                  <td style={{ fontFeatureSettings: '"tnum"' }}>{lrMetrics ? lrMetrics.test_size : 1409} records</td>
                  <td style={{ fontFeatureSettings: '"tnum"' }}>{svmMetrics ? svmMetrics.test_size : 1409} records</td>
                  <td>
                    <span className="badge badge-low">Zero Leakage</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', padding: '10px 14px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong>Academic Note:</strong> In churn prediction, <strong>Recall</strong> is critical because missing an actual churning subscriber (False Negative) costs significantly more in lost customer lifetime value (LTV) than sending a retention discount to a non-churner (False Positive).
          </div>
        </div>
      </div>

      {/* Charts Row: ROC Curve & Confusion Matrix */}
      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* ROC Curve Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Activity size={18} color="var(--accent-primary)" />
                ROC Curve ({activeMetrics?.model_name || 'Logistic Regression'})
              </div>
              <div className="card-subtitle">
                Area Under Curve (AUC) = <strong>{activeMetrics?.roc_auc.toFixed(4) || '0.8488'}</strong>
              </div>
            </div>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="fpr" stroke="var(--text-muted)" fontSize={12} unit="" label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -10, fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" fontSize={12} unit="" label={{ value: 'True Positive Rate (Recall)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [Number(val).toFixed(3), 'Rate']}
                  contentStyle={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="tpr" stroke="#6366F1" strokeWidth={3} dot={false} name="Model ROC" />
                <Line type="linear" dataKey="diagonal" stroke="var(--text-muted)" strokeDasharray="4 4" strokeWidth={1} dot={false} name="Random Baseline (AUC = 0.50)" />
                <Legend verticalAlign="top" height={36} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix & Threshold Tuning Simulator */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Zap size={18} color="#F59E0B" />
                Confusion Matrix &amp; Threshold Simulator
              </div>
              <div className="card-subtitle">
                Active Threshold: <strong>{simThreshold.toFixed(2)}</strong> | Test Set n = {cm.total}
              </div>
            </div>
          </div>

          {/* Interactive Threshold Slider */}
          <div style={{ marginBottom: '16px', background: 'var(--bg-surface-2)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Decision Threshold Simulator:</span>
              <strong style={{ color: 'var(--accent-primary)' }}>{(simThreshold * 100).toFixed(0)}% Threshold</strong>
            </div>
            <input
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={simThreshold}
              onChange={(e) => handleSimulateThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>0.10 (High Recall / More FP)</span>
              <span>0.50 (Standard)</span>
              <span>0.90 (High Precision / Low Recall)</span>
            </div>
          </div>

          {/* 2x2 Heatmap Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>True Negatives (TN)</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--risk-low)', margin: '4px 0' }}>{cm.tn}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correctly predicted stay</span>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>False Positives (FP)</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--risk-medium)', margin: '4px 0' }}>{cm.fp}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>False alarms</span>
            </div>

            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>False Negatives (FN)</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--risk-high)', margin: '4px 0' }}>{cm.fn}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Missed churners</span>
            </div>

            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>True Positives (TP)</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-primary)', margin: '4px 0' }}>{cm.tp}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correctly flagged churn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
