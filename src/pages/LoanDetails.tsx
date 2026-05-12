import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, ShieldCheck, ChevronRight, Building, Wallet, Briefcase, Sparkles, Phone, Mail, MapPin, User } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

enum OperationType {
  WRITE = 'write',
  CREATE = 'create',
  GET = 'get',
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  console.error('Firestore Error: ', error);
}

export default function LoanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<any>(null);
  const [simAmount, setSimAmount] = useState(50000);
  const [investing, setInvesting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!id) return;
    
    const fetchLoan = async () => {
      try {
        const docRef = doc(db, 'loans', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const loanData = { id: docSnap.id, ...docSnap.data() };
          setLoan(loanData);
          runAiAnalysis(loanData);
        } else {
          console.error("No such loan!");
          navigate('/marketplace');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `loans/${id}`);
      }
    };

    fetchLoan();
  }, [id, navigate]);

  const runAiAnalysis = async (loanData: any) => {
    if (!loanData || !process.env.GEMINI_API_KEY) return;
    setAnalyzing(true);
    try {
      const prompt = `You are a high-end Quant Bank Analyst. Analyze this enterprise loan request and provide a 3-paragraph "Deep Tissue Analysis":
      Company: ${loanData.companyName}
      Purpose: ${loanData.purpose}
      Amount: ₹${loanData.amount}
      Interest Rate: ${loanData.interestRate}%
      Risk Grade: ${loanData.grade}
      Metrics: Revenue ${loanData.revenue}%, Profit ${loanData.profit}%, Debt ${loanData.debt}%, Cashflow ${loanData.cashflow}%
      
      Structure:
      1. Business Model Vulnerability Assessment.
      2. Quantitative Risk Factors (based on the percentages).
      3. Strategic recommendation for institutional investors.
      Keep it professional, technical, and data-driven. Use markdown for bolding key terms.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiAnalysis(response.text);
    } catch (err) {
      console.error("AI Analysis failed:", err);
      setAiAnalysis("Unable to generate AI analysis at this time.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleInvest = async () => {
    if (!user || !loan || profile?.role !== 'Investor') return;
    setInvesting(true);
    try {
      await addDoc(collection(db, 'investments'), {
        investorId: user.uid,
        loanId: loan.id,
        amount: simAmount,
        companyName: loan.companyName,
        grade: loan.grade,
        interestRate: loan.interestRate,
        createdAt: serverTimestamp()
      });
      alert('Investment execution successful! Position added to portfolio.');
      navigate('/dashboard');
    } catch(err: any) {
      console.error("Investment Error:", err);
      handleFirestoreError(err, OperationType.CREATE, 'investments');
      alert("Error executing investment. Check permissions and network.");
    } finally {
      setInvesting(false);
    }
  };

  if(!loan) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Loan Analysis</h1>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Investor: <span className="text-slate-900 font-bold">{profile?.name}</span></span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-10 px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{loan.companyName}</h2>
                  <p className="text-slate-500 mt-1 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Enterprise Sector: FinTech
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-black border ${
                  loan.grade === 'A' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                  loan.grade === 'B' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-rose-100 text-rose-700 border-rose-200'
                }`}>
                  GRADE {loan.grade}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Principal</p>
                  <p className="text-xl font-bold text-slate-900">₹{Number(loan.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Interest</p>
                  <p className="text-xl font-bold text-blue-600">{loan.interestRate}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Tenure</p>
                  <p className="text-xl font-bold text-slate-900">{loan.tenure} Months</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Company Profile</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {loan.companyDescription || "No detailed company profile provided."}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Business Case & Capital Deployment</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {loan.purpose}. This investment is backed by a diversified revenue stream with a historical 
                    retention rate of 85%. The capital will be deployed primarily for operational scaling 
                    and infrastructure modularization.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Lister & Contact Verification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <User className="w-4 h-4 text-slate-400 mt-1" />
                        <div>
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Representative</p>
                          <p className="text-sm font-bold text-slate-900">{loan.listerName || "Not Available"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-slate-400 mt-1" />
                        <div>
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Phone</p>
                          <p className="text-sm font-bold text-slate-900">{loan.listerPhone || "Not Available"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-slate-400 mt-1" />
                        <div>
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Email</p>
                          <p className="text-sm font-bold text-slate-900">{loan.listerEmail || "Not Available"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                        <div>
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Office Address</p>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{loan.officeAddress || "Not Available"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-blue-600">
                  <Sparkles className="w-5 h-5" />
                  QuantBank AI Reasoning
                </h3>
                {analyzing ? (
                   <div className="flex flex-col gap-3">
                      <div className="h-4 bg-slate-100 animate-pulse rounded w-full" />
                      <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4" />
                      <div className="h-4 bg-slate-100 animate-pulse rounded w-5/6" />
                   </div>
                ) : (
                  <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line prose prose-slate max-w-none">
                    {aiAnalysis || "Risk analysis summary generated by Quant Engine."}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Risk Breakdown */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
            >
               <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-blue-600" />
                 Quantitative Risk Profile
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: 'Revenue Strength', val: loan.revenue, icon: TrendingUp },
                    { label: 'Profitability Margin', val: loan.profit, icon: Wallet },
                    { label: 'Debt to Equity', val: loan.debt, icon: Briefcase },
                    { label: 'Cashflow Liquidity', val: loan.cashflow, icon: Wallet }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-3">
                       <div className="flex justify-between items-end">
                         <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                           {/* @ts-ignore */}
                           <stat.icon className="w-4 h-4 text-slate-400" />
                           {stat.label}
                         </span>
                         <span className="text-sm font-black text-slate-900">{stat.val}/100</span>
                       </div>
                       <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.val}%` }}
                            transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                            className={`h-full ${Number(stat.val) > 70 ? 'bg-emerald-500' : Number(stat.val) > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          </div>

          {/* Right Column: Investment Action */}
          <div className="space-y-8">
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-slate-900 p-8 rounded-3xl shadow-2xl shadow-blue-200 sticky top-28"
             >
                <h3 className="text-white text-xl font-bold mb-6">Investment Terminal</h3>
                
                <div className="space-y-6 mb-8">
                   <div className="flex justify-between border-b border-white/10 pb-4">
                      <span className="text-slate-400 text-sm">Min. Allocation</span>
                      <span className="text-white font-bold">₹10,000</span>
                   </div>
                   <div className="flex justify-between border-b border-white/10 pb-4">
                      <span className="text-slate-400 text-sm">Est. Annual Return</span>
                      <span className="text-emerald-400 font-bold">₹{(loan.amount * (loan.interestRate/100)).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Risk Adjusted Alpha</span>
                      <span className="text-blue-400 font-bold">+{loan.grade === 'A' ? '4.2%' : loan.grade === 'B' ? '2.8%' : '1.5%'}</span>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input 
                      type="number" 
                      placeholder="Investment Amount" 
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-4 pl-8 text-white font-bold outline-none focus:border-blue-500 transition-all"
                      onChange={e => setSimAmount(Number(e.target.value))}
                    />
                  </div>

                  <button 
                    disabled={investing || !simAmount || profile?.role !== 'Investor'}
                    onClick={handleInvest}
                    className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {investing ? 'Executing...' : 'Confirm Placement'}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  {profile?.role !== 'Investor' && (
                    <p className="text-rose-400 text-[10px] text-center mt-2 font-bold uppercase tracking-widest">Only Investors can confirm placements</p>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 mt-6 text-center leading-relaxed">
                  By clicking confirm, you authorize the placement of capital into this specific asset tranche as per our terms of service.
                </p>
             </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
}
