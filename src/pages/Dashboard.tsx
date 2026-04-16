import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Calendar, LogOut, Clock, Plus, Trash2, ShieldCheck, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPro = user?.role === 'professional';

  const [appointments, setAppointments] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  
  // Slot creation state
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');

  useEffect(() => {
    fetchAppointments();
    if (isPro) {
      fetchSlots();
    } else {
      fetchProfessionals();
    }
  }, [isPro]);

  const fetchAppointments = async () => {
    try {
      const data = await api.fetch('/appointments');
      setAppointments(data);
    } catch(err) {}
  };

  const fetchSlots = async () => {
    try {
      const data = await api.fetch('/slots');
      setSlots(data);
    } catch(err) {}
  };

  const fetchProfessionals = async () => {
    try {
      const data = await api.fetch('/professionals');
      setProfessionals(data);
    } catch(err) {}
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotDate || !newSlotStart || !newSlotEnd) return;
    
    // Construct valid ISO strings (in local timezone context for prototype)
    const startTime = new Date(`${newSlotDate}T${newSlotStart}:00`).toISOString();
    const endTime = new Date(`${newSlotDate}T${newSlotEnd}:00`).toISOString();

    try {
      await api.fetch('/slots', {
        method: 'POST',
        body: JSON.stringify({ start_time: startTime, end_time: endTime })
      });
      setNewSlotStart('');
      setNewSlotEnd('');
      fetchSlots();
    } catch (error) {
      console.error(error);
      alert('Failed to create slot');
    }
  };

  const handleDeleteSlot = async (id: number) => {
    try {
      await api.fetch(`/slots/${id}`, { method: 'DELETE' });
      fetchSlots();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const cancelAppointment = async (id: number) => {
    try {
      await api.fetch(`/appointments/${id}`, { method: 'DELETE' });
      fetchAppointments();
      if (isPro) fetchSlots();
    } catch(err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans">
      <nav className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-gray-900">MeetFlow</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Column 1: Core Action Center based on role */}
          <div className="space-y-10">
            {isPro ? (
              <div className="bg-white border border-gray-200 rounded-[24px] p-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" /> Manage Availability
                </h2>
                <form onSubmit={handleCreateSlot} className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                    <input type="date" value={newSlotDate} onChange={e=>setNewSlotDate(e.target.value)} required className="w-full bg-gray-50 focus:bg-white border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Time</label>
                      <input type="time" value={newSlotStart} onChange={e=>setNewSlotStart(e.target.value)} required className="w-full bg-gray-50 focus:bg-white border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">End Time</label>
                      <input type="time" value={newSlotEnd} onChange={e=>setNewSlotEnd(e.target.value)} required className="w-full bg-gray-50 focus:bg-white border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl flex justify-center items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4"/> Add Time Slot
                  </button>
                </form>

                <div className="space-y-3">
                   <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Your Open Slots</h3>
                   {slots.filter(s => !s.is_booked).length === 0 ? (
                     <p className="text-gray-500 text-sm">No open slots. Create some above.</p>
                   ) : (
                     slots.filter(s => !s.is_booked).map(slot => (
                       <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                         <div>
                           <p className="text-sm font-medium text-gray-900">{new Date(slot.start_time).toLocaleDateString()}</p>
                           <p className="text-xs text-gray-500">
                             {new Date(slot.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                             {new Date(slot.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </p>
                         </div>
                         <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     ))
                   )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-[24px] p-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> Book a Professional
                </h2>
                <div className="space-y-4">
                  {professionals.length === 0 ? (
                    <p className="text-gray-500 text-sm">No professionals registered yet.</p>
                  ) : (
                    professionals.map(pro => (
                      <div key={pro.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-gray-300 transition-colors">
                        <div>
                          <p className="font-semibold text-gray-900">{pro.name}</p>
                          <p className="text-sm text-gray-500">{pro.email}</p>
                        </div>
                        <Link to={`/book/${pro.id}`} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                           View Slots
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Upcoming Appointments */}
          <div>
             <div className="bg-white border border-gray-200 rounded-[24px] p-8 shadow-sm h-full">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Upcoming Meetings
                </h2>
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Calendar className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                      <p>You have no upcoming appointments.</p>
                    </div>
                  ) : (
                    appointments.map(appt => (
                      <div key={appt.id} className="p-5 border border-gray-100 rounded-2xl bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden">
                        {appt.status === 'cancelled' && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                             <span className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide">Cancelled</span>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-lg text-gray-900">
                              {new Date(appt.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric'})}
                            </p>
                            <p className="text-blue-600 font-medium">
                              {new Date(appt.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                              {new Date(appt.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                          {appt.status !== 'cancelled' && (
                            <button onClick={() => cancelAppointment(appt.id)} className="text-xs font-semibold text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 bg-white px-3 py-1.5 rounded-lg transition-colors relative z-20">Cancel</button>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 mt-4 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                             <User className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{isPro ? 'Client' : 'Professional'}</p>
                              <p className="text-sm font-medium text-gray-900">{isPro ? appt.client_name : appt.professional_name}</p>
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
