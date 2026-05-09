import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export interface DashboardData {
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
  latestNews: { title: string; description: string; status: string; createdAt: string } | null;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data: r } = await api.get<{ success: boolean; message?: string; data: DashboardData }>('/api/dashboard/home');
      if (r.success) setData(r.data);
      else setError(r.message || 'Failed to load dashboard data');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
