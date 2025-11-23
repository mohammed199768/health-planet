import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type EventType =
  | 'page_view'
  | 'session_start'
  | 'session_end'
  | 'login_success'
  | 'login_failure'
  | 'booking_created'
  | 'booking_completed'
  | 'employee_added'
  | 'user_action';

interface EventData {
  eventType: EventType;
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
  metadata?: Record<string, any>;
}

class Analytics {
  private sessionId: string;
  private sessionStart: number;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStart = Date.now();

    this.trackPageView();
    this.setupBeforeUnload();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
      this.track('session_start');
    }
    return sessionId;
  }

  private setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      const duration = Date.now() - this.sessionStart;
      this.track('session_end', { duration_ms: duration });
    });
  }

  private getUTMParams(): { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null } {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
    };
  }

  async track(eventType: EventType, data: Partial<EventData> = {}) {
    try {
      const utm = this.getUTMParams();

      const eventData: EventData = {
        eventType,
        path: window.location.pathname,
        fullUrl: window.location.href,
        referrer: document.referrer || undefined,
        sessionId: this.sessionId,
        lang: navigator.language,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        ...data,
      };

      await addDoc(collection(db, 'events'), {
        ...eventData,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  trackPageView() {
    this.track('page_view');
  }

  trackLogin(email: string, success: boolean = true) {
    this.track(success ? 'login_success' : 'login_failure', { email });
  }

  trackBookingCreated(bookingId: string, metadata?: Record<string, any>) {
    this.track('booking_created', { metadata: { bookingId, ...metadata } });
  }

  trackBookingCompleted(bookingId: string, metadata?: Record<string, any>) {
    this.track('booking_completed', { metadata: { bookingId, ...metadata } });
  }

  trackEmployeeAdded(employeeId: string, metadata?: Record<string, any>) {
    this.track('employee_added', { metadata: { employeeId, ...metadata } });
  }

  trackUserAction(action: string, metadata?: Record<string, any>) {
    this.track('user_action', { metadata: { action, ...metadata } });
  }
}

export const analytics = new Analytics();
