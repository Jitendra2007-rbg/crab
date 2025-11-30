import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, User } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { signInWithGoogle, signupEmail, loginEmail } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agentName, setAgentName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isSignup && !agentName.trim()) {
        setError('Please enter a name for your AI agent');
        return;
    }

    setLoading(true);
    
    try {
        if (isSignup) {
            await signupEmail(email, password, agentName);
        } else {
            await loginEmail(email, password);
        }
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Authentication failed');
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setError('');
      try {
          await signInWithGoogle();
      } catch (err: any) {
          console.error("Google Auth Error:", err);
          setError(err.message || 'Google sign-in failed.');
      }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white dark:bg-dark-bg p-6 overflow-y-auto">
       <div className="w-full max-w-sm animate-fade-in">
           
           <div className="text-center mb-10">
                <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <span className="text-3xl font-bold text-white dark:text-black tracking-tighter">C</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    {isSignup ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {isSignup ? 'Set up your AI companion' : 'Sign in to continue to CRAB'}
                </p>
           </div>

           {error && (
               <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl flex items-start space-x-2 text-red-600 dark:text-red-400 text-xs">
                   <AlertCircle size={16} className="mt-0.5 min-w-[16px]" />
                   <span>{error}</span>
               </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
               
               {isSignup && (
                   <div className="relative animate-slide-up">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <User size={18} className="text-gray-400" />
                       </div>
                       <input 
                            type="text" 
                            required={isSignup}
                            placeholder="Agent Name (e.g. Jarvis)"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-black dark:focus:border-white transition-colors dark:text-white placeholder-gray-400"
                       />
                   </div>
               )}

               <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Mail size={18} className="text-gray-400" />
                   </div>
                   <input 
                        type="email" 
                        required
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-black dark:focus:border-white transition-colors dark:text-white placeholder-gray-400"
                   />
               </div>
               
               <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Lock size={18} className="text-gray-400" />
                   </div>
                   <input 
                        type="password" 
                        required
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-black dark:focus:border-white transition-colors dark:text-white placeholder-gray-400"
                   />
               </div>

               <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-base shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center space-x-2"
               >
                 <span>{loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Log In')}</span>
                 {!loading && <ArrowRight size={18} />}
               </button>
           </form>

           <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-dark-bg text-gray-500">Or continue with</span>
                </div>
           </div>

           <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 p-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
           >
             {/* Simple Google G Icon */}
             <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
             </svg>
             <span className="font-semibold text-gray-700 dark:text-gray-200">Google</span>
           </button>

           <div className="mt-8 text-center">
               <button 
                onClick={() => { setIsSignup(!isSignup); setError(''); }}
                className="text-sm font-semibold text-gray-900 dark:text-white hover:underline"
               >
                   {isSignup ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
               </button>
           </div>

       </div>
    </div>
  );
};

export default LoginPage;