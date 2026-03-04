'use client';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { usePortal } from '@/contexts/PortalContext';
import { usePortalData } from '@/hooks/usePortalData';
import { ChartSkeleton } from '@/components/portal/PortalSkeleton';

interface AnalyticsData {
  nationalityBreakdown: { name: string; value: number; color: string }[];
  bookingTrend: { month: string; bookings: number; views: number }[];
  channelData: { channel: string; visitors: number }[];
  channelRecommendations: { country: string; flag: string; channels: string[]; primary: string }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-lg bg-dark-highlight text-sm border border-dark-highlight">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[#B3B3B3]">{entry.name}: </span>
            <span className="font-medium text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { activeProperty, currentMonth } = usePortal();
  const { data, isLoading } = usePortalData<AnalyticsData>({
    endpoint: 'analytics',
    propertyId: activeProperty?.id,
    month: currentMonth,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">분석</h1>
          <p className="text-[#B3B3B3]">게스트 데이터와 채널 성과를 확인하세요</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  const { nationalityBreakdown, bookingTrend, channelData, channelRecommendations } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">분석</h1>
        <p className="text-[#B3B3B3]">게스트 데이터와 채널 성과를 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nationality donut */}
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <h3 className="text-sm font-semibold mb-4">게스트 국적 비율</h3>
          <div className="flex items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={nationalityBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {nationalityBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {nationalityBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-[#B3B3B3]">{item.name}</span>
                  <span className="text-sm font-semibold ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Channel recommendations */}
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <h3 className="text-sm font-semibold mb-4">국적별 추천 채널</h3>
          <div className="space-y-4">
            {channelRecommendations.map((rec) => (
              <div key={rec.country} className="flex items-center gap-4 p-3 rounded-xl bg-dark-highlight">
                <span className="text-2xl">{rec.flag}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{rec.country}</div>
                  <div className="text-xs text-[#6A6A6A]">{rec.channels.join(', ')}</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent-gradient text-white">
                  {rec.primary}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking trend line chart */}
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <h3 className="text-sm font-semibold mb-4">월별 예약 추이</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                <XAxis dataKey="month" stroke="#6A6A6A" fontSize={12} />
                <YAxis stroke="#6A6A6A" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', r: 4 }}
                  name="예약"
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#6366F1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="조회수"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel bar chart */}
        <div className="p-6 rounded-2xl bg-dark-elevated">
          <h3 className="text-sm font-semibold mb-4">채널별 유입</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#282828" horizontal={false} />
                <XAxis type="number" stroke="#6A6A6A" fontSize={12} />
                <YAxis type="category" dataKey="channel" stroke="#6A6A6A" fontSize={12} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="visitors" name="방문자" fill="#8B5CF6" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
