import { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, Target, Users } from 'lucide-react';

type Insight = {
  type: 'success' | 'warning' | 'info' | 'suggestion';
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
};

export function AIInsights({ stats }: { stats: any }) {
  const insights = useMemo(() => {
    const insights: Insight[] = [];

    const hasEnoughData = stats.sessions > 10 && stats.pageViews > 20;

    if (!hasEnoughData) {
      insights.push({
        type: 'info',
        icon: <Lightbulb className="w-5 h-5" />,
        title: 'Building Your Analytics',
        description: 'Collecting visitor data to generate personalized insights.',
        action: 'Share your tracking link to gather more data and unlock AI recommendations.',
      });
      return insights;
    }

    const conversionRate = stats.funnel.visits > 0
      ? (stats.funnel.completed / stats.funnel.visits) * 100
      : 0;

    if (conversionRate > 0 && conversionRate < 5) {
      insights.push({
        type: 'warning',
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Low Conversion Rate',
        description: `Only ${conversionRate.toFixed(1)}% of visitors complete bookings. Industry average is 10-15%.`,
        action: 'Simplify booking process, add trust signals, or offer incentives.',
      });
    } else if (conversionRate >= 15) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Excellent Conversion Rate',
        description: `${conversionRate.toFixed(1)}% conversion rate is above industry average!`,
        action: 'Consider scaling marketing efforts to reach more customers.',
      });
    }

    if (stats.dailySeries.length >= 7) {
      const recent = stats.dailySeries.slice(-3).reduce((sum: number, d: any) => sum + d.sessions, 0) / 3;
      const older = stats.dailySeries.slice(0, 3).reduce((sum: number, d: any) => sum + d.sessions, 0) / 3;

      if (older > 0) {
        const growth = ((recent - older) / older) * 100;

        if (growth > 20) {
          insights.push({
            type: 'success',
            icon: <TrendingUp className="w-5 h-5" />,
            title: 'Strong Traffic Growth',
            description: `Traffic increased by ${growth.toFixed(0)}% in recent days.`,
            action: 'Your marketing efforts are paying off. Keep it up!',
          });
        } else if (growth < -20) {
          insights.push({
            type: 'warning',
            icon: <TrendingDown className="w-5 h-5" />,
            title: 'Traffic Decline',
            description: `Traffic decreased by ${Math.abs(growth).toFixed(0)}% recently.`,
            action: 'Review marketing campaigns and user experience.',
          });
        }
      }
    }

    const avgMinutes = stats.avgMinutes + (stats.avgSeconds / 60);
    if (avgMinutes > 0 && avgMinutes < 1 && stats.sessions >= 5) {
      insights.push({
        type: 'suggestion',
        icon: <Lightbulb className="w-5 h-5" />,
        title: 'Quick Visits',
        description: `Average session is ${avgMinutes.toFixed(1)} minutes. Users browse quickly.`,
        action: 'Make key information immediately visible and CTAs prominent.',
      });
    } else if (avgMinutes >= 3) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'High User Engagement',
        description: `Average session is ${avgMinutes.toFixed(1)} minutes - excellent!`,
        action: 'Users are highly engaged. Focus on conversion optimization.',
      });
    }

    const loginRate = stats.funnel.visits > 10
      ? (stats.funnel.login / stats.funnel.visits) * 100
      : null;

    if (loginRate !== null && loginRate > 0 && loginRate < 30) {
      insights.push({
        type: 'suggestion',
        icon: <Lightbulb className="w-5 h-5" />,
        title: 'Optimize Login Funnel',
        description: `${loginRate.toFixed(0)}% of visitors log in. There's room for improvement.`,
        action: 'Simplify signup process, add social login, or offer incentives.',
      });
    } else if (loginRate !== null && loginRate >= 50) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Strong Login Rate',
        description: `${loginRate.toFixed(0)}% of visitors log in - excellent engagement!`,
        action: 'Focus on converting logged-in users to bookings.',
      });
    }

    if (stats.topReferrers.length > 0 && stats.pageViews > 20) {
      const directTraffic = stats.topReferrers.find(([ref]: [string, number]) => ref === '(direct)');
      const directPercent = directTraffic
        ? (directTraffic[1] / stats.pageViews) * 100
        : 0;

      if (directPercent > 60) {
        insights.push({
          type: 'info',
          icon: <Users className="w-5 h-5" />,
          title: 'High Direct Traffic',
          description: `${directPercent.toFixed(0)}% of traffic is direct or branded.`,
          action: 'Strong brand awareness! Consider expanding reach through SEO.',
        });
      } else if (directPercent > 0 && directPercent < 20) {
        insights.push({
          type: 'suggestion',
          icon: <Target className="w-5 h-5" />,
          title: 'Referral-Driven Traffic',
          description: `${directPercent.toFixed(0)}% direct traffic. Most visitors come from referrals.`,
          action: 'Build brand awareness through content marketing and social media.',
        });
      }
    }

    const viewsPerSession = stats.sessions > 5
      ? stats.pageViews / stats.sessions
      : null;

    if (viewsPerSession !== null && viewsPerSession > 1 && viewsPerSession < 2) {
      insights.push({
        type: 'suggestion',
        icon: <Lightbulb className="w-5 h-5" />,
        title: 'Single-Page Visits',
        description: `Users view ${viewsPerSession.toFixed(1)} pages per visit on average.`,
        action: 'Add internal links, related content, or improve navigation.',
      });
    } else if (viewsPerSession !== null && viewsPerSession >= 4) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'High Exploration Rate',
        description: `Users view ${viewsPerSession.toFixed(1)} pages per visit - great engagement!`,
        action: 'Users love exploring. Ensure conversion paths are clear.',
      });
    }

    if (stats.topPages.length > 0 && stats.pageViews > 20) {
      const topPage = stats.topPages[0];
      const topPagePercent = (topPage[1] / stats.pageViews) * 100;

      if (topPagePercent > 50) {
        insights.push({
          type: 'info',
          icon: <Target className="w-5 h-5" />,
          title: 'Concentrated Traffic',
          description: `${topPage[0]} receives ${topPagePercent.toFixed(0)}% of all traffic.`,
          action: 'Optimize this page for conversions - it\'s your primary entry point.',
        });
      } else if (stats.topPages.length >= 3) {
        insights.push({
          type: 'success',
          icon: <Users className="w-5 h-5" />,
          title: 'Diversified Traffic',
          description: 'Traffic is well-distributed across multiple pages.',
          action: 'Ensure all high-traffic pages have clear conversion paths.',
        });
      }
    }

    if (insights.length === 0 && hasEnoughData) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Solid Performance',
        description: 'Your metrics are balanced. Focus on steady growth.',
        action: 'Continue monitoring trends and test small improvements.',
      });

      insights.push({
        type: 'suggestion',
        icon: <Lightbulb className="w-5 h-5" />,
        title: 'Growth Opportunities',
        description: 'Experiment with A/B testing, content marketing, or referral programs.',
        action: 'Small optimizations can lead to significant improvements over time.',
      });
    }

    return insights;
  }, [stats]);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    suggestion: 'bg-purple-50 border-purple-200 text-purple-800',
  };

  const iconColors = {
    success: 'text-green-600',
    warning: 'text-orange-600',
    info: 'text-blue-600',
    suggestion: 'text-purple-600',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-6 h-6 text-yellow-500" />
        <h3 className="text-xl font-bold text-gray-800">AI-Powered Insights</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`border rounded-xl p-4 ${typeStyles[insight.type]}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${iconColors[insight.type]}`}>
                {insight.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                <p className="text-sm mb-2 opacity-90">{insight.description}</p>
                {insight.action && (
                  <p className="text-xs font-medium opacity-75">
                    💡 {insight.action}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
