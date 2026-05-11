import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, TrendingUp, Users } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Investor' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const url = `/api/auth/${isLogin ? 'login' : 'signup'}`;
    try {
      const res = await axios.post(url, form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      if (res.data.user.role === 'Investor') {
        navigate('/dashboard');
      } else {
        navigate('/borrower');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Authentication failed! Please check your connection.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar / Info Section */}
      <div className="hidden lg:flex flex-col justify-center bg-blue-900 w-1/2 p-16 text-white relative overflow-hidden">
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-8"
          >
            <Shield className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold tracking-tight">QuantBank</h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl font-extrabold mb-6 leading-tight">
              Evidence-based lending <br /> for the modern era.
            </h2>
            <p className="text-xl text-blue-200 mb-12 max-w-lg">
              Seamlessly connect verified borrowers with strategic investors using our proprietary 
              quant-scoring risk model and predictive simulation engine.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-blue-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-800 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Quant Scoring</h3>
                <p className="text-sm">Real-time risk assessment using fundamental metrics.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-800 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Direct Market</h3>
                <p className="text-sm">Transparent peer-to-peer enterprise marketplace.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-800 rounded-full blur-3xl opacity-50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-700 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border border-slate-100"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500">
              {isLogin ? 'Access your dashboard and portfolio' : 'Start your journey as an investor or borrower'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                  onChange={e => setForm({...form, name: e.target.value})} 
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <input 
                type="email" 
                placeholder="name@company.com" 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                required 
                onChange={e => setForm({...form, email: e.target.value})} 
              />
            </div>
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({...form, role: 'Investor'})}
                    className={`p-3 rounded-xl border text-sm font-semibold transition-all ${form.role === 'Investor' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}
                  >
                    Investor
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({...form, role: 'Borrower'})}
                    className={`p-3 rounded-xl border text-sm font-semibold transition-all ${form.role === 'Borrower' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}
                  >
                    Borrower
                  </button>
                </div>
              </div>
            )}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Get Started'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-blue-600 font-bold hover:underline"
              >
                {isLogin ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
