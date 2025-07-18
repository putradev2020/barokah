import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Eye,
  Edit,
  UserCheck,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Printer,
  Wrench,
  Star,
  Plus,
  Trash2,
  Save,
  X,
  Settings,
  Image as ImageIcon,
  Upload,
  RefreshCw
} from 'lucide-react';
import { 
  fetchPrinterBrands, 
  fetchProblemCategories, 
  fetchGalleryImages,
  fetchTechnicians,
  addPrinterBrand,
  addPrinterModel,
  updatePrinterModel,
  deletePrinterModel,
  addProblemCategory,
  addProblem,
  updateProblem,
  deleteProblem,
  addGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  addTechnician,
  updateTechnician,
  deleteTechnician,
  updatePrinterBrand,
  updateProblemCategory,
  deletePrinterBrand,
  deleteProblemCategory
} from '../utils/supabaseData';
import { updateBookingStatus, assignTechnician, updateActualCost } from '../utils/supabaseData';
import { getAllBookings } from '../utils/bookingSupabase';
import { supabase } from '../utils/supabase';
import Swal from 'sweetalert2';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [printerBrands, setPrinterBrands] = useState<any[]>([]);
  const [problemCategories, setProblemCategories] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState<any>({});

  // Load all data
  useEffect(() => {
    loadAllData();
    
    // Setup realtime subscriptions
    const bookingsChannel = supabase
      .channel('admin-bookings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_bookings'
      }, (payload) => {
        console.log('Booking change detected:', payload);
        loadBookings();
      })
      .subscribe();

    const brandsChannel = supabase
      .channel('admin-brands-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'printer_brands'
      }, () => {
        loadPrinterBrands();
      })
      .subscribe();

    const modelsChannel = supabase
      .channel('admin-models-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'printer_models'
      }, () => {
        loadPrinterBrands();
      })
      .subscribe();

    const categoriesChannel = supabase
      .channel('admin-categories-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'problem_categories'
      }, () => {
        loadProblemCategories();
      })
      .subscribe();

    const problemsChannel = supabase
      .channel('admin-problems-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'problems'
      }, () => {
        loadProblemCategories();
      })
      .subscribe();

    const galleryChannel = supabase
      .channel('admin-gallery-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gallery_images'
      }, () => {
        loadGalleryImages();
      })
      .subscribe();

    const techniciansChannel = supabase
      .channel('admin-technicians-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'technicians'
      }, () => {
        loadTechnicians();
      })
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(brandsChannel);
      supabase.removeChannel(modelsChannel);
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(problemsChannel);
      supabase.removeChannel(galleryChannel);
      supabase.removeChannel(techniciansChannel);
    };
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadBookings(),
        loadPrinterBrands(),
        loadProblemCategories(),
        loadGalleryImages(),
        loadTechnicians()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const data = await getAllBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadPrinterBrands = async () => {
    try {
      const data = await fetchPrinterBrands();
      setPrinterBrands(data);
    } catch (error) {
      console.error('Error loading printer brands:', error);
    }
  };

  const loadProblemCategories = async () => {
    try {
      const data = await fetchProblemCategories();
      setProblemCategories(data);
    } catch (error) {
      console.error('Error loading problem categories:', error);
    }
  };

  const loadGalleryImages = async () => {
    try {
      const data = await fetchGalleryImages();
      setGalleryImages(data);
    } catch (error) {
      console.error('Error loading gallery images:', error);
    }
  };

  const loadTechnicians = async () => {
    try {
      const data = await fetchTechnicians();
      setTechnicians(data);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  // Booking management functions
  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const result = await Swal.fire({
        title: 'Ubah Status Booking?',
        text: `Status akan diubah menjadi: ${getStatusLabel(newStatus)}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Ubah',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        const success = await updateBookingStatus(bookingId, newStatus);
        
        if (success) {
          await Swal.fire({
            title: 'Berhasil!',
            text: 'Status booking berhasil diubah',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          
          // Reload bookings to get updated data
          await loadBookings();
        } else {
          throw new Error('Failed to update status');
        }
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      await Swal.fire({
        title: 'Error!',
        text: 'Gagal mengubah status booking',
        icon: 'error'
      });
    }
  };

  const handleAssignTechnician = async (bookingId: string, technicianId: string) => {
    try {
      const success = await assignTechnician(bookingId, technicianId);
      
      if (success) {
        await Swal.fire({
          title: 'Berhasil!',
          text: 'Teknisi berhasil ditugaskan',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        await loadBookings();
      } else {
        throw new Error('Failed to assign technician');
      }
    } catch (error) {
      console.error('Error assigning technician:', error);
      await Swal.fire({
        title: 'Error!',
        text: 'Gagal menugaskan teknisi',
        icon: 'error'
      });
    }
  };

  const handleUpdateActualCost = async (bookingId: string, actualCost: string) => {
    try {
      const success = await updateActualCost(bookingId, actualCost);
      
      if (success) {
        await Swal.fire({
          title: 'Berhasil!',
          text: 'Biaya aktual berhasil diupdate',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        await loadBookings();
      } else {
        throw new Error('Failed to update actual cost');
      }
    } catch (error) {
      console.error('Error updating actual cost:', error);
      await Swal.fire({
        title: 'Error!',
        text: 'Gagal mengupdate biaya aktual',
        icon: 'error'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'servicing':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu Konfirmasi';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'in-progress':
        return 'Dalam Proses';
      case 'servicing':
        return 'Sedang Diperbaiki';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Statistics
  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    totalTechnicians: technicians.length
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TrendingUp },
    { id: 'bookings', name: 'Booking Management', icon: Calendar },
    { id: 'printer-brands', name: 'Printer Brands', icon: Printer },
    { id: 'problem-categories', name: 'Problem Categories', icon: Wrench },
    { id: 'gallery', name: 'Gallery Management', icon: ImageIcon },
    { id: 'technicians', name: 'Technicians', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Barokah Printer Management System</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('home')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Kembali ke Website
              </button>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pendingBookings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.completedBookings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Technicians</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalTechnicians}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.customer.name}
                            </div>
                            <div className="text-sm text-gray-500">{booking.customer.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {booking.printer.brand} {booking.printer.model}
                          </div>
                          <div className="text-sm text-gray-500">{booking.problem.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(booking.service.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Booking Management Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
              <button
                onClick={loadBookings}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID & Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Printer & Problem
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-blue-600">#{booking.id}</div>
                            <div className="text-sm font-medium text-gray-900">{booking.customer.name}</div>
                            <div className="text-sm text-gray-500">{booking.customer.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.printer.brand} {booking.printer.model}
                            </div>
                            <div className="text-sm text-gray-500">{booking.problem.category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm text-gray-900">{booking.service.type}</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(booking.service.date)} - {booking.service.time}
                            </div>
                            <div className="text-sm text-gray-500">Teknisi: {booking.technician}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={booking.status}
                            onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                            className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(booking.status)}`}
                          >
                            <option value="pending">Menunggu Konfirmasi</option>
                            <option value="confirmed">Dikonfirmasi</option>
                            <option value="in-progress">Dalam Proses</option>
                            <option value="servicing">Sedang Diperbaiki</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowBookingDetail(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span>Detail</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content would go here... */}
        {activeTab === 'printer-brands' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Printer Brands Management</h2>
            <p className="text-gray-600">Printer brands management functionality will be implemented here.</p>
          </div>
        )}

        {activeTab === 'problem-categories' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Problem Categories Management</h2>
            <p className="text-gray-600">Problem categories management functionality will be implemented here.</p>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Gallery Management</h2>
            <p className="text-gray-600">Gallery management functionality will be implemented here.</p>
          </div>
        )}

        {activeTab === 'technicians' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Technicians Management</h2>
            <p className="text-gray-600">Technicians management functionality will be implemented here.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <p className="text-gray-600">Settings functionality will be implemented here.</p>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {showBookingDetail && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Detail Booking #{selectedBooking.id}
                </h3>
                <button
                  onClick={() => setShowBookingDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{selectedBooking.customer.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{selectedBooking.customer.phone}</p>
                      </div>
                    </div>
                    {selectedBooking.customer.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{selectedBooking.customer.email}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">{selectedBooking.customer.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Service Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Printer className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Printer</p>
                        <p className="font-medium">{selectedBooking.printer.brand} {selectedBooking.printer.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Problem Category</p>
                        <p className="font-medium">{selectedBooking.problem.category}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Wrench className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Problem Description</p>
                        <p className="font-medium">{selectedBooking.problem.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Service Date & Time</p>
                        <p className="font-medium">
                          {formatDate(selectedBooking.service.date)} - {selectedBooking.service.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <UserCheck className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Assigned Technician</p>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{selectedBooking.technician}</p>
                          <select
                            onChange={(e) => handleAssignTechnician(selectedBooking.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            defaultValue=""
                          >
                            <option value="">Change Technician</option>
                            {technicians.map((tech) => (
                              <option key={tech.id} value={tech.id}>
                                {tech.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Cost Information</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Estimated Cost</p>
                      <p className="font-medium text-blue-600">{selectedBooking.estimatedCost}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Actual Cost</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-green-600">
                          {selectedBooking.actualCost || 'Not set'}
                        </p>
                        <input
                          type="text"
                          placeholder="Set actual cost"
                          className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              handleUpdateActualCost(selectedBooking.id, target.value);
                              target.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Service Timeline</h4>
                <div className="space-y-4">
                  {selectedBooking.timeline.map((step: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h5 className={`font-medium ${
                            step.completed ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </h5>
                          {step.timestamp && (
                            <span className="text-sm text-gray-500">
                              {formatDateTime(step.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${
                          step.completed ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Notes</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedBooking.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowBookingDetail(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;