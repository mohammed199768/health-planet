import { useState, useEffect, useMemo } from 'react';
import { db, type Booking, type Employee } from '../lib/firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { analytics } from '../lib/analytics';
import {
  Calendar, Clock, MapPin, Phone, Package, Play, Check, X,
  Trash2, MessageCircle, User, Download
} from 'lucide-react';

type TabType = 'new' | 'in_progress' | 'completed';

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('new');

  const [executionData, setExecutionData] = useState({
    assignedEmployeeId: '',
    executionTime: '',
    executionLocation: '',
    notes: '',
  });

  useEffect(() => {
    setLoading(true);

    const unsubscribeBookings = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        const bookingsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Booking[];
        setBookings(bookingsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching bookings:', error);
        alert(`Error: ${error.message}`);
        setLoading(false);
      }
    );

    const unsubscribeEmployees = onSnapshot(
      collection(db, 'employees'),
      (snapshot) => {
        const employeesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Employee[];
        setEmployees(employeesData);
      },
      (error) => {
        console.error('Error fetching employees:', error);
      }
    );

    return () => {
      unsubscribeBookings();
      unsubscribeEmployees();
    };
  }, []);

  const groupedBookings = useMemo(() => {
    const filtered = bookings.filter((b) => {
      if (activeTab === 'new') return b.status === 'pending';
      if (activeTab === 'in_progress') return b.status === 'in_progress';
      if (activeTab === 'completed') return b.status === 'completed';
      return true;
    });

    const groups: Record<string, Booking[]> = {};
    filtered.forEach((booking) => {
      const date = booking.date || 'No Date';
      if (!groups[date]) groups[date] = [];
      groups[date].push(booking);
    });

    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [bookings, activeTab]);

  const handleStartExecution = async () => {
    if (!selectedBooking || !executionData.assignedEmployeeId) {
      alert('Please select an employee');
      return;
    }

    if (!executionData.executionTime) {
      alert('Please select execution time');
      return;
    }

    try {
      await updateDoc(doc(db, 'bookings', selectedBooking.id), {
        status: 'in_progress',
        ...executionData,
      });

      analytics.trackUserAction('booking_started', {
        bookingId: selectedBooking.id,
        employeeId: executionData.assignedEmployeeId,
      });

      const employee = employees.find((e) => e.id === executionData.assignedEmployeeId);
      if (employee) {
        const message = `🎯 *New Task Assigned*\n\n` +
          `👤 *Customer:* ${selectedBooking.name}\n` +
          `📞 *Phone:* ${selectedBooking.phone}\n` +
          `📍 *Address:* ${selectedBooking.address}\n` +
          `📅 *Date:* ${selectedBooking.date}\n` +
          `⏰ *Time:* ${executionData.executionTime}\n` +
          `📦 *Package:* ${selectedBooking.packageName}\n` +
          `${executionData.executionLocation ? `🏢 *Location:* ${executionData.executionLocation}\n` : ''}` +
          `${executionData.notes ? `📝 *Notes:* ${executionData.notes}\n` : ''}` +
          `\nGood luck! 💪`;

        sendWhatsApp(employee.phone, message);
      }

      closeModal();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleCompleteBooking = async (booking: Booking) => {
    if (!confirm('Mark this booking as completed?')) return;

    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'completed',
      });

      analytics.trackBookingCompleted(booking.id, {
        employeeId: booking.assignedEmployeeId,
        packageName: booking.packageName,
      });
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (!confirm('Cancel this booking?')) return;

    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'pending',
        assignedEmployeeId: null,
        executionTime: null,
        executionLocation: null,
        notes: null,
      });
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Delete this booking permanently?')) return;

    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const openModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setExecutionData({
      assignedEmployeeId: booking.assignedEmployeeId || '',
      executionTime: booking.executionTime || '',
      executionLocation: booking.executionLocation || '',
      notes: booking.notes || '',
    });
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setExecutionData({
      assignedEmployeeId: '',
      executionTime: '',
      executionLocation: '',
      notes: '',
    });
  };

  const exportToExcel = () => {
    const headers = ['Name', 'Phone', 'Address', 'Date', 'Time', 'Package', 'Status', 'Employee', 'Notes'];
    const rows = bookings.map((b) => {
      const employee = employees.find((e) => e.id === b.assignedEmployeeId);
      return [
        b.name,
        b.phone,
        b.address,
        b.date,
        b.time,
        b.packageName,
        b.status,
        employee?.name || 'N/A',
        b.notes || '',
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const sendWhatsApp = (phone: string, message: string) => {
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabCounts = {
    new: bookings.filter((b) => b.status === 'pending').length,
    in_progress: bookings.filter((b) => b.status === 'in_progress').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Bookings Management</h1>
        </div>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Download className="w-5 h-5" />
          Export to Excel
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          <TabButton
            active={activeTab === 'new'}
            onClick={() => setActiveTab('new')}
            count={tabCounts.new}
            label="New Bookings"
            color="blue"
          />
          <TabButton
            active={activeTab === 'in_progress'}
            onClick={() => setActiveTab('in_progress')}
            count={tabCounts.in_progress}
            label="In Progress"
            color="yellow"
          />
          <TabButton
            active={activeTab === 'completed'}
            onClick={() => setActiveTab('completed')}
            count={tabCounts.completed}
            label="Completed"
            color="green"
          />
        </div>

        <div className="p-6">
          {groupedBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No bookings in this category</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedBookings.map(([date, dayBookings]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 rounded-lg px-4 py-2">
                      <p className="text-blue-800 font-semibold">{date}</p>
                    </div>
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-sm text-gray-500">{dayBookings.length} bookings</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {dayBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        employees={employees}
                        onStart={() => openModal(booking)}
                        onComplete={() => handleCompleteBooking(booking)}
                        onCancel={() => handleCancelBooking(booking)}
                        onDelete={() => handleDeleteBooking(booking.id)}
                        onWhatsApp={sendWhatsApp}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <Modal
          booking={selectedBooking}
          employees={employees}
          executionData={executionData}
          setExecutionData={setExecutionData}
          onClose={closeModal}
          onSubmit={handleStartExecution}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  label: string;
  color: string;
}) {
  const colors = {
    blue: active ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-600 hover:text-gray-800',
    yellow: active ? 'border-yellow-600 text-yellow-600 bg-yellow-50' : 'border-transparent text-gray-600 hover:text-gray-800',
    green: active ? 'border-green-600 text-green-600 bg-green-50' : 'border-transparent text-gray-600 hover:text-gray-800',
  };

  return (
    <button
      onClick={onClick}
      className={`flex-1 px-6 py-4 border-b-2 font-medium transition ${colors[color as keyof typeof colors]}`}
    >
      {label}
      <span className="ml-2 px-2 py-0.5 text-sm rounded-full bg-gray-200">{count}</span>
    </button>
  );
}

function BookingCard({
  booking,
  employees,
  onStart,
  onComplete,
  onCancel,
  onDelete,
  onWhatsApp,
}: {
  booking: Booking;
  employees: Employee[];
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onWhatsApp: (phone: string, message: string) => void;
}) {
  const employee = employees.find((e) => e.id === booking.assignedEmployeeId);

  const statusColors = {
    pending: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-800">{booking.name}</h3>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
              {booking.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">{booking.time}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{booking.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{booking.address}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Package className="w-4 h-4" />
            <span>{booking.packageName}</span>
          </div>
          {employee && (
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>{employee.name}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-gray-200">
          {booking.status === 'pending' && (
            <>
              <button
                onClick={onStart}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
              <button
                onClick={() => onWhatsApp(booking.phone, `Hello ${booking.name}, your booking is confirmed!`)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {booking.status === 'in_progress' && (
            <>
              <button
                onClick={onComplete}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                <Check className="w-4 h-4" />
                Complete
              </button>
              <button
                onClick={onCancel}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}

          {booking.status === 'completed' && (
            <div className="flex-1 text-center text-sm text-green-600 font-medium py-2">
              ✓ Completed
            </div>
          )}

          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({
  booking,
  employees,
  executionData,
  setExecutionData,
  onClose,
  onSubmit,
}: {
  booking: Booking;
  employees: Employee[];
  executionData: any;
  setExecutionData: any;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-800">Start Execution</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="font-semibold text-gray-800">{booking.name}</p>
          <p className="text-sm text-gray-600">{booking.date} at {booking.time}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Employee</label>
            <select
              value={executionData.assignedEmployeeId}
              onChange={(e) => setExecutionData({ ...executionData, assignedEmployeeId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.profession}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Execution Time</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={executionData.executionTime.split(':')[0] || ''}
                onChange={(e) => {
                  const minute = executionData.executionTime.split(':')[1] || '00';
                  setExecutionData({ ...executionData, executionTime: `${e.target.value}:${minute}` });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Hour</option>
                {Array.from({ length: 24 }, (_, i) => i).map(h => {
                  const hour = h.toString().padStart(2, '0');
                  const display = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
                  return (
                    <option key={h} value={hour}>
                      {display}
                    </option>
                  );
                })}
              </select>
              <select
                value={executionData.executionTime.split(':')[1] || ''}
                onChange={(e) => {
                  const hour = executionData.executionTime.split(':')[0] || '09';
                  setExecutionData({ ...executionData, executionTime: `${hour}:${e.target.value}` });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Minute</option>
                <option value="00">00</option>
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="45">45</option>
              </select>
            </div>
            {executionData.executionTime && (
              <p className="mt-2 text-sm text-blue-600 font-medium">
                Selected: {executionData.executionTime}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={executionData.executionLocation}
              onChange={(e) => setExecutionData({ ...executionData, executionLocation: e.target.value })}
              placeholder="Execution location"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={executionData.notes}
              onChange={(e) => setExecutionData({ ...executionData, notes: e.target.value })}
              placeholder="Add notes..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Start Execution
          </button>
        </div>
      </div>
    </div>
  );
}
