import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { QrCode } from 'lucide-react';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Map Employee ID to a dummy email for Supabase Auth to work seamlessly
    const email = `${employeeId.trim().toLowerCase()}@company.internal`;

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Logged in successfully!');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Signed up successfully! You can now log in.');
      }
    } catch (error: any) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid Employee ID or Password');
      } else if (error.message.includes('rate limit') || error.message.includes('email rate limit exceeded')) {
        toast.error('Rate limit reached! You must turn off "Confirm Email" in your Supabase dashboard.');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-branding">
          <div className="auth-logo">
            <QrCode size={28} />
          </div>
          <h1>StockQR</h1>
          <p>Intelligent Inventory Management</p>
        </div>

        <div className="auth-form-card">
          <h2>{isLogin ? 'Welcome back' : 'Create account'}</h2>
          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input 
                type="text" 
                className="form-control" 
                value={employeeId} 
                onChange={(e) => setEmployeeId(e.target.value)} 
                placeholder="e.g. EMP123"
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password"
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
          <div className="auth-toggle">
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
