import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Calendar as CalendarIcon, Clock, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function PublicProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const data = await api.fetch(`/public/u/${username}`);
      setProfile(data.professional);
      setSlots(data.slots);
    } catch (err: any) {
      setError(err.message || 'Professional not found');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    
    setBookingLoading(true);
    try {
      await api.fetch('/appointments/book', {
        method: 'POST',
        body: JSON.stringify({ 
          slot_id: selectedSlot.id,
          guest_name: user ? undefined : guestName,
          guest_email: user ? undefined : guestEmail
        })
      });
      setBookingSuccess(true);
    } catch (err: any) {
      alert(err.message);
      fetchProfile(); // Refresh slots if there was a conflict
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (error || !profile) return <div className="min-h-screen flex items-center justify-center text-red-500 font-medium">{error}</div>;

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl max-w-md w-full text-center shadow-xl shadow-blue-900/5 border border-gray-100">
           <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <CheckCircle2 className="w-8 h-8" />
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
           <p className="text-gray-500 mb-8">An email has been sent to you and {profile.name} to confirm the appointment.</p>
           <button onClick={() => window.location.reload()} className="text-blue-600 font-medium hover:underline">Book another meeting</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 lg:p-12">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Profile Sidebar */}
        <div className="w-full md:w-1/3">
           <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm sticky top-12">
             <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
               {profile.name.charAt(0).toUpperCase()}
             </div>
             <p className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1">Meet with</p>
             <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
             <p className="text-gray-500 font-medium">{profile.email}</p>
           </div>
        </div>

        {/* Booking Section */}
        <div className="w-full md:w-2/3 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          {!selectedSlot ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Select a Time</h2>
              {slots.length === 0 ? (
                <p className="text-gray-500">No available slots at this moment.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {slots.map(slot => (
                    <button 
                      key={slot.id} 
                      onClick={() => setSelectedSlot(slot)}
                      className="text-left border border-gray-200 hover:border-blue-600 hover:ring-1 hover:ring-blue-600 rounded-2xl p-4 transition-all group"
                    >
                      <p className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {new Date(slot.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                      </p>
                      <p className="text-xl font-light text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                        {new Date(slot.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <button 
                onClick={() => setSelectedSlot(null)}
                className="text-sm text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2 mb-6"
              >
                <ArrowLeft className="w-4 h-4" /> Back to slots
              </button>
              
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
                <p className="text-blue-800 font-medium mb-1">Selected Time</p>
                <p className="text-2xl font-bold text-blue-900">
                  {new Date(selectedSlot.start_time).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>

              <form onSubmit={handleBook} className="space-y-4">
                {!user && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
                      <input type="text" required value={guestName} onChange={e=>setGuestName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                      <input type="email" required value={guestEmail} onChange={e=>setGuestEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="john@example.com" />
                    </div>
                  </>
                )}
                
                {user && (
                   <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                     You will be booked as <strong className="text-gray-900">{user.name}</strong> ({user.email}).
                   </p>
                )}

                <button 
                  type="submit" 
                  disabled={bookingLoading}
                  className={cn("w-full py-4 mt-4 bg-blue-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-colors hover:bg-blue-700", bookingLoading && "opacity-70")}
                >
                  {bookingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Booking'}
                </button>
              </form>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
