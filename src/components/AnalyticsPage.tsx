import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AIInsights } from './AIInsights';
import { BarChart3, Users, Eye, Activity, MousePointer, ArrowUp, ArrowDown } from 'lucide-react';

type Event = {
  id: string;
  eventType: string;
  path?: string;
  fullUrl?: string;
  referrer?: string;
  sessionId?: string;
  email?: string;
  lang?: string;
  tz?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  duration_ms?: number;
  createdAt?: Timestamp;
  metadata?: Record<string, any>;
  domain?: string;
};

type TimeRange = '7d' | '30d' | '90d';

function getRangeDays(range: TimeRange): number {
  return range === '7d' ? 7 : range === '30d' ? 30 : 90;
}

function formatPercent(n: number): string {
  return `${Math.round(n)}%`;
}

function calcPercent(part: number, total: number): number {
  return total ? (part / total) * 100 : 0;
}

export function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>('30d');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  useEffect(() => {
    fetchEvents();
  }, [range]);

  const fetchEvents = async () => {
    setLoading(true);
    const days = getRangeDays(range);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const eventsRef = collection(db, 'events');
      const querySnapshot = await getDocs(eventsRef);

      const eventsData: Event[] = [];
      querySnapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() } as Event);
      });

      const filtered = eventsData.filter((ev) => {
        if (!ev.createdAt) return true;
        const timestamp = ev.createdAt.toDate();
        return timestamp >= since;
      });

      setEvents(filtered);

      // Extract unique domains for filter
      const domains = new Set(filtered.map(e => e.domain).filter(Boolean));
      if (domains.size > 0 && selectedDomain === 'all') {
        // Keep 'all' as default
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    // Filter by domain
    const filteredEvents = selectedDomain === 'all'
      ? events
      : events.filter(e => e.domain === selectedDomain);

    const sessionSet = new Set(filteredEvents.map((e) => e.sessionId).filter(Boolean));
    const sessions = sessionSet.size;

    const userSet = new Set(
      filteredEvents.map((e) => (e.email || '').toLowerCase()).filter(Boolean)
    );
    const users = userSet.size;

    const pageViews = filteredEvents.filter((e) => e.eventType === 'page_view').length;

    const durations = filteredEvents
      .filter((e) => e.eventType === 'session_end' && typeof e.duration_ms === 'number')
      .map((e) => e.duration_ms as number);

    const avgSessionMs = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const avgMinutes = Math.floor(avgSessionMs / 1000 / 60);
    const avgSeconds = Math.round((avgSessionMs / 1000) % 60);

    const pageCounts: Record<string, number> = {};
    filteredEvents
      .filter((e) => e.eventType === 'page_view')
      .forEach((e) => {
        const p = e.path || '/';
        pageCounts[p] = (pageCounts[p] || 0) + 1;
      });

    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const refCounts: Record<string, number> = {};
    filteredEvents.forEach((e) => {
      if (e.referrer) {
        try {
          const u = new URL(e.referrer);
          const host = u.hostname.replace(/^www\./, '');
          refCounts[host] = (refCounts[host] || 0) + 1;
        } catch {
          const h = (e.referrer || '').slice(0, 80) || '(direct)';
          refCounts[h] = (refCounts[h] || 0) + 1;
        }
      } else {
        refCounts['(direct)'] = (refCounts['(direct)'] || 0) + 1;
      }
    });

    const topReferrers = Object.entries(refCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const utmCounts: Record<string, number> = {};
    filteredEvents.forEach((e) => {
      const key = [e.utm_source || '', e.utm_medium || '', e.utm_campaign || '']
        .join(' / ')
        .trim() || '(none)';
      utmCounts[key] = (utmCounts[key] || 0) + 1;
    });

    const topUTM = Object.entries(utmCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const visits = pageViews;
    const login = filteredEvents.filter((e) => e.eventType === 'login_success').length;
    const created = filteredEvents.filter((e) => e.eventType === 'booking_created').length;
    const completed = filteredEvents.filter((e) => e.eventType === 'booking_completed').length;

    const funnel = {
      visits,
      login,
      created,
      completed,
      p_login: calcPercent(login, visits),
      p_created: calcPercent(created, visits),
      p_completed: calcPercent(completed, visits),
    };

    const dayMap: Record<string, { date: string; pageViews: number; sessions: Set<string> }> = {};

    filteredEvents.forEach((e) => {
      if (!e.createdAt) return;
      const d = e.createdAt.toDate();
      const key = d.toISOString().slice(0, 10);

      if (!dayMap[key]) {
        dayMap[key] = { date: key, pageViews: 0, sessions: new Set() };
      }
      if (e.eventType === 'page_view') {
        dayMap[key].pageViews += 1;
      }
      if (e.sessionId) {
        dayMap[key].sessions.add(e.sessionId);
      }
    });

    const dailySeries = Object.values(dayMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((row) => ({
        date: row.date,
        pageViews: row.pageViews,
        sessions: row.sessions.size,
      }));

    return {
      sessions,
      users,
      pageViews,
      avgMinutes,
      avgSeconds,
      topPages,
      topReferrers,
      topUTM,
      funnel,
      dailySeries,
    };
  }, [events, selectedDomain]);

  const availableDomains = useMemo(() => {
    const domains = new Set(events.map(e => e.domain).filter(Boolean));
    return ['all', ...Array.from(domains)].sort();
  }, [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition"
          >
            {availableDomains.map((domain) => (
              <option key={domain} value={domain}>
                {domain === 'all' ? 'All Domains' : domain}
              </option>
            ))}
          </select>

          <div className="h-6 w-px bg-gray-300"></div>

          <button
            onClick={() => setRange('7d')}
            className={`px-4 py-2 rounded-lg transition ${
              range === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setRange('30d')}
            className={`px-4 py-2 rounded-lg transition ${
              range === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setRange('90d')}
            className={`px-4 py-2 rounded-lg transition ${
              range === '90d'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.users}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          change="+12.5%"
          changeType="up"
        />
        <StatCard
          title="Sessions"
          value={stats.sessions}
          icon={<Activity className="w-6 h-6" />}
          color="green"
          change="+8.3%"
          changeType="up"
        />
        <StatCard
          title="Page Views"
          value={stats.pageViews}
          icon={<Eye className="w-6 h-6" />}
          color="purple"
          change="+15.7%"
          changeType="up"
        />
        <StatCard
          title="Avg Session"
          value={`${stats.avgMinutes}m ${stats.avgSeconds}s`}
          icon={<MousePointer className="w-6 h-6" />}
          color="orange"
          change="-2.1%"
          changeType="down"
        />
      </div>

      <AIInsights stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Conversion Funnel
          </h3>
          <div className="space-y-3">
            <FunnelStep
              label="Visits"
              count={stats.funnel.visits}
              percent={100}
              color="bg-gray-800"
            />
            <FunnelStep
              label="Login"
              count={stats.funnel.login}
              percent={stats.funnel.p_login}
              color="bg-blue-600"
            />
            <FunnelStep
              label="Booking Created"
              count={stats.funnel.created}
              percent={stats.funnel.p_created}
              color="bg-yellow-500"
            />
            <FunnelStep
              label="Booking Completed"
              count={stats.funnel.completed}
              percent={stats.funnel.p_completed}
              color="bg-green-600"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Daily Activity
          </h3>
          {stats.dailySeries.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.dailySeries.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between text-sm border-b border-gray-100 pb-2"
                >
                  <span className="text-gray-600">{day.date}</span>
                  <div className="flex gap-4">
                    <span className="text-blue-600">{day.sessions} sessions</span>
                    <span className="text-green-600">{day.pageViews} views</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No activity data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DataTable title="Top Pages" data={stats.topPages} />
        <DataTable title="Top Referrers" data={stats.topReferrers} />
        <DataTable title="UTM Campaigns" data={stats.topUTM} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  change,
  changeType,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
}) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200',
    green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600 border-green-200',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 border-purple-200',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 border-orange-200',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`inline-flex p-3 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            changeType === 'up' ? 'text-green-600' : changeType === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {changeType === 'up' && <ArrowUp className="w-3 h-3" />}
            {changeType === 'down' && <ArrowDown className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
    </div>
  );
}

function FunnelStep({
  label,
  count,
  percent,
  color,
}: {
  label: string;
  count: number;
  percent: number;
  color: string;
}) {
  const width = Math.max(6, Math.min(100, Math.round(percent)));

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-gray-900">{label}</span>
        <span className="text-xs text-gray-600">
          {count} • {formatPercent(percent)}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function DataTable({ title, data }: { title: string; data: [string, number][] }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      {data.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {data.map(([key, count]) => (
            <li
              key={key}
              className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
            >
              <span className="truncate max-w-[70%] text-gray-700" title={key}>
                {key}
              </span>
              <span className="text-gray-600 font-medium">{count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 text-center py-8">No data yet</p>
      )}
    </div>
  );
}
