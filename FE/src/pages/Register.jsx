import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api.js';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // --- States cho Đăng ký ---
  const [form, setForm] = useState({ email: '', passwordHash: '', confirmPassword: '', role: 'STUDENT' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // --- States cho Xác thực OTP ---
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút bằng giây (300s)

  // Countdown Timer cho OTP
  useEffect(() => {
    let timer;
    if (isVerifying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isVerifying, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Gửi Form Đăng ký
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.passwordHash !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/api/auth/register', {
        email: form.email,
        password: form.passwordHash,
        role: form.role
      });
      
      setSuccess('Đăng ký tài khoản thành công! Mã xác thực đã được gửi.');
      setMockOtp(res.data.otp);
      console.log(`[Email Service] Gửi mã OTP đến ${form.email}: ${res.data.otp}`);
      setEmailForOtp(form.email);
      setTimeLeft(300); // Reset timer
      
      // Chuyển sang màn hình xác thực sau 1 giây
      setTimeout(() => {
        setIsVerifying(true);
        setSuccess('');
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message
        ?? err.response?.data?.error
        ?? err.message
        ?? 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Gửi Form Xác thực OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (timeLeft <= 0) {
      setError('Mã xác thực đã hết hạn. Vui lòng bấm "Gửi lại mã".');
      return;
    }

    if (otpInput.trim().length !== 5) {
      setError('Mã xác thực phải bao gồm đúng 5 chữ số.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/api/auth/verify-otp', {
        email: emailForOtp,
        otp: otpInput.trim()
      });

      setSuccess('Xác thực mã OTP thành công! Đang tự động đăng nhập...');

      // Đăng nhập tự động và chuyển hướng về trang chủ
      setTimeout(() => {
        login(res.data.token, res.data.role);
        navigate('/');
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message
        ?? err.response?.data?.error
        ?? err.message
        ?? 'Mã xác thực không chính xác hoặc đã hết hạn.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Gửi lại mã OTP
  async function handleResendOtp() {
    setError('');
    setSuccess('');
    setOtpInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/resend-otp', {
        email: emailForOtp
      });
      
      setMockOtp(res.data.otp);
      console.log(`[Email Service] Gửi lại mã OTP mới đến ${emailForOtp}: ${res.data.otp}`);
      setTimeLeft(300); // Reset timer 5 phút
      setSuccess('Mã xác thực mới đã được gửi thành công!');
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Gửi lại mã OTP thất bại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Column: Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center">
        {/* Full screen background image */}
        <img 
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1600&auto=format&fit=crop" 
          alt="Evidence Network" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-indigo-900/60 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-indigo-900/20 to-transparent"></div>
        
        <div className="relative z-10 text-center px-12 max-w-lg flex flex-col items-center">
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight drop-shadow-md">Join Evidence Pilot</h2>
          <p className="text-indigo-50 text-lg drop-shadow-md">
            Create an account to start mapping claims to evidence, collaborating with instructors, and managing your academic projects efficiently.
          </p>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-md relative">
          
          {/* Back to Home Button */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors gap-1.5 group">
              <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại Trang chủ
            </Link>
          </div>

          {/* MÀN HÌNH 1: ĐIỀN THÔNG TIN ĐĂNG KÝ */}
          {!isVerifying ? (
            <>
              <div className="mb-10 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h1>
                <p className="text-gray-500">Sign up to get started.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="passwordHash"
                    value={form.passwordHash}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 animate-fadeIn">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100 flex items-center animate-fadeIn">
                    <svg className="w-5 h-5 mr-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-8">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                  Log in instead
                </Link>
              </p>
            </>
          ) : (
            // MÀN HÌNH 2: XÁC THỰC MÃ OTP
            <>
              <div className="mb-10 text-center sm:text-left animate-fadeIn">
                <h1 className="text-3xl font-black text-indigo-700 mb-2 tracking-tight">Xác thực tài khoản</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Chúng tôi đã gửi mã xác thực OTP gồm 5 số đến email <span className="font-bold text-gray-800">{emailForOtp}</span>. Vui lòng nhập mã để kích hoạt tài khoản.
                </p>
              </div>



              <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fadeIn">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                      Mã xác thực (5 chữ số)
                    </label>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${timeLeft > 60 ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50 animate-pulse'}`}>
                      ⏱️ {formatTime(timeLeft)}
                    </span>
                  </div>
                  <input
                    type="text"
                    name="otp"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    required
                    placeholder="Enter 5-digit code"
                    className="w-full text-center tracking-[0.7em] font-mono text-xl border border-gray-300 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 animate-fadeIn">
                    ⚠️ {error}
                  </div>
                )}
                
                {success && (
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100 flex items-center animate-fadeIn">
                    <svg className="w-5 h-5 mr-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {success}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="flex-1 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all disabled:opacity-50"
                  >
                    Gửi lại mã
                  </button>
                  <button
                    type="submit"
                    disabled={loading || timeLeft <= 0}
                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang xác nhận...' : 'Xác nhận mã OTP'}
                  </button>
                </div>
              </form>

              {/* Nút quay lại trang Đăng ký ban đầu */}
              <div className="mt-8 pt-6 border-t border-slate-100 text-center animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifying(false);
                    setError('');
                    setSuccess('');
                    setOtpInput('');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  ← Quay lại trang Đăng ký
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
