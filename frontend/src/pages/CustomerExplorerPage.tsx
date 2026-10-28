import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Users,
} from 'lucide-react';
import { CustomerRecord, CustomerListResponse } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { CustomerDetailModal } from '../components/CustomerDetailModal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const CustomerExplorerPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [contractFilter, setContractFilter] = useState<string>('all');
  const [internetFilter, setInternetFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [churnFilter, setChurnFilter] = useState<string>('all');
  const [riskTierFilter, setRiskTierFilter] = useState<string>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<string>('customerID');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal inspection
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCustomers({
        search,
        contract: contractFilter,
        internet_service: internetFilter,
        payment_method: paymentFilter,
        churn: churnFilter,
        risk_tier: riskTierFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        page_size: pageSize,
      });
      setCustomers(res.customers);
      setTotalCount(res.total_count);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [
    currentPage,
    pageSize,
    contractFilter,
    internetFilter,
    paymentFilter,
    churnFilter,
    riskTierFilter,
    sortBy,
    sortOrder,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomers();
  };

  const handleSortToggle = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const headers = [
      'customerID',
      'gender',
      'SeniorCitizen',
      'Contract',
      'tenure',
      'MonthlyCharges',
      'TotalCharges',
      'InternetService',
      'PaymentMethod',
      'Churn',
      'predicted_probability',
      'risk_tier',
    ];
    const rows = customers.map((c) => [
      c.customerID,
      c.gender,
      c.SeniorCitizen,
      `"${c.Contract}"`,
      c.tenure,
      c.MonthlyCharges,
      c.TotalCharges,
      `"${c.InternetService}"`,
      `"${c.PaymentMethod}"`,
      c.Churn,
      c.predicted_probability ?? '',
      c.risk_tier ?? '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `churniq_customers_page_${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-wrapper animate-fade">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Customer Intelligence Explorer</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Filter, search, sort, and inspect individual customer churn probability assessments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" title="Export current view to CSV">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={fetchCustomers} className="btn btn-secondary btn-sm" title="Refresh table">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
          {/* Search by ID */}
          <div>
            <label className="form-label">Search Customer ID</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="e.g. 7590-VHVEG"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '34px' }}
              />
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '11px', top: '11px' }} />
            </div>
          </div>

          {/* Contract Filter */}
          <div>
            <label className="form-label">Contract Type</label>
            <select value={contractFilter} onChange={(e) => { setContractFilter(e.target.value); setCurrentPage(1); }} className="form-select">
              <option value="all">All Contracts</option>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>
          </div>

          {/* Internet Service Filter */}
          <div>
            <label className="form-label">Internet Service</label>
            <select value={internetFilter} onChange={(e) => { setInternetFilter(e.target.value); setCurrentPage(1); }} className="form-select">
              <option value="all">All Services</option>
              <option value="DSL">DSL</option>
              <option value="Fiber optic">Fiber optic</option>
              <option value="No">No Internet</option>
            </select>
          </div>

          {/* Observed Churn Filter */}
          <div>
            <label className="form-label">Observed Churn</label>
            <select value={churnFilter} onChange={(e) => { setChurnFilter(e.target.value); setCurrentPage(1); }} className="form-select">
              <option value="all">All (Yes &amp; No)</option>
              <option value="Yes">Observed Churned (Yes)</option>
              <option value="No">Observed Retained (No)</option>
            </select>
          </div>

          {/* Risk Tier Filter */}
          <div>
            <label className="form-label">Model Risk Tier</label>
            <select value={riskTierFilter} onChange={(e) => { setRiskTierFilter(e.target.value); setCurrentPage(1); }} className="form-select">
              <option value="all">All Risk Tiers</option>
              <option value="High">High Risk (&gt;65%)</option>
              <option value="Medium">Medium Risk (35-65%)</option>
              <option value="Low">Low Risk (&lt;35%)</option>
            </select>
          </div>

          {/* Search Trigger */}
          <div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '39px' }}>
              <Filter size={15} /> Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', color: 'var(--risk-high)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Customer Data Table */}
      <div className="table-container" style={{ marginBottom: '18px' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>
            <LoadingSkeleton rows={10} height="28px" />
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3>No Customer Records Found</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSortToggle('customerID')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Customer ID <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSortToggle('Contract')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Contract <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSortToggle('tenure')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Tenure <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSortToggle('MonthlyCharges')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Monthly <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSortToggle('TotalCharges')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Total <ArrowUpDown size={13} />
                  </div>
                </th>
                <th>Internet</th>
                <th>Payment</th>
                <th>Observed</th>
                <th>Model Prediction</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.customerID} className="clickable" onClick={() => setSelectedCustomer(c)}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{c.customerID}</td>
                  <td>{c.Contract}</td>
                  <td>{c.tenure} mo</td>
                  <td>${c.MonthlyCharges.toFixed(2)}</td>
                  <td>${c.TotalCharges.toFixed(2)}</td>
                  <td>{c.InternetService}</td>
                  <td>{c.PaymentMethod.replace(' (automatic)', '')}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: c.Churn === 'Yes' ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)',
                        color: c.Churn === 'Yes' ? 'var(--risk-high)' : 'var(--risk-low)',
                      }}
                    >
                      {c.Churn === 'Yes' ? 'Churned' : 'Retained'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RiskBadge tier={c.risk_tier} probability={c.predicted_probability} showIcon={false} />
                      {c.predicted_probability !== null && c.predicted_probability !== undefined && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFeatureSettings: '"tnum"' }}>
                          {(c.predicted_probability * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(c);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px' }}
                      title="Inspect full customer profile"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{(currentPage - 1) * pageSize + (customers.length > 0 ? 1 : 0)}</strong> to{' '}
          <strong>{(currentPage - 1) * pageSize + customers.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> accounts
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="form-select"
              style={{ width: '70px', padding: '4px 8px', fontSize: '0.8rem' }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px' }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 10px' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Inspection Modal */}
      <CustomerDetailModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
    </div>
  );
};
