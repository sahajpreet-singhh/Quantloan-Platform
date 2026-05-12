import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, ArrowUpRight, ShieldCheck, ChevronRight, LogOut } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

enum OperationType {
  LIST = 'list',
  GET = 'get',
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  console.error('Firestore Error: ', error);
}

export default function Marketplace() {
  const [loans, setLoans] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'loans'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loanData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLoans(loanData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'loans');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const filtered = filter === 'All' ? loans : loans.filter((l: any) => l.grade === filter);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Quant Marketplace</h1>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
             <button onClick={()=>navigate('/dashboard')} className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Portfolio</button>
             <button className="text-blue-600 font-bold">Invest</button>
          </nav>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 font-medium hidden sm:block">Investor: <span className="text-slate-900 font-bold">{profile?.name}</span></span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Investment Opportunities</h2>
            <p className="text-slate-500 mt-1">Browse verified enterprise loans evaluated by our quant model.</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-sm font-semibold text-slate-400 px-3">Risk Filter:</span>
            {['All', 'A', 'B', 'C'].map(g => (
              <button 
                key={g} 
                onClick={() => setFilter(g)} 
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filter === g ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1,2,3].map(i => (
               <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
             ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-20 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800">No loans found</h3>
            <p className="text-slate-500 capitalize">We couldn't find any loans with Risk Grade {filter}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((loan: any) => (
              <motion.div 
                key={loan.id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{loan.companyName}</h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        Purpose: <span className="text-slate-700 font-medium truncate max-w-[150px]">{loan.purpose}</span>
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                      loan.grade === 'A' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      loan.grade === 'B' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-rose-100 text-rose-700 border-rose-200'
                    }`}>
                      GRADE {loan.grade}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Loan Amount</p>
                      <p className="text-lg font-bold text-slate-900">₹{Number(loan.amount).toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <p className="text-[10px] uppercase font-black text-blue-400 tracking-wider mb-1">Interest Rate</p>
                      <p className="text-lg font-bold text-blue-700">{loan.interestRate}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-400 mb-6">
                    <span className="flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> ROI Expectation</span>
                    <span className="text-slate-800 font-bold">{Number(loan.interestRate) - 2}% Net</span>
                  </div>

                  <button 
                    onClick={() => navigate(`/loan/${loan.id}`)} 
                    className="w-full flex items-center justify-between bg-slate-900 text-white py-3 px-4 rounded-xl font-bold hover:bg-blue-600 transition-all group-hover:shadow-lg group-hover:shadow-blue-100"
                  >
                    Analyze Opportunity
                    <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
