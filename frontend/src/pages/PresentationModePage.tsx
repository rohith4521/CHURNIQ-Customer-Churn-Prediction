import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Presentation,
  Sparkles,
  Layers,
  Activity,
  CheckCircle,
  HelpCircle,
  BarChart,
  BrainCircuit,
} from 'lucide-react';
import { PresentationData, PresentationSlide } from '../types';
import { api } from '../services/api';

interface PresentationModePageProps {
  onExit: () => void;
}

export const PresentationModePage: React.FC<PresentationModePageProps> = ({ onExit }) => {
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Live inference demo state for Slide 8
  const [demoTenure, setDemoTenure] = useState<number>(4);
  const [demoContract, setDemoContract] = useState<string>('Month-to-month');
  const [demoProbability, setDemoProbability] = useState<number>(0.742);
  const [demoCalculating, setDemoCalculating] = useState<boolean>(false);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const data = await api.getPresentationSlides();
        setPresentation(data);
      } catch (err) {
        console.error('Failed to load presentation slides', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  // Keyboard navigation (Left / Right arrow keys & Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlideIndex((prev) => (presentation ? Math.min(presentation.slides.length - 1, prev + 1) : prev));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentation, onExit]);

  const handleRunLiveDemo = async () => {
    setDemoCalculating(true);
    try {
      const res = await api.predictCustomer({
        gender: 'Female',
        SeniorCitizen: 0,
        Partner: 'No',
        Dependents: 'No',
        tenure: demoTenure,
        PhoneService: 'Yes',
        MultipleLines: 'No',
        InternetService: 'Fiber optic',
        OnlineSecurity: 'No',
        OnlineBackup: 'No',
        DeviceProtection: 'No',
        TechSupport: 'No',
        StreamingTV: 'Yes',
        StreamingMovies: 'No',
        Contract: demoContract,
        PaperlessBilling: 'Yes',
        PaymentMethod: 'Electronic check',
        MonthlyCharges: 79.5,
        TotalCharges: demoTenure * 79.5,
        model_type: 'logistic_regression',
      });
      setDemoProbability(res.primary_prediction.probability);
    } catch (e) {
      console.error(e);
    } finally {
      setDemoCalculating(false);
    }
  };

  if (loading || !presentation) {
    return (
      <div className="presentation-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Academic Defense Deck...</p>
      </div>
    );
  }

  const slide: PresentationSlide = presentation.slides[currentSlideIndex];
  const progressPercent = ((currentSlideIndex + 1) / presentation.slides.length) * 100;

  return (
    <div className="presentation-container animate-fade">
      {/* Top Slide Control Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Presentation size={20} color="#FFFFFF" />
          </div>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>CHURNIQ</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
              Academic PBL Defense (Slide {currentSlideIndex + 1} of {presentation.slides.length})
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Use ← → keys to navigate</span>
          <button
            onClick={onExit}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <X size={15} /> Exit Defense Mode
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '4px', background: 'var(--bg-surface-3)', borderRadius: '2px', marginBottom: '24px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #6366F1, #06B6D4)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Main Slide Card */}
      <div className="slide-card animate-fade">
        {/* Slide Title & Subtitle */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-accent" style={{ fontSize: '0.8rem' }}>
              Module {slide.id}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PBL Evaluation Matrix</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            {slide.title}
          </h1>
          <h3 style={{ fontSize: '1.25rem', color: '#A5B4FC', fontWeight: 500, marginBottom: '28px' }}>
            {slide.subtitle}
          </h3>

          {/* Slide Narrative */}
          <p style={{ fontSize: '1.18rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '1100px', marginBottom: '36px' }}>
            {slide.content}
          </p>

          {/* Slide 8 Special: Live Interactive Demonstration */}
          {slide.id === 8 && (
            <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '36px', maxWidth: '850px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--accent-primary)' }}>
                <BrainCircuit size={20} />
                <strong style={{ fontSize: '1.05rem' }}>Live Model Inference Demonstration</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'center' }}>
                <div>
                  <label className="form-label">Customer Tenure (Months)</label>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={demoTenure}
                    onChange={(e) => setDemoTenure(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{demoTenure} Months</span>
                </div>
                <div>
                  <label className="form-label">Contract Type</label>
                  <select
                    value={demoContract}
                    onChange={(e) => setDemoContract(e.target.value)}
                    className="form-select"
                  >
                    <option value="Month-to-month">Month-to-month</option>
                    <option value="One year">One year</option>
                    <option value="Two year">Two year</option>
                  </select>
                </div>
                <div>
                  <button onClick={handleRunLiveDemo} disabled={demoCalculating} className="btn btn-primary" style={{ width: '100%', height: '39px' }}>
                    {demoCalculating ? 'Calculating...' : 'Run Live Inference'}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg-surface-1)', padding: '12px 18px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Churn Probability:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: demoProbability > 0.5 ? 'var(--risk-high)' : 'var(--risk-low)' }}>
                  {(demoProbability * 100).toFixed(1)}%
                </span>
                <span className={`badge ${demoProbability > 0.5 ? 'badge-high' : 'badge-low'}`}>
                  {demoProbability > 0.5 ? 'High Risk' : 'Retained'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '28px' }}>
          {slide.key_metrics.map((km, i) => (
            <div key={i} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                {km.label}
              </span>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                {km.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide Navigation Bottom Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
        <button
          onClick={() => setCurrentSlideIndex((p) => Math.max(0, p - 1))}
          disabled={currentSlideIndex === 0}
          className="btn btn-secondary"
          style={{ opacity: currentSlideIndex === 0 ? 0.4 : 1 }}
        >
          <ChevronLeft size={18} /> Previous Slide
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {presentation.slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                border: 'none',
                background: currentSlideIndex === idx ? 'var(--accent-primary)' : 'var(--bg-surface-3)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlideIndex((p) => Math.min(presentation.slides.length - 1, p + 1))}
          disabled={currentSlideIndex === presentation.slides.length - 1}
          className="btn btn-primary"
          style={{ opacity: currentSlideIndex === presentation.slides.length - 1 ? 0.4 : 1 }}
        >
          Next Slide <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
