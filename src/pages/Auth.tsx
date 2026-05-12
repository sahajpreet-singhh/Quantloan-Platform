import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, TrendingUp, Users, LogIn, Mail, Lock, UserPlus, Fingerprint } from 'lucide-react';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  const detailedError = JSON.stringify(errInfo);
  console.error('Firestore Error: ', detailedError);
  return detailedError;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Investor' | 'Borrower'>('Investor');
  
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, error: authError } = useAuth();
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (user && profile) {
      navigate('/marketplace');
    }
  }, [user, profile, navigate]);

  const checkUserProfile = async (authUser: any) => {
    let handled = false;
    try {
      const docRef = doc(db, 'users', authUser.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setShowRoleSelection(true);
        setLoading(false); // Stop local spinner
      } else {
        navigate('/marketplace');
      }
    } catch (err: any) {
      console.error("Profile check error:", err);
      const info = handleFirestoreError(err, OperationType.GET, `users/${authUser.uid}`);
      setErrorMsg(`Profile Access Error: ${info}. Check if Firestore is enabled for this project.`);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await checkUserProfile(result.user);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg("Sign-in window was closed. Please try again.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg(`Authorized Domain Error: The domain ${currentUrl} is not authorized in Firebase Console. Please add it to Authentication > Settings > Authorized Domains.`);
      } else {
        setErrorMsg(err.message || "Authentication failed!");
      }
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      let authUser;
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        authUser = result.user;
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        authUser = result.user;
      }
      await checkUserProfile(authUser);
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg(`Authorized Domain Error: The domain ${currentUrl} is not allowed. In Firebase Console, go to Authentication > Settings > Authorized Domains and add this exact URL.`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg("Sign-in Method Disabled: Email/Password sign-in is not enabled. In Firebase Console, go to Authentication > Sign-in method and enable 'Email/Password'.");
      } else if (isLogin) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setErrorMsg("Email or password is incorrect.");
        } else {
          setErrorMsg(err.message || "Login failed.");
        }
      } else {
        if (err.code === 'auth/email-already-in-use') {
          setErrorMsg("An account with this email already exists. Please sign in instead.");
          setIsLogin(true); // Automatically switch to login for better UX
        } else if (err.code === 'auth/weak-password') {
          setErrorMsg("Password is too weak. Please use at least 6 characters.");
        } else {
          setErrorMsg(err.message || "Signup failed.");
        }
      }
      setLoading(false);
    }
  };

  const finalizeRegistration = async () => {
    if (!user) return;
    setLoading(true);
    let handled = false;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: user.displayName || email.split('@')[0] || 'User',
        email: user.email,
        role: selectedRole,
        createdAt: serverTimestamp()
      }).catch(err => {
        const info = handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        setErrorMsg(`Registration Write Failure: ${info}`);
        handled = true;
        throw err;
      });
      // Navigation will be handled by useEffect [user, profile]
    } catch (err: any) {
      console.error("Profile creation error:", err);
      if (!handled) setErrorMsg("Protocol initialization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-xl p-12 rounded-[32px] shadow-2xl shadow-blue-100 border border-slate-100 text-center"
        >
          <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Fingerprint className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Identity Specification</h2>
          <p className="text-slate-500 mb-10 text-lg">Select your primary functional role within the QuantBank ecosystem to initialize your terminal.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <button 
              onClick={() => setSelectedRole('Investor')}
              className={`p-8 rounded-[24px] border-2 transition-all text-left flex flex-col gap-4 relative overflow-hidden ${selectedRole === 'Investor' ? 'border-blue-600 bg-blue-50/50 shadow-lg' : 'border-slate-100 hover:border-slate-200'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'Investor' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Strategic Investor</h3>
                <p className="text-sm text-slate-500">Deploy capital into high-yield enterprise instruments.</p>
              </div>
              {selectedRole === 'Investor' && <div className="absolute top-4 right-4 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />}
            </button>

            <button 
              onClick={() => setSelectedRole('Borrower')}
              className={`p-8 rounded-[24px] border-2 transition-all text-left flex flex-col gap-4 relative overflow-hidden ${selectedRole === 'Borrower' ? 'border-blue-600 bg-blue-50/50 shadow-lg' : 'border-slate-100 hover:border-slate-200'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === 'Borrower' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Enterprise Borrower</h3>
                <p className="text-sm text-slate-500">Access institutional liquidity for corporate expansion.</p>
              </div>
              {selectedRole === 'Borrower' && <div className="absolute top-4 right-4 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />}
            </button>
          </div>

          <button 
            onClick={finalizeRegistration}
            disabled={loading}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-slate-200"
          >
            {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Finalize Initialization'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-sans">
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
            <p className="text-xl text-blue-200 mb-12 max-w-lg font-light leading-relaxed">
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
                <p className="text-sm opacity-80">Real-time risk assessment using fundamental metrics.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-800 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Direct Market</h3>
                <p className="text-sm opacity-80">Transparent peer-to-peer enterprise marketplace.</p>
              </div>
            </div>
          </div>
        </div>
        
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
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Protocol Access' : 'Create Account'}
            </h2>
            <p className="text-slate-500 text-sm">
              {isLogin 
                ? 'Enter your credentials to access the lending terminal.' 
                : 'Join the next generation of institutional liquidity.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium flex gap-2 items-start animate-shake">
              <span className="shrink-0 text-rose-400">⚠️</span>
              <p>{errorMsg}</p>
            </div>
          )}

          {authError && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm font-medium flex gap-2 items-start">
              <span className="shrink-0 text-amber-400">⚠️</span>
              <p>{authError}</p>
            </div>
          )}

          {authLoading && user && !profile && !showRoleSelection && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 text-sm font-medium flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p>Initializing terminal and syncing identity...</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Access Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-white px-4 text-slate-400 font-bold">Or continue with</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 p-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all disabled:opacity-70 shadow-sm mb-6"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Google Identity
          </button>

          <p className="text-center text-slate-500 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Briefcase(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
