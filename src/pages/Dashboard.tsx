import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Wallet, Briefcase, TrendingUp, ArrowRight, ExternalLink, LogOut } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

enum OperationType {
  LIST = 'list',
  GET = 'get',
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  console.error('Firestore Error: ', error);
}

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) return;

    let q;
    if (profile.role === 'Investor') {
      q = query(collection(db, 'investments'), where('investorId', '==', user.uid));
    } else {
      q = query(collection(db, 'loans'), where('borrowerId', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, profile.role === 'Investor' ? 'investments' : 'loans');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, profile]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const totalValue = data.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  
  const dist = data.reduce((acc, curr) => {
    const g = curr.grade || 'C';
    acc[g] = (acc[g] || 0) + Number(curr.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { name: 'GRADE A', value: dist.A || 0, color: '#10b981' },
    { name: 'GRADE B', value: dist.B || 0, color: '#f59e0b' },
    { name: 'GRADE C', value: dist.C || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const isInvestor = profile?.role === 'Investor';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Briefcase className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Quant Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/marketplace')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
            Marketplace <ArrowRight className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-8">
        <div className="mb-10">
           <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
             {isInvestor ? 'Portfolio Overview' : 'Corporate Ledger'}
           </h2>
           <p className="text-slate-500 mt-1">
             {isInvestor 
               ? `Real-time performance tracking and risk distribution of ${profile?.name}.`
               : `Active funding requests and quantitative scoring for ${profile?.name}.`
             }
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
          >
             <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  {isInvestor ? 'AUM (In Marketplace)' : 'Total Liability'}
                </p>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Wallet className="w-5 h-5" />
                </div>
             </div>
             <p className="text-4xl font-black text-slate-900">₹{totalValue.toLocaleString()}</p>
             <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>{isInvestor ? '+12.4% Est. Yield' : 'Verified Risk Score'}</span>
             </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
          >
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
               {isInvestor ? 'Active Positions' : 'Market Listings'}
             </p>
             <p className="text-4xl font-black text-slate-900">{data.length}</p>
             <p className="mt-4 text-sm text-slate-500 font-medium">Distributed across {(Object.values(dist) as number[]).filter(v => v > 0).length} risk tranches</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center"
           >
              <h3 className="text-xl font-bold text-slate-800 self-start mb-8 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Risk Distribution
              </h3>
              {chartData.length > 0 ? (
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Value']}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400 text-center px-10">
                  <p>No active {isInvestor ? 'investments' : 'loans'} found in the protocol.</p>
                </div>
              )}
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
           >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-slate-800">
                   {isInvestor ? 'Current Holdings' : 'My Listings'}
                 </h3>
                 <button 
                  onClick={() => navigate(isInvestor ? '/marketplace' : '/borrower')} 
                  className="text-sm font-bold text-blue-600 hover:underline"
                 >
                   {isInvestor ? 'Deploy Capital' : 'Request Loan'}
                 </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                       <tr>
                          <th className="px-8 py-4">Entity</th>
                          <th className="px-8 py-4">Nominal</th>
                          <th className="px-8 py-4">ROI/Yield</th>
                          <th className="px-8 py-4 text-right">Details</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {data.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                   <div className={`w-2 h-2 rounded-full ${item.grade === 'A' ? 'bg-emerald-500' : item.grade === 'B' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                   <span className="font-bold text-slate-800">{item.companyName}</span>
                                </div>
                             </td>
                             <td className="px-8 py-5 font-medium text-slate-600">₹{Number(item.amount || 0).toLocaleString()}</td>
                             <td className="px-8 py-5 text-blue-600 font-bold">{item.interestRate || item.rate}%</td>
                             <td className="px-8 py-5 text-right">
                                <button onClick={() => navigate(isInvestor ? `/loan/${item.loanId}` : `/loan/${item.id}`)} className="text-slate-300 group-hover:text-blue-600 transition-colors">
                                   <ExternalLink className="w-4 h-4 ml-auto" />
                                </button>
                             </td>
                          </tr>
                       ))}
                       {data.length === 0 && (
                         <tr>
                           <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">
                             No data points found in the protocol.
                           </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </motion.div>
        </div>
      </main>
    </div>
  );
}
