import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Calendar, BarChart3, Settings, LogOut, Menu, X, Languages } from 'lucide-react';

type Page = 'dashboard' | 'employees' | 'bookings' | 'analytics' | 'settings';

type DashboardLayoutProps = {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  children: React.ReactNode;
};

export function DashboardLayout({ currentPage, onPageChange, children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const menuItems = [
    { id: 'dashboard' as Page, label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'bookings' as Page, label: t('nav.bookings'), icon: Calendar },
    { id: 'employees' as Page, label: t('nav.employees'), icon: Users },
    { id: 'analytics' as Page, label: t('nav.analytics'), icon: BarChart3 },
    { id: 'settings' as Page, label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 flex">
      <aside
        className={`fixed lg:static inset-y-0 ${i18n.language === 'ar' ? 'right-0' : 'left-0'} z-50 w-64 bg-white shadow-xl ${i18n.language === 'ar' ? 'border-l' : 'border-r'} border-gray-100 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : i18n.language === 'ar' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-blue-600">
                {i18n.language === 'ar' ? 'لوحة التحكم' : 'Admin Dashboard'}
              </h1>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={toggleLanguage}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <Languages className="w-5 h-5" />
              <span className="font-medium">
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4 lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-700 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
