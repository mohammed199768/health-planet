import { Settings } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Settings Coming Soon</h2>
        <p className="text-gray-600">
          Application settings and preferences will be available here.
        </p>
      </div>
    </div>
  );
}
