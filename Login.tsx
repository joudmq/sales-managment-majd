import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, Users, Eye, EyeOff } from 'lucide-react';
import { checkAuthCredentials, getUsers } from '../lib/storage';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const usersList = getUsers();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = checkAuthCredentials(username.trim(), password.trim());
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
  };

  const handleQuickSelect = (uName: string, uPwd?: string) => {
    setUsername(uName);
    setPassword(uPwd || '123456');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
        {/* Logo and title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">تسجيل الدخول للنظام</h1>
          <p className="text-xs text-slate-500">
            نظام إدارة المبيعات الطبية، الفواتير، والمخزون
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم المستخدم</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pr-10 pl-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Available system accounts quick buttons */}
          {usersList.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>حسابات النظام المسجلة (انقر للتعبئة السريعة):</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {usersList.slice(0, 4).map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u.username, u.password)}
                    className={`p-1.5 rounded-lg border text-right transition-all text-[11px] ${
                      username.toLowerCase() === u.username.toLowerCase()
                        ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="truncate font-semibold">{u.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mt-0.5">
                      <span>@{u.username}</span>
                      <span className="text-[9px] px-1 bg-slate-100 rounded text-slate-600">
                        {u.role === 'admin'
                          ? 'مدير'
                          : u.role === 'accountant'
                          ? 'محاسب'
                          : u.role === 'inventory'
                          ? 'مستودع'
                          : 'مبيعات'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md cursor-pointer"
          >
            دخول النظام
          </button>
        </form>
      </div>
    </div>
  );
};
