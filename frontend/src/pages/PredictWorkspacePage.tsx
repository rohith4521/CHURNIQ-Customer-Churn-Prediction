import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  DollarSign,
  User,
  Shield,
  Phone,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { CustomerPredictInput, PredictionResponse } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';

const PRESETS: Record<string, CustomerPredictInput> = {
  highRisk: {
    gender: 'Female',
    SeniorCitizen: 0,
    Partner: 'No',
    Dependents: 'No',
    tenure: 2,
    PhoneService: 'Yes',
    MultipleLines: 'No',
    InternetService: 'Fiber optic',
    OnlineSecurity: 'No',
    OnlineBackup: 'No',
    DeviceProtection: 'No',
    TechSupport: 'No',
    StreamingTV: 'Yes',
    StreamingMovies: 'Yes',
    Contract: 'Month-to-month',
    PaperlessBilling: 'Yes',
    PaymentMethod: 'Electronic check',
    MonthlyCharges: 89.5,
    TotalCharges: 179.0,
    model_type: 'logistic_regression',
  },
  lowRisk: {
    gender: 'Male',
    SeniorCitizen: 0,
    Partner: 'Yes',
    Dependents: 'Yes',
    tenure: 62,
    PhoneService: 'Yes',
    MultipleLines: 'Yes',
    InternetService: 'DSL',
    OnlineSecurity: 'Yes',
    OnlineBackup: 'Yes',
    DeviceProtection: 'Yes',
    TechSupport: 'Yes',
    StreamingTV: 'No',
    StreamingMovies: 'No',
    Contract: 'Two year',
    PaperlessBilling: 'No',
    PaymentMethod: 'Credit card (automatic)',
    MonthlyCharges: 58.2,
    TotalCharges: 3608.4,
    model_type: 'logistic_regression',
  },
  edgeCase: {
    gender: 'Female',
    SeniorCitizen: 1,
    Partner: 'No',
    Dependents: 'No',
    tenure: 16,
    PhoneService: 'Yes',
    MultipleLines: 'Yes',
    InternetService: 'Fiber optic',
    OnlineSecurity: 'No',
    OnlineBackup: 'Yes',
    DeviceProtection: 'No',
    TechSupport: 'No',
    StreamingTV: 'Yes',
    StreamingMovies: 'No',
    Contract: 'Month-to-month',
    PaperlessBilling: 'Yes',
    PaymentMethod: 'Bank transfer (automatic)',
    MonthlyCharges: 84.1,
    TotalCharges: 1345.6,
    model_type: 'logistic_regression',
  },
};

export const PredictWorkspacePage: React.FC = () => {
  const [formData, setFormData] = useState<CustomerPredictInput>({ ...PRESETS.highRisk });
  const [selectedModel, setSelectedModel] = useState<'logistic_regression' | 'svm'>('logistic_regression');
  const [loading, setLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CustomerPredictInput, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-update TotalCharges if tenure or monthly changes sensibly
      if (field === 'tenure' || field === 'MonthlyCharges') {
        const tenure = field === 'tenure' ? Number(value) : prev.tenure;
        const monthly = field === 'MonthlyCharges' ? Number(value) : prev.MonthlyCharges;
        updated.TotalCharges = Math.round(tenure * monthly * 100) / 100;
      }
      return updated;
    });
  };

  const applyPreset = (presetKey: string) => {
    if (PRESETS[presetKey]) {
      setFormData({ ...PRESETS[presetKey], model_type: selectedModel });
      setPrediction(null);
    }
  };

  const handlePredictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictCustomer({
        ...formData,
        model_type: selectedModel,
      });
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ ...PRESETS.highRisk, model_type: selectedModel });
    setPrediction(null);
    setError(null);
  };

  return (
    <div className="page-wrapper animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Individual Churn Prediction Workspace</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Simulate customer profiles, compute calibrated churn probabilities, and compare Logistic Regression vs SVM
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => applyPreset('highRisk')} className="btn btn-danger btn-sm">
            High Risk Preset
          </button>
          <button onClick={() => applyPreset('lowRisk')} className="btn btn-secondary btn-sm">
            Loyal Veteran Preset
          </button>
          <button onClick={() => applyPreset('edgeCase')} className="btn btn-secondary btn-sm">
            Edge Case Preset
          </button>
          <button onClick={handleReset} className="btn btn-secondary btn-sm" title="Reset form">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', color: 'var(--risk-high)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Main Grid: Form Left, Results Right */}
      <div className="grid-2-1" style={{ alignItems: 'flex-start' }}>
        {/* Left Form Column */}
        <form onSubmit={handlePredictSubmit}>
          {/* Card 1: Model Choice & Presets */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div className="card-title">
                <BrainCircuit size={18} color="var(--accent-primary)" />
                Model Engine Selection
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: selectedModel === 'logistic_regression' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface-2)',
                  border: `1px solid ${selectedModel === 'logistic_regression' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="model_choice"
                  checked={selectedModel === 'logistic_regression'}
                  onChange={() => setSelectedModel('logistic_regression')}
                />
                <div>
                  <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-primary)' }}>
                    Logistic Regression
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Probabilistic odds &amp; coefficient interpretability
                  </span>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: selectedModel === 'svm' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-surface-2)',
                  border: `1px solid ${selectedModel === 'svm' ? 'var(--accent-secondary)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="model_choice"
                  checked={selectedModel === 'svm'}
                  onChange={() => setSelectedModel('svm')}
                />
                <div>
                  <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-primary)' }}>
                    Support Vector Machine (SVM)
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Maximal margin boundary with Platt scaling
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Card 2: Demographics */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div className="card-title">
                <User size={18} color="var(--accent-secondary)" />
                Customer Demographics
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)} className="form-select">
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Senior Citizen</label>
                <select value={formData.SeniorCitizen} onChange={(e) => handleInputChange('SeniorCitizen', Number(e.target.value))} className="form-select">
                  <option value={0}>No (Under 65)</option>
                  <option value={1}>Yes (65+)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Partner</label>
                <select value={formData.Partner} onChange={(e) => handleInputChange('Partner', e.target.value)} className="form-select">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Dependents</label>
                <select value={formData.Dependents} onChange={(e) => handleInputChange('Dependents', e.target.value)} className="form-select">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Account & Contract */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div className="card-title">
                <DollarSign size={18} color="#F59E0B" />
                Account, Contract &amp; Billing
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tenure (Months): {formData.tenure}</label>
                <input
                  type="range"
                  min={0}
                  max={72}
                  value={formData.tenure}
                  onChange={(e) => handleInputChange('tenure', Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)', marginTop: '8px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contract Type</label>
                <select value={formData.Contract} onChange={(e) => handleInputChange('Contract', e.target.value)} className="form-select">
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Paperless Billing</label>
                <select value={formData.PaperlessBilling} onChange={(e) => handleInputChange('PaperlessBilling', e.target.value)} className="form-select">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select value={formData.PaymentMethod} onChange={(e) => handleInputChange('PaymentMethod', e.target.value)} className="form-select">
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                  <option value="Credit card (automatic)">Credit card (automatic)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Charges ($)</label>
                <input
                  type="number"
                  step="0.5"
                  min={18}
                  max={150}
                  value={formData.MonthlyCharges}
                  onChange={(e) => handleInputChange('MonthlyCharges', Number(e.target.value))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Charges ($)</label>
                <input
                  type="number"
                  step="1"
                  min={0}
                  value={formData.TotalCharges}
                  onChange={(e) => handleInputChange('TotalCharges', Number(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Subscribed Telecom Services */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div className="card-title">
                <Phone size={18} color="#34D399" />
                Subscribed Services
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Service</label>
                <select value={formData.PhoneService} onChange={(e) => handleInputChange('PhoneService', e.target.value)} className="form-select">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Multiple Lines</label>
                <select value={formData.MultipleLines} onChange={(e) => handleInputChange('MultipleLines', e.target.value)} className="form-select">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No phone service">No phone service</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Internet Service</label>
                <select value={formData.InternetService} onChange={(e) => handleInputChange('InternetService', e.target.value)} className="form-select">
                  <option value="DSL">DSL</option>
                  <option value="Fiber optic">Fiber optic</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tech Support</label>
                <select value={formData.TechSupport} onChange={(e) => handleInputChange('TechSupport', e.target.value)} className="form-select">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Online Security</label>
                <select value={formData.OnlineSecurity} onChange={(e) => handleInputChange('OnlineSecurity', e.target.value)} className="form-select">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cloud Backup</label>
                <select value={formData.OnlineBackup} onChange={(e) => handleInputChange('OnlineBackup', e.target.value)} className="form-select">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submission Button */}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '46px', fontSize: '1rem' }}>
            <Sparkles size={18} />
            {loading ? 'Evaluating Model Inference...' : 'Calculate Churn Probability'}
          </button>
        </form>

        {/* Right Output Column */}
        <div>
          {prediction ? (
            <div className="card animate-fade" style={{ border: '1px solid var(--accent-primary)', position: 'sticky', top: '90px' }}>
              <div className="card-header" style={{ marginBottom: '14px' }}>
                <div>
                  <div className="card-title">
                    <Sparkles size={18} color="var(--accent-primary)" />
                    Inference Output
                  </div>
                  <div className="card-subtitle">Real-time inference using {prediction.primary_prediction.model_name}</div>
                </div>
              </div>

              {/* Main Probability Meter */}
              <div
                style={{
                  background: 'var(--bg-surface-2)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Calibrated Churn Probability
                </span>
                <div
                  style={{
                    fontSize: '2.8rem',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    marginTop: '6px',
                    color:
                      prediction.primary_prediction.risk_level === 'High'
                        ? 'var(--risk-high)'
                        : prediction.primary_prediction.risk_level === 'Medium'
                        ? 'var(--risk-medium)'
                        : 'var(--risk-low)',
                  }}
                >
                  {(prediction.primary_prediction.probability * 100).toFixed(1)}%
                </div>
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
                  <RiskBadge tier={prediction.primary_prediction.risk_level} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  95% Confidence Interval: [{(prediction.confidence_interval[0] * 100).toFixed(1)}% - {(prediction.confidence_interval[1] * 100).toFixed(1)}%]
                </div>
              </div>

              {/* Side-by-Side Model Comparison Card */}
              {prediction.comparison_prediction && (
                <div style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} /> Dual Model Comparison
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                    <div style={{ padding: '8px', background: 'var(--bg-surface-1)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{prediction.primary_prediction.model_name}:</span>
                      <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {(prediction.primary_prediction.probability * 100).toFixed(1)}%
                      </strong>
                    </div>
                    <div style={{ padding: '8px', background: 'var(--bg-surface-1)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{prediction.comparison_prediction.model_name}:</span>
                      <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--accent-secondary)' }}>
                        {(prediction.comparison_prediction.probability * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Plain Language Interpretation */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Statistical Summary</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {prediction.plain_language_explanation}
                </p>
              </div>

              {/* Feature Drivers Waterfall */}
              {prediction.primary_prediction.feature_contributions && prediction.primary_prediction.feature_contributions.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Key Feature Drivers (Log-Odds Impact)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {prediction.primary_prediction.feature_contributions.map((fc, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'var(--bg-surface-2)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                        }}
                      >
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {fc.feature.replace('_', ': ')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {fc.contribution > 0 ? (
                            <TrendingUp size={14} color="var(--risk-high)" />
                          ) : (
                            <TrendingDown size={14} color="var(--risk-low)" />
                          )}
                          <span
                            style={{
                              fontWeight: 600,
                              color: fc.contribution > 0 ? 'var(--risk-high)' : 'var(--risk-low)',
                            }}
                          >
                            {fc.contribution > 0 ? `+${fc.contribution.toFixed(2)}` : fc.contribution.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Retention Interventions */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Actionable Retention Interventions
                </h4>
                <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {prediction.retention_recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
              <BrainCircuit size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3>Awaiting Input Simulation</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '6px', maxWidth: '300px', margin: '6px auto 0' }}>
                Adjust customer attributes or pick a preset on the left and click <strong>Calculate Churn Probability</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
