import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import Marquee from "react-fast-marquee";
import { Wallet, Users, Settings, TrendingUp, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { getUserRole } from "../utils/Auth";
import { UserRole } from "../constants/Roles";
import { api } from "../api/client";

/* ── design tokens ── */
const D = {
  bg: '#0a0a0c',
  surface: '#111113',
  surfaceHover: '#18181b',
  border: '#27272a',
  text: '#f4f4f5',
  textMuted: '#71717a',
  textSubtle: '#52525b',
  green: '#16a34a',
  greenLight: '#4ade80',
  greenDim: 'rgba(22,163,74,0.12)',
};

interface DashboardData {
  companyName: string;
  image: string;
  role: string;
  balance: number;
  totalReseller: number;
  totalUsers: number;
  totalCampaigns: number;
  totalMessages: number;
  weeklyStats: Array<{ weekRange: string; totalCampaigns: number; totalMessages: number }>;
  topFiveCampaigns: Array<{ _id: string; campaignName: string; numberCount: number; status: string; createdAt: string }>;
  latestNews: { title: string; description: string; status: string; createdAt: string };
}

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 12, padding: '20px 24px', ...style,
  }}>
    {children}
  </div>
);

const StatCard = ({
  label, value, icon: Icon, iconBg, iconColor,
}: {
  label: string; value: string | number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  iconBg: string; iconColor: string;
}) => (
  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: iconBg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, color: D.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          {label}
        </p>
        <p style={{ fontSize: 24, fontWeight: 700, color: D.text, lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  </Card>
);

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { weekRange: string; totalCampaigns: number; totalMessages: number }; value: number; dataKey: string }>;
}) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div style={{
      background: '#18181b', border: `1px solid ${D.border}`,
      borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 6 }}>{data.weekRange}</p>
      <p style={{ fontSize: 13, color: '#60a5fa', fontWeight: 600, marginBottom: 2 }}>Campaigns: {data.totalCampaigns}</p>
      <p style={{ fontSize: 13, color: D.greenLight, fontWeight: 600 }}>Messages: {data.totalMessages}</p>
    </div>
  );
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [chartHeight, setChartHeight] = useState(320);
  const userRole = getUserRole();

  useEffect(() => {
    const handleResize = () => {
      setChartHeight(window.innerWidth < 640 ? 220 : window.innerWidth < 1024 ? 260 : 320);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: result } = await api.get<{ success: boolean; message?: string; data: DashboardData }>("/api/dashboard/home");
      if (result.success) setDashboardData(result.data);
      else setError(result.message || "Failed to load dashboard data");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke={D.greenLight} strokeWidth="4" />
            <path style={{ opacity: 0.75 }} fill={D.greenLight} d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p style={{ color: D.textMuted, fontSize: 14 }}>Loading dashboard…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 4 }}>
        <div style={{
          padding: '12px 16px', background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10,
        }}>
          <p style={{ color: '#f87171', fontSize: 14 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const isAdminOrReseller = userRole === UserRole.ADMIN || userRole === UserRole.RESELLER;

  const statCards = [
    {
      show: true,
      label: userRole === UserRole.ADMIN ? 'Total Messages Reached' : 'Available Balance',
      value: userRole === UserRole.ADMIN ? dashboardData.totalMessages : `₹${dashboardData.balance}`,
      icon: userRole === UserRole.ADMIN ? TrendingUp : Wallet,
      iconBg: userRole === UserRole.ADMIN ? 'rgba(248,113,113,0.12)' : 'rgba(22,163,74,0.12)',
      iconColor: userRole === UserRole.ADMIN ? '#f87171' : D.greenLight,
    },
    {
      show: isAdminOrReseller,
      label: 'Total Resellers',
      value: dashboardData.totalReseller,
      icon: Settings,
      iconBg: 'rgba(96,165,250,0.12)',
      iconColor: '#60a5fa',
    },
    {
      show: isAdminOrReseller,
      label: 'Total Users',
      value: dashboardData.totalUsers,
      icon: Users,
      iconBg: 'rgba(251,191,36,0.12)',
      iconColor: '#fbbf24',
    },
    {
      show: true,
      label: 'Total Campaigns',
      value: dashboardData.totalCampaigns,
      icon: TrendingUp,
      iconBg: 'rgba(167,139,250,0.12)',
      iconColor: '#a78bfa',
    },
  ].filter(c => c.show);

  const iconBtnStyle: React.CSSProperties = {
    padding: '6px 8px', background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${D.border}`, borderRadius: 8,
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    transition: 'background 0.15s',
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* News ticker */}
        {dashboardData.latestNews ? (
          <div style={{
            background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            <Marquee pauseOnHover gradient={false} speed={45}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '10px 20px' }}>
                <span style={{ color: D.greenLight, fontWeight: 600, fontSize: 13 }}>
                  {dashboardData.latestNews.title}
                </span>
                <span style={{ color: D.textMuted, fontSize: 13 }}>
                  • {dashboardData.latestNews.description}
                </span>
                <span style={{ color: D.textSubtle, fontSize: 12 }}>
                  {new Date(dashboardData.latestNews.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </Marquee>
          </div>
        ) : (
          <div style={{
            padding: '10px 16px', background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, textAlign: 'center',
          }}>
            <p style={{ color: '#fbbf24', fontSize: 13, fontWeight: 500 }}>No news available at the moment</p>
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statCards.length}, 1fr)`, gap: 16 }}
          className="grid-cols-adaptive">
          {statCards.map(c => (
            <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} iconBg={c.iconBg} iconColor={c.iconColor} />
          ))}
        </div>

        {/* Chart + Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="lg-two-col">
          {/* Bar chart */}
          <Card style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: D.text }}>Weekly Campaign Activity</p>
                <p style={{ fontSize: 12, color: D.textMuted, marginTop: 2 }}>Last 2 months</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={iconBtnStyle} onClick={() => setZoomLevel(v => Math.min(v + 0.2, 2))} title="Zoom In"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                  <ZoomIn size={14} color={D.textMuted} />
                </button>
                <button style={iconBtnStyle} onClick={() => setZoomLevel(v => Math.max(v - 0.2, 0.5))} title="Zoom Out"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                  <ZoomOut size={14} color={D.textMuted} />
                </button>
                <button style={iconBtnStyle} onClick={() => setZoomLevel(1)} title="Reset"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                  <Maximize2 size={14} color={D.textMuted} />
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 300, transform: window.innerWidth >= 640 ? `scale(${zoomLevel})` : 'scale(1)', transformOrigin: 'top left' }}>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart
                    data={dashboardData.weeklyStats}
                    margin={{ top: 5, right: 20, left: -10, bottom: window.innerWidth < 640 ? 60 : 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="weekRange"
                      stroke={D.textSubtle}
                      tick={{ fill: D.textMuted, fontSize: window.innerWidth < 640 ? 9 : 11 }}
                      angle={window.innerWidth < 640 ? -45 : 0}
                      textAnchor={window.innerWidth < 640 ? 'end' : 'middle'}
                      height={window.innerWidth < 640 ? 70 : 30}
                    />
                    <YAxis
                      stroke={D.textSubtle}
                      tick={{ fill: D.textMuted, fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22,163,74,0.06)' }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: D.textMuted, paddingTop: 12 }} />
                    <Bar dataKey="totalCampaigns" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Total Campaigns" />
                    <Bar dataKey="totalMessages" fill="#16a34a" radius={[6, 6, 0, 0]} name="Total Messages" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Recent campaigns table */}
          <Card>
            <p style={{ fontSize: 15, fontWeight: 600, color: D.text, marginBottom: 16 }}>Recent Campaigns</p>

            {/* Desktop table */}
            <div className="hidden sm:block" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                    {['#', 'Campaign', 'Messages', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.topFiveCampaigns.map((c, i) => (
                    <tr key={c._id} style={{ borderBottom: `1px solid rgba(39,39,42,0.6)` }}>
                      <td style={{ padding: '10px', fontSize: 13, color: D.textMuted }}>{i + 1}</td>
                      <td style={{ padding: '10px', fontSize: 13, color: D.text, fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.campaignName}</td>
                      <td style={{ padding: '10px', fontSize: 13, color: D.textMuted, textAlign: 'center' }}>{c.numberCount}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: D.greenLight, background: D.greenDim,
                          border: '1px solid rgba(22,163,74,0.25)',
                          padding: '3px 8px', borderRadius: 20,
                        }}>
                          {c.status || 'None'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {dashboardData.topFiveCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: D.textSubtle, fontSize: 13 }}>
                        No campaigns yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dashboardData.topFiveCampaigns.map((c, i) => (
                <div key={c._id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${D.border}`, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: D.textSubtle }}>#{i + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: D.greenLight, background: D.greenDim, padding: '2px 8px', borderRadius: 20 }}>
                      {c.status || 'None'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: D.text, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.campaignName}
                  </p>
                  <p style={{ fontSize: 12, color: D.textMuted }}>Messages: {c.numberCount}</p>
                </div>
              ))}
              {dashboardData.topFiveCampaigns.length === 0 && (
                <p style={{ textAlign: 'center', color: D.textSubtle, fontSize: 13, padding: 20 }}>No campaigns yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* responsive helpers */}
      <style>{`
        @media (min-width: 640px) {
          .grid-cols-adaptive { grid-template-columns: repeat(${statCards.length}, 1fr) !important; }
        }
        @media (max-width: 639px) {
          .grid-cols-adaptive { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .lg-two-col { grid-template-columns: 2fr 1fr !important; }
          .lg-two-col > *:first-child { grid-column: span 1 !important; }
        }
      `}</style>
    </>
  );
};

export default Dashboard;
