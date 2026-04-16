import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Calendar, ArrowLeft, Clock } from 'lucide-react';

export default function Booking() {
  const { professionalId } = useParams();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlots();
  }, [professionalId]);

  const fetchSlots = async () => {
    try {
      const data = await api.fetch(`/slots?professionalId=${professionalId}`);
      // Show only unbooked available future slots
      setSlots(data.filter((s:any) => s.is_booked === 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handBookSlot = async (slotId: number) => {
    try {
      await api.fetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({ slot_id: slotId })
      });
      navigate('/dashboard'); // Go to dashboard on success
    } catch (err: any) {
      alert(err.message || 'Failed to book slot');
      fetchSlots(); // refresh state to see if it got taken
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        <div className="bg-white border border-gray-200 rounded-[32px] p-8 md:p-12 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3"></div>
           
           <h1 className="text-3xl font-semibold mb-2 text-gray-900">Book an Appointment</h1>
           <p className="text-gray-500 mb-10">Select a time slot from the professional's availability calendar. All times are shown in your local timezone.</p>

           {loading ? (
             <div className="py-20 text-center text-gray-400">Loading availability...</div>
           ) : slots.length === 0 ? (
             <div className="py-20 text-center">
               <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               <p className="text-gray-500">This professional has no available slots at the moment.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {slots.map(slot => (
                 <div key={slot.id} className="border border-gray-200 rounded-2xl p-5 hover:border-blue-600 transition-colors group bg-white cursor-pointer" onClick={() => handBookSlot(slot.id)}>
                   <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                     <Calendar className="w-3.5 h-3.5" />
                     {new Date(slot.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                   </p>
                   <p className="text-2xl font-light text-gray-900 mb-4 flex items-center gap-2">
                     <Clock className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                     {new Date(slot.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </p>
                   <button className="w-full py-2.5 bg-gray-50 group-hover:bg-blue-600 text-gray-900 group-hover:text-white rounded-xl font-medium transition-colors">
                     Confirm this time
                   </button>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
