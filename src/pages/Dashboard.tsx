import { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Wallet, Briefcase, TrendingUp, Sparkles, ArrowRight, ExternalLink, LogOut, ChevronRight, ShieldCheck, Activity, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.id) {
       navigate('/');
       return;
    }
    axios.get(`/api/investments/user/${user.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => {
      setPortfolio(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user.id]);

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const totalInvested = portfolio.reduce((acc, curr) => acc + Number(curr.invested_amount), 0);
  
  // Calculate distribution
  const dist: Record<string, number> = { A: 0, B: 0, C: 0 };
  portfolio.forEach(i => {
    dist[i.grade] = (dist[i.grade] || 0) + Number(i.invested_amount);
  });

  const chartData = [
    { name: 'GRADE A', value: dist.A, color: '#10b981' },
    { name: 'GRADE B', value: dist.B, color: '#f59e0b' },
    { name: 'GRADE C', value: dist.C, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const optimizePortfolio = () => {
    const cExp = portfolio.length > 0 ? ((dist.C / totalInvested) * 100).toFixed(1) : '0';
    alert(`QUANT ENGINE RECOMMENDATION\n\nExposure Analysis:\n• Current Grade C exposure: ${cExp}%\n• Benchmark Target: 20.0%\n\nStrategy: SELL High-Duration Grade C assets if yield falls below 14.5%. REALLOCATE to Grade A Smart-Beta tranches for volatility protection.`);
  };

  if (loading) return null;

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
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-8">
        <div className="mb-10">
           <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portfolio Overview</h2>
           <p className="text-slate-500 mt-1">Real-time performance tracking and risk distribution.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
          >
             <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">AUM (In Marketplace)</p>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Wallet className="w-5 h-5" />
                </div>
             </div>
             <p className="text-4xl font-black text-slate-900">₹{totalInvested.toLocaleString()}</p>
             <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>+12.4% Est. Yield</span>
             </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-blue-100 relative overflow-hidden"
          >
             <div className="relative z-10">
               <h3 className="text-white text-lg font-bold mb-2">Smart Optimization</h3>
               <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                 AI-driven suggestions to rebalance based on market volatility.
               </p>
               <button 
                 onClick={optimizePortfolio} 
                 className="bg-blue-600 text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900"
               >
                 <Sparkles className="w-4 h-4" /> Rebalance Portfolio
               </button>
             </div>
             <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl" />
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
          >
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Positions</p>
             <p className="text-4xl font-black text-slate-900">{portfolio.length}</p>
             <p className="mt-4 text-sm text-slate-500 font-medium">Distributed across {Object.values(dist).filter(v => v > 0).length} risk tranches</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Chart */}
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
                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Invested']}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400 text-center px-10">
                   <p>No active investments. Visit the marketplace to deploy capital.</p>
                </div>
              )}
           </motion.div>

           {/* Holdings Table */}
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
           >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-slate-800">Current Holdings</h3>
                 <button onClick={()=>navigate('/marketplace')} className="text-sm font-bold text-blue-600 hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                       <tr>
                          <th className="px-8 py-4">Company</th>
                          <th className="px-8 py-4">Amount</th>
                          <th className="px-8 py-4">Yield</th>
                          <th className="px-8 py-4 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {portfolio.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                   <div className={`w-2 h-2 rounded-full ${item.grade === 'A' ? 'bg-emerald-500' : item.grade === 'B' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                   <span className="font-bold text-slate-800">{item.company_name}</span>
                                </div>
                             </td>
                             <td className="px-8 py-5 font-medium text-slate-600">₹{Number(item.invested_amount).toLocaleString()}</td>
                             <td className="px-8 py-5 text-blue-600 font-bold">{item.interest_rate}%</td>
                             <td className="px-8 py-5 text-right">
                                <button onClick={() => navigate(`/loan/${item.loan_id}`)} className="text-slate-300 group-hover:text-blue-600 transition-colors">
                                   <ExternalLink className="w-4 h-4 ml-auto" />
                                </button>
                             </td>
                          </tr>
                       ))}
                       {portfolio.length === 0 && (
                         <tr>
                            <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No active holdings found.</td>
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
