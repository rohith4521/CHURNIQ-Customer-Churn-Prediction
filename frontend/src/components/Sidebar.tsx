import React from 'react';
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  FlaskConical,
  Sigma,
  Presentation,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}) => {
  const menuItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'explorer', label: 'Customer Explorer', icon: Users },
    { id: 'predict', label: 'Predict Workspace', icon: BrainCircuit },
    { id: 'models', label: 'Model Laboratory', icon: FlaskConical },
    { id: 'statistics', label: 'Statistical Lab', icon: Sigma },
    { id: 'presentation', label: 'PBL Defense Mode', icon: Presentation },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div
        style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Sparkles size={18} color="#FFFFFF" />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#FFF' }}>CHURNIQ</span>
              <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)', lineHeight: 1 }}>
                PBL PLATFORM
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav List */}
      <nav style={{ padding: '16px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? '#A5B4FC' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
              }}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '6px',
                    bottom: '6px',
                    width: '3px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: 'var(--accent-primary)',
                  }}
                />
              )}
              <Icon size={19} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Academic PBL Tag */}
      {!collapsed && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Academic Evaluation:</strong><br />
            Logistic Regression & Support Vector Machines (PBL 2K26)
          </p>
        </div>
      )}
    </aside>
  );
};
