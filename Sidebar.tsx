import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Package,
  Boxes,
  History,
  ArrowDownToLine,
  Users,
  Truck,
  TrendingUp,
  Settings,
  LogOut,
  X,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { AppSettings, UserPermissions } from '../types';
import { getCurrentUser } from '../lib/storage';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  settings: AppSettings;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onLogout,
  settings,
  isOpenMobile,
  onCloseMobile,
}) => {
  const currentUser = getCurrentUser();
  const perms: Partial<UserPermissions> = currentUser?.permissions || {};
  const isAdmin = currentUser?.role === 'admin';

  const allNavItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, visible: true },
    {
      id: 'new-invoice',
      label: '+ فاتورة جديدة',
      icon: FilePlus,
      highlight: true,
      visible: isAdmin || !!perms.canManageInvoices,
    },
    {
      id: 'invoices',
      label: 'سجل الفواتير',
      icon: FileText,
      visible: isAdmin || !!perms.canManageInvoices,
    },
    {
      id: 'products',
      label: 'المنتجات والأسعار',
      icon: Package,
      visible: isAdmin || !!perms.canManageProducts,
    },
    {
      id: 'inventory',
      label: 'المخزون والكميات',
      icon: Boxes,
      visible: isAdmin || !!perms.canManageInventory,
    },
    {
      id: 'stock-movements',
      label: 'سجل حركة المخزون',
      icon: History,
      visible: isAdmin || !!perms.canManageInventory,
    },
    {
      id: 'stock-in',
      label: 'إدخال بضاعة',
      icon: ArrowDownToLine,
      visible: isAdmin || !!perms.canManageInventory,
    },
    {
      id: 'customers',
      label: 'دليل العملاء',
      icon: Users,
      visible: isAdmin || !!perms.canManageCustomers,
    },
    {
      id: 'suppliers',
      label: 'الموردين',
      icon: Truck,
      visible: isAdmin || !!perms.canManageSuppliers,
    },
    {
      id: 'reports',
      label: 'تقارير الأرباح',
      icon: TrendingUp,
      visible: isAdmin || !!perms.canViewReports,
    },
    {
      id: 'users',
      label: 'المستخدمين والصلاحيات',
      icon: ShieldCheck,
      visible: isAdmin || !!perms.canManageUsers,
    },
    {
      id: 'settings',
      label: 'إعدادات النظام',
      icon: Settings,
      visible: isAdmin || !!perms.canManageSettings,
    },
  ];

  const visibleNavItems = allNavItems.filter(item => item.visible);

  const getRoleLabel = () => {
    switch (currentUser?.role) {
      case 'admin':
        return 'مدير النظام (Admin)';
      case 'accountant':
        return 'محاسب مالي';
      case 'sales':
        return 'مسؤول مبيعات';
      case 'inventory':
        return 'أمين مستودع';
      default:
        return 'مستخدم النظام';
    }
  };

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir="rtl"
      >
        {/* Brand / Logo Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-white tracking-tight truncate">{settings.businessName}</h2>
              <span className="text-[10px] text-blue-400 font-semibold block">
                بوابة التاجر • مبيعات طبية وتجميلية
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency Indicator */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">العملة المعتمدة:</span>
          <span className="font-mono font-bold text-blue-400 text-xs">₪ شيكل إسرائيلي</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-xs transition-colors text-right cursor-pointer ${
                  item.highlight
                    ? isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-blue-600/15 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30'
                    : isActive
                    ? 'text-blue-400 bg-slate-800/70 border-r-4 border-blue-600'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : item.highlight ? 'text-blue-300' : 'text-slate-400'}`} />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="bg-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 border border-slate-700/50">
            <div
              className={`flex items-center gap-2.5 overflow-hidden flex-1 ${
                isAdmin || perms.canManageUsers ? 'cursor-pointer hover:opacity-90' : ''
              }`}
              onClick={() => {
                if (isAdmin || perms.canManageUsers) {
                  onNavigate('users');
                  onCloseMobile();
                }
              }}
              title={isAdmin || perms.canManageUsers ? 'إدارة المستخدمين والصلاحيات' : undefined}
            >
              <div
                className={`w-8 h-8 rounded-lg ${
                  currentUser?.avatarColor || 'bg-blue-600'
                } flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs`}
              >
                {currentUser?.name ? currentUser.name.substring(0, 2) : 'أد'}
              </div>
              <div className="overflow-hidden text-right">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser?.name || 'مدير النظام'}
                </p>
                <p className="text-[10px] text-blue-300 truncate">
                  {getRoleLabel()}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/80 rounded-lg transition-colors cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
