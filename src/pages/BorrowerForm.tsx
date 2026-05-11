import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, LogOut, Send, AlertCircle, ArrowRight } from 'lucide-react';

export default function BorrowerForm() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    company_description: '',
    purpose: '',
    amount: '',
    interest_rate: '',
    tenure: '12',
    revenue: '',
    profit: '',
    debt: '',
    cashflow: ''
  });

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const submitLoan = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/loans/request', {
        ...form,
        amount: Number(form.amount),
        interest_rate: Number(form.interest_rate),
        tenure: Number(form.tenure),
        revenue: Number(form.revenue),
        profit: Number(form.profit),
        debt: Number(form.debt),
        cashflow: Number(form.cashflow)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Loan Requested Successfully! Our Quant Engine has evaluated your risk profile.');
      navigate('/marketplace');
    } catch (err) {
      alert('Error submitting loan. Please ensure all metrics are between 1 and 100 for evaluation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Send className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Borrower Portal</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-medium">Welcome, <span className="text-slate-900 font-bold">{user.name}</span></span>
          <button onClick={logout} className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">New Loan Application</h2>
            <p className="text-slate-500">Provide your enterprise details and financial metrics for a quantitative risk assessment.</p>
          </div>

          <form onSubmit={submitLoan} className="p-8 space-y-8">
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-blue-600" />
                Company Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Company Name</label>
                  <input 
                    placeholder="e.g. Acme Tech Solutions" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    onChange={e=>setForm({...form, company_name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Loan Purpose</label>
                  <input 
                    placeholder="e.g. Scaling infrastructure" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    onChange={e=>setForm({...form, purpose: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="500000" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    onChange={e=>setForm({...form, amount: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Interest Rate Target (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="12.5" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    onChange={e=>setForm({...form, interest_rate: e.target.value})} 
                    required 
                  />
                </div>
              </div>
            </section>

            <section className="bg-blue-50/30 p-6 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-bold text-slate-800">Quant Financial Metrics</h3>
                <div className="group relative">
                  <AlertCircle className="w-4 h-4 text-slate-400 cursor-help" />
                  <div className="absolute left-full ml-2 top-0 bg-slate-800 text-white text-xs p-2 rounded w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    Enter scores from 1 to 100 based on your last audit. These power our Risk Grade engine.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Revenue Strength (1-100)</label>
                  <input type="number" min="1" max="100" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white" onChange={e=>setForm({...form, revenue: e.target.value})} required/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Profitability Margin (1-100)</label>
                  <input type="number" min="1" max="100" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white" onChange={e=>setForm({...form, profit: e.target.value})} required/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Debt Exposure (1-100)</label>
                  <input type="number" min="1" max="100" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white" onChange={e=>setForm({...form, debt: e.target.value})} required/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Cashflow Liquidity (1-100)</label>
                  <input type="number" min="1" max="100" className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white" onChange={e=>setForm({...form, cashflow: e.target.value})} required/>
                </div>
              </div>
            </section>

            <div className="pt-4">
              <button 
                disabled={loading}
                className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Analyzing Application...' : 'Submit to Quant Marketplace'}
                {!loading && <Send className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
