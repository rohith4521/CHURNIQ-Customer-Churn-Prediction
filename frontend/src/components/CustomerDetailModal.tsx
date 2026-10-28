import React from 'react';
import { X, User, DollarSign, Calendar, Shield, Wifi, Phone, CreditCard, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CustomerRecord } from '../types';
import { RiskBadge } from './RiskBadge';

interface CustomerDetailModalProps {
  customer: CustomerRecord | null;
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, onClose }) => {
  if (!customer) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Customer Profile</h2>
              <span className="badge badge-accent">{customer.customerID}</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Observed Status: <strong style={{ color: customer.Churn === 'Yes' ? 'var(--risk-high)' : 'var(--risk-low)' }}>{customer.Churn === 'Yes' ? 'Churned' : 'Retained'}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Churn Prediction Banner */}
        <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Model Churn Risk Assessment
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
                {customer.predicted_probability !== null && customer.predicted_probability !== undefined
                  ? `${(customer.predicted_probability * 100).toFixed(1)}% Probability`
                  : 'Assessed at Inference'}
              </div>
            </div>
            <RiskBadge tier={customer.risk_tier} probability={customer.predicted_probability} />
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {/* Demographic Section */}
          <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: 'var(--accent-secondary)' }}>
              <User size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Demographics</strong>
            </div>
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>Gender: <span style={{ color: 'var(--text-primary)' }}>{customer.gender}</span></div>
              <div>Senior Citizen: <span style={{ color: 'var(--text-primary)' }}>{customer.SeniorCitizen === 1 ? 'Yes' : 'No'}</span></div>
              <div>Partner: <span style={{ color: 'var(--text-primary)' }}>{customer.Partner}</span></div>
              <div>Dependents: <span style={{ color: 'var(--text-primary)' }}>{customer.Dependents}</span></div>
            </div>
          </div>

          {/* Account & Billing */}
          <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: 'var(--accent-primary)' }}>
              <DollarSign size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Billing & Contract</strong>
            </div>
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>Contract: <span style={{ color: 'var(--text-primary)' }}>{customer.Contract}</span></div>
              <div>Tenure: <span style={{ color: 'var(--text-primary)' }}>{customer.tenure} months</span></div>
              <div>Monthly Charges: <span style={{ color: 'var(--text-primary)' }}>${customer.MonthlyCharges.toFixed(2)}</span></div>
              <div>Total Charges: <span style={{ color: 'var(--text-primary)' }}>${customer.TotalCharges.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Telecom Services */}
          <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#38BDF8' }}>
              <Phone size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Phone & Internet</strong>
            </div>
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>Phone Service: <span style={{ color: 'var(--text-primary)' }}>{customer.PhoneService}</span></div>
              <div>Multiple Lines: <span style={{ color: 'var(--text-primary)' }}>{customer.MultipleLines}</span></div>
              <div>Internet Service: <span style={{ color: 'var(--text-primary)' }}>{customer.InternetService}</span></div>
              <div>Payment: <span style={{ color: 'var(--text-primary)' }}>{customer.PaymentMethod}</span></div>
            </div>
          </div>

          {/* Value Added Services */}
          <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#34D399' }}>
              <Shield size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Support & Security</strong>
            </div>
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>Online Security: <span style={{ color: 'var(--text-primary)' }}>{customer.OnlineSecurity}</span></div>
              <div>Tech Support: <span style={{ color: 'var(--text-primary)' }}>{customer.TechSupport}</span></div>
              <div>Device Protection: <span style={{ color: 'var(--text-primary)' }}>{customer.DeviceProtection}</span></div>
              <div>Cloud Backup: <span style={{ color: 'var(--text-primary)' }}>{customer.OnlineBackup}</span></div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
