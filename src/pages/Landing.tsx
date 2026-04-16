import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-xl tracking-tight">MeetFlow</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link to="/login" className="text-sm font-medium text-white bg-gray-900 px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-24 px-6 overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-50 rounded-[100%] blur-3xl -z-10 opacity-70"></div>
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-8">
              <ShieldCheck className="w-4 h-4" /> The Modern Scheduling SaaS
            </div>
            <h1 className="text-6xl sm:text-7xl font-semibold tracking-tight leading-[1.1] mb-8">
              Scheduling infrastructure <br className="hidden sm:block"/>
              <span className="text-blue-600">for everyone.</span>
            </h1>
            <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              MeetFlow eliminates the back-and-forth emails to find the perfect time. Create your availability, share your link, and let clients book instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 flex items-center gap-2 w-full sm:w-auto justify-center">
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Row */}
        <section className="bg-gray-50 py-24 px-6 border-y border-gray-100">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Set Availability</h3>
              <p className="text-gray-500 leading-relaxed">Define exactly when you want to take meetings. Add specific time slots, blocking the rest of your calendar natively.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Client Booking</h3>
              <p className="text-gray-500 leading-relaxed">Clients visit a dedicated page showing your open slots. They pick a time, and the appointment is secured immediately.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Double-Book Engine</h3>
              <p className="text-gray-500 leading-relaxed">Our robust backend uses transactional logic to guarantee a time slot can only be booked by a single client.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
