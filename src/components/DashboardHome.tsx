import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, type Booking, type Employee } from '../lib/firebase';
import { collection, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Users, Calendar, TrendingUp, Clock, ArrowUp, Package, MapPin, Phone, Award, Activity } from 'lucide-react';

type Event = {
  id: string;
  eventType: string;
  sessionId?: string;
  createdAt?: any;
  metadata?: Record<string, any>;
};

type DashboardHomeProps = {
  onPageChange?: (page: 'bookings' | 'employees' | 'analytics') => void;
};

export function DashboardHome({ onPageChange }: DashboardHomeProps = {}) {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalBookings: 0,
    pendingBookings: 0,
    inProgressBookings: 0,
  });
  const [latestBooking, setLatestBooking] = useState<Booking | null>(null);
  const [topEmployee, setTopEmployee] = useState<Employee | null>(null);
  const [activeSessions, setActiveSessions] = useState(0);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);

  useEffect(() => {
    const unsubscribeEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];

      setStats(prev => ({ ...prev, totalEmployees: employees.length }));

      if (employees.length > 0) {
        const sortedByTasks = [...employees].sort((a, b) => b.tasksCompleted - a.tasksCompleted);
        setTopEmployee(sortedByTasks[0]);
      }
    });

    const unsubscribeBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];

      setStats(prev => ({
        ...prev,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        inProgressBookings: bookings.filter(b => b.status === 'in_progress').length,
      }));

      if (bookings.length > 0) {
        const sorted = [...bookings].sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });
        setLatestBooking(sorted[0]);
      }
    });

    const unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];

      setRecentEvents(events.slice(0, 10));

      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      const uniqueSessions = new Set<string>();

      events.forEach(event => {
        if (event.sessionId && event.createdAt) {
          const timestamp = event.createdAt.toMillis?.() || 0;
          if (timestamp >= thirtyMinutesAgo) {
            uniqueSessions.add(event.sessionId);
          }
        }
      });

      setActiveSessions(uniqueSessions.size);
    });

    return () => {
      unsubscribeEmployees();
      unsubscribeBookings();
      unsubscribeEvents();
    };
  }, []);

  const statCards = [
    {
      title: t('dashboard.totalEmployees'),
      value: stats.totalEmployees,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      change: '+2',
    },
    {
      title: t('dashboard.totalBookings'),
      value: stats.totalBookings,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      change: '+5',
    },
    {
      title: t('dashboard.pendingBookings'),
      value: stats.pendingBookings,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '-1',
    },
    {
      title: t('dashboard.inProgressBookings'),
      value: stats.inProgressBookings,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      change: '+3',
    },
  ];

  const eventsByType = recentEvents.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topEvents = Object.entries(eventsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxEventCount = topEvents[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{t('nav.dashboard')}</h1>
        <p className="text-gray-600 mt-2">{t('dashboard.welcome')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                  <ArrowUp className="w-4 h-4" />
                  <span>{(stat as any).change}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200 cursor-pointer hover:shadow-xl transition-all"
          onClick={() => onPageChange?.('bookings')}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Latest Booking</h2>
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          {latestBooking ? (
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-800">{latestBooking.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    latestBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    latestBooking.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {latestBooking.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{latestBooking.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{latestBooking.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>{latestBooking.packageName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{latestBooking.date} at {latestBooking.time}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-blue-700 font-medium text-center">Click to view all bookings</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No bookings yet</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Event Analytics</h2>
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          {topEvents.length > 0 ? (
            <div className="space-y-3">
              {topEvents.map(([eventType, count]) => {
                const percentage = (count / maxEventCount) * 100;
                return (
                  <div key={eventType} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 truncate">{eventType}</span>
                      <span className="font-bold text-purple-700">{count}</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <button
                onClick={(e) => { e.stopPropagation(); onPageChange?.('analytics'); }}
                className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                View Full Analytics
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No events tracked yet</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-lg p-6 border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Employee of the Week</h2>
            <Award className="w-6 h-6 text-amber-600" />
          </div>
          {topEmployee ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{topEmployee.name}</h3>
                    <p className="text-sm text-gray-600">{topEmployee.profession}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tasks Completed:</span>
                    <span className="font-bold text-amber-700">{topEmployee.tasksCompleted}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{topEmployee.phone}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onPageChange?.('employees'); }}
                className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium"
              >
                View All Employees
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No employees yet</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Live Activity</h2>
            <Activity className="w-6 h-6 text-green-600 animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-3 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <p className="text-sm text-gray-600 mb-1">Active Sessions</p>
                <p className="text-4xl font-bold text-green-700">{activeSessions}</p>
                <p className="text-xs text-gray-500 mt-2">Users active in last 30 minutes</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Events:</span>
                <span className="font-bold text-green-700">{recentEvents.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Tracking Status:</span>
                <span className="flex items-center gap-1 font-semibold text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
