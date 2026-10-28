import React, { useState, useEffect } from 'react';
import {
  Sigma,
  Scale,
  Calculator,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
  BarChart,
  Bar,
} from 'recharts';
import { TwoProportionZTestResult, ChiSquareTestResult, OddsRatiosResponse } from '../types';
import { api } from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const StatisticalLabPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hypothesis' | 'odds' | 'sigmoid'>('hypothesis');

  // Hypothesis Test state
  const [testType, setTestType] = useState<'two_proportion' | 'chi_square'>('two_proportion');
  const [featureName, setFeatureName] = useState<string>('Contract');
  const [group1, setGroup1] = useState<string>('Month-to-month');
  const [group2, setGroup2] = useState<string>('Two year');
  const [alpha, setAlpha] = useState<number>(0.05);

  const [zTestResult, setZTestResult] = useState<TwoProportionZTestResult | null>(null);
  const [chiTestResult, setChiTestResult] = useState<ChiSquareTestResult | null>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Odds Ratios state
  const [oddsResponse, setOddsResponse] = useState<OddsRatiosResponse | null>(null);
  const [oddsLoading, setOddsLoading] = useState<boolean>(false);

  // Interactive Sigmoid Explorer state
  const [simZ, setSimZ] = useState<number>(1.2);

  const runTest = async () => {
    setTestLoading(true);
    setTestError(null);
    try {
      const res = await api.getHypothesisTest({
        test_type: testType,
        feature_name: featureName,
        group1: testType === 'two_proportion' ? group1 : undefined,
        group2: testType === 'two_proportion' ? group2 : undefined,
        alpha,
      });
      if (testType === 'two_proportion') {
        setZTestResult(res.result as TwoProportionZTestResult);
      } else {
        setChiTestResult(res.result as ChiSquareTestResult);
      }
    } catch (err: any) {
      setTestError(err.message || 'Statistical test failed');
    } finally {
      setTestLoading(false);
    }
  };

  const loadOddsRatios = async () => {
    setOddsLoading(true);
    try {
      const res = await api.getOddsRatios();
      setOddsResponse(res);
    } catch (err) {
      console.error(err);
    } finally {
      setOddsLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, [testType, featureName, group1, group2, alpha]);

  useEffect(() => {
    loadOddsRatios();
  }, []);

  // Generate Sigmoid Curve points (-6 to +6)
  const sigmoidData = [];
  for (let z = -6.0; z <= 6.0; z += 0.25) {
    const p = 1.0 / (1.0 + Math.exp(-z));
    sigmoidData.push({
      z: Math.round(z * 100) / 100,
      prob: Math.round(p * 1000) / 1000,
    });
  }
  const activeSigmoidProb = 1.0 / (1.0 + Math.exp(-simZ));

  return (
    <div className="page-wrapper animate-fade">
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Statistical Laboratory &amp; Inference</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Academic hypothesis verification, Odds Ratios (OR = e^β), asymptotic confidence intervals, and logit link math
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="tabs-nav">
        <button
          onClick={() => setActiveTab('hypothesis')}
          className={`tab-btn ${activeTab === 'hypothesis' ? 'active' : ''}`}
        >
          <Scale size={16} /> Hypothesis Testing (Z-Test &amp; Chi-Square)
        </button>
        <button
          onClick={() => setActiveTab('odds')}
          className={`tab-btn ${activeTab === 'odds' ? 'active' : ''}`}
        >
          <TrendingUp size={16} /> Logistic Regression Odds Ratios (e^β)
        </button>
        <button
          onClick={() => setActiveTab('sigmoid')}
          className={`tab-btn ${activeTab === 'sigmoid' ? 'active' : ''}`}
        >
          <Calculator size={16} /> Sigmoid Function &amp; Log-Odds Explorer
        </button>
      </div>

      {/* TAB 1: HYPOTHESIS TESTING */}
      {activeTab === 'hypothesis' && (
        <div>
          {/* Controls Card */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
              <div>
                <label className="form-label">Hypothesis Test Family</label>
                <select
                  value={testType}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setTestType(newType);
                    if (newType === 'two_proportion') {
                      setFeatureName('Contract');
                      setGroup1('Month-to-month');
                      setGroup2('Two year');
                    } else {
                      setFeatureName('TechSupport');
                    }
                  }}
                  className="form-select"
                >
                  <option value="two_proportion">Two-Proportion Z-Test</option>
                  <option value="chi_square">Pearson Chi-Square Independence (χ²)</option>
                </select>
              </div>

              {testType === 'two_proportion' ? (
                <>
                  <div>
                    <label className="form-label">Tested Feature</label>
                    <select
                      value={featureName}
                      onChange={(e) => {
                        const feat = e.target.value;
                        setFeatureName(feat);
                        if (feat === 'Contract') {
                          setGroup1('Month-to-month');
                          setGroup2('Two year');
                        } else if (feat === 'SeniorCitizen') {
                          setGroup1('1');
                          setGroup2('0');
                        } else if (feat === 'Partner') {
                          setGroup1('No');
                          setGroup2('Yes');
                        }
                      }}
                      className="form-select"
                    >
                      <option value="Contract">Contract (Month-to-month vs Two year)</option>
                      <option value="SeniorCitizen">Senior Citizen (1 vs 0)</option>
                      <option value="Partner">Partner (No vs Yes)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Subgroup 1</label>
                    <input type="text" value={group1} readOnly className="form-input" style={{ opacity: 0.8 }} />
                  </div>
                  <div>
                    <label className="form-label">Subgroup 2</label>
                    <input type="text" value={group2} readOnly className="form-input" style={{ opacity: 0.8 }} />
                  </div>
                </>
              ) : (
                <div>
                  <label className="form-label">Categorical Factor</label>
                  <select
                    value={featureName}
                    onChange={(e) => setFeatureName(e.target.value)}
                    className="form-select"
                  >
                    <option value="Contract">Contract Type</option>
                    <option value="TechSupport">Tech Support</option>
                    <option value="InternetService">Internet Service</option>
                    <option value="PaymentMethod">Payment Method</option>
                  </select>
                </div>
              )}

              <div>
                <label className="form-label">Significance Level (α)</label>
                <select value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} className="form-select">
                  <option value={0.01}>α = 0.01 (99% Confidence)</option>
                  <option value={0.05}>α = 0.05 (95% Confidence - Standard)</option>
                  <option value={0.10}>α = 0.10 (90% Confidence)</option>
                </select>
              </div>
            </div>
          </div>

          {testLoading && <LoadingSkeleton rows={6} height="36px" />}

          {/* Render Z-Test Result */}
          {testType === 'two_proportion' && zTestResult && !testLoading && (
            <div className="card animate-fade" style={{ marginBottom: '24px' }}>
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <div>
                  <div className="card-title">
                    <Scale size={18} color="var(--accent-primary)" />
                    Two-Proportion Z-Test Statistical Outcome
                  </div>
                  <div className="card-subtitle">{zTestResult.research_question}</div>
                </div>
                <span className={`badge ${zTestResult.is_statistically_significant ? 'badge-low' : 'badge-neutral'}`} style={{ fontSize: '0.85rem' }}>
                  {zTestResult.is_statistically_significant ? 'Statistically Significant Difference' : 'Fail to Reject Null'}
                </span>
              </div>

              {/* Statistical Parameters Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Z Test Statistic</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px' }}>
                    {zTestResult.z_statistic.toFixed(3)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Standard standard errors</span>
                </div>

                <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>P-Value (Two-Sided)</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: zTestResult.p_value < 0.001 ? 'var(--risk-low)' : 'var(--text-primary)', marginTop: '2px' }}>
                    {zTestResult.p_value < 0.0001 ? '< 0.0001' : zTestResult.p_value.toFixed(4)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Threshold α = {alpha}</span>
                </div>

                <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Difference in Churn</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {(zTestResult.difference_in_proportions * 100).toFixed(1)}% pts
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    95% CI: [{(zTestResult.ci_lower * 100).toFixed(1)}%, {(zTestResult.ci_upper * 100).toFixed(1)}%]
                  </span>
                </div>

                <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cochran Assumption</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: zTestResult.assumptions_met ? 'var(--risk-low)' : 'var(--risk-high)', marginTop: '6px' }}>
                    {zTestResult.assumptions_met ? 'Valid (np ≥ 5)' : 'Violated'}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sufficient subgroup counts</span>
                </div>
              </div>

              {/* Subgroup Breakdown Table */}
              <div style={{ background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.88rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>Sample Observations</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '12px' }}>
                    <strong>{zTestResult.group1_name}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Sample Size: <strong>{zTestResult.group1_total.toLocaleString()}</strong> | Churned: <strong>{zTestResult.group1_churned}</strong> | Rate: <strong style={{ color: 'var(--risk-high)' }}>{(zTestResult.group1_rate * 100).toFixed(2)}%</strong>
                    </div>
                  </div>
                  <div style={{ borderLeft: '3px solid var(--accent-secondary)', paddingLeft: '12px' }}>
                    <strong>{zTestResult.group2_name}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Sample Size: <strong>{zTestResult.group2_total.toLocaleString()}</strong> | Churned: <strong>{zTestResult.group2_churned}</strong> | Rate: <strong style={{ color: 'var(--risk-low)' }}>{(zTestResult.group2_rate * 100).toFixed(2)}%</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plain Language Interpretation */}
              <div style={{ borderLeft: '3px solid var(--risk-low)', paddingLeft: '14px' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Formal Academic Conclusion</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {zTestResult.plain_language_interpretation}
                </p>
              </div>
            </div>
          )}

          {/* Render Chi-Square Result */}
          {testType === 'chi_square' && chiTestResult && !testLoading && (
            <div className="card animate-fade" style={{ marginBottom: '24px' }}>
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <div>
                  <div className="card-title">
                    <Scale size={18} color="var(--accent-secondary)" />
                    Pearson Chi-Squared Test of Independence (χ²)
                  </div>
                  <div className="card-subtitle">{chiTestResult.research_question}</div>
                </div>
                <span className={`badge ${chiTestResult.is_statistically_significant ? 'badge-low' : 'badge-neutral'}`}>
                  {chiTestResult.is_statistically_significant ? 'Significant Association' : 'Independent'}
                </span>
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>χ² Test Statistic</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '2px' }}>
                    {chiTestResult.chi2_statistic.toFixed(2)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Degrees of Freedom: {chiTestResult.degrees_of_freedom}</span>
                </div>

                <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>P-Value</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--risk-low)', marginTop: '2px' }}>
                    {chiTestResult.p_value < 0.0001 ? '< 0.0001' : chiTestResult.p_value.toFixed(4)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Significance level α = {alpha}</span>
                </div>

                <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cramer's V Effect Size</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {chiTestResult.cramers_v.toFixed(3)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>{chiTestResult.effect_size_interpretation}</span>
                </div>

                <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expected Frequencies</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: chiTestResult.expected_cell_count_assumption_met ? 'var(--risk-low)' : 'var(--risk-high)', marginTop: '6px' }}>
                    {chiTestResult.expected_cell_count_assumption_met ? 'Assumption Met (All ≥ 5)' : 'Cell Count Low'}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {chiTestResult.fishers_exact_p !== null ? `Fisher's Exact p: ${chiTestResult.fishers_exact_p}` : 'Standard χ² valid'}
                  </span>
                </div>
              </div>

              {/* Contingency Table */}
              <div className="table-container" style={{ marginBottom: '20px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{chiTestResult.feature_name} Category</th>
                      <th>Retained (Obs / Exp)</th>
                      <th>Churned (Obs / Exp)</th>
                      <th>Row Total</th>
                      <th>Observed Churn Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chiTestResult.contingency_table.map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{row.category}</td>
                        <td>{row.churn_no_observed} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>(exp: {row.churn_no_expected})</span></td>
                        <td>{row.churn_yes_observed} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>(exp: {row.churn_yes_expected})</span></td>
                        <td>{row.total.toLocaleString()}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: row.churn_rate > 0.3 ? 'var(--risk-high)' : 'var(--risk-low)' }}>
                            {(row.churn_rate * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Academic Interpretation */}
              <div style={{ borderLeft: '3px solid var(--accent-secondary)', paddingLeft: '14px' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Formal Academic Conclusion</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {chiTestResult.plain_language_interpretation}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ODDS RATIOS (LOGISTIC REGRESSION) */}
      {activeTab === 'odds' && (
        <div className="card animate-fade">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <div className="card-title">
                <TrendingUp size={18} color="var(--accent-primary)" />
                Fitted Logistic Regression Odds Ratios (OR = exp(β))
              </div>
              <div className="card-subtitle">
                Formula: ln(p / (1 - p)) = β₀ + Σ βⱼXⱼ | Computed with 95% Wald Confidence Intervals
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong>Statistical Interpretation Guide:</strong> An <strong>Odds Ratio (OR) &gt; 1</strong> signifies that customers with this attribute possess increased odds of churn compared to the reference baseline. Conversely, an <strong>OR &lt; 1</strong> signifies a protective retention anchor. All estimates hold other modeled predictors constant.
          </div>

          {oddsLoading ? (
            <LoadingSkeleton rows={10} height="32px" />
          ) : oddsResponse ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Feature Attribute</th>
                    <th>Coefficient (β)</th>
                    <th>Odds Ratio (e^β)</th>
                    <th>95% Confidence Interval</th>
                    <th>Direction / Impact</th>
                    <th>Substantive Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {oddsResponse.odds_ratios.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.feature}</td>
                      <td style={{ fontFeatureSettings: '"tnum"', color: 'var(--text-secondary)' }}>
                        {item.raw_coefficient > 0 ? `+${item.raw_coefficient.toFixed(4)}` : item.raw_coefficient.toFixed(4)}
                      </td>
                      <td style={{ fontFeatureSettings: '"tnum"', fontWeight: 700, fontSize: '0.95rem', color: item.odds_ratio > 1.05 ? 'var(--risk-high)' : item.odds_ratio < 0.95 ? 'var(--risk-low)' : 'var(--text-primary)' }}>
                        {item.odds_ratio.toFixed(3)}
                      </td>
                      <td style={{ fontFeatureSettings: '"tnum"', color: 'var(--text-muted)' }}>
                        [{item.ci_lower.toFixed(3)} - {item.ci_upper.toFixed(3)}]
                      </td>
                      <td>
                        <span className={`badge ${item.odds_ratio > 1.05 ? 'badge-high' : item.odds_ratio < 0.95 ? 'badge-low' : 'badge-neutral'}`}>
                          {item.direction}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.plain_meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 3: SIGMOID MATH & LOG-ODDS EXPLORER */}
      {activeTab === 'sigmoid' && (
        <div className="card animate-fade">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div>
              <div className="card-title">
                <Calculator size={18} color="var(--accent-primary)" />
                Sigmoid Activation &amp; Log-Odds Explorer
              </div>
              <div className="card-subtitle">
                Interactive mathematical intuition for the binary logit mapping
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'center' }}>
            {/* Interactive Slider & Formula */}
            <div style={{ background: 'var(--bg-surface-2)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sigmoid Formulation</span>
                <div style={{ fontSize: '1.05rem', fontFamily: 'monospace', color: '#A5B4FC', margin: '6px 0', padding: '10px', background: 'var(--bg-surface-1)', borderRadius: 'var(--radius-md)' }}>
                  P(Y = 1 | z) = 1 / (1 + e^−z)
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  where z = β₀ + β₁X₁ + ... + βₖXₖ represents the linear predictor (log-odds).
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                  <span>Fitted Log-Odds (z):</span>
                  <strong style={{ color: 'var(--accent-primary)' }}>{simZ.toFixed(2)}</strong>
                </div>
                <input
                  type="range"
                  min={-5.0}
                  max={5.0}
                  step={0.1}
                  value={simZ}
                  onChange={(e) => setSimZ(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated Churn Probability</span>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: activeSigmoidProb > 0.5 ? 'var(--risk-high)' : 'var(--risk-low)', marginTop: '4px' }}>
                  {(activeSigmoidProb * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Decision Boundary: {activeSigmoidProb >= 0.5 ? 'Classified Churn (Yes)' : 'Classified Retained (No)'}
                </div>
              </div>
            </div>

            {/* Sigmoid Graph */}
            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sigmoidData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="z" stroke="var(--text-muted)" fontSize={12} label={{ value: 'Linear Predictor z (Log-Odds)', position: 'insideBottom', offset: -10, fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 1]} label={{ value: 'Probability P(Y=1|z)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Probability']}
                    contentStyle={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="prob" stroke="#6366F1" strokeWidth={3} dot={false} name="Sigmoid Curve" />
                  <ReferenceDot x={simZ} y={activeSigmoidProb} r={7} fill="#F43F5E" stroke="#FFFFFF" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
