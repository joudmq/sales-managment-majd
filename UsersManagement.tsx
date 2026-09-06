import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Key,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Clock,
  Search,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { UserAccount, UserRole, UserPermissions } from '../types';
import {
  getUsers,
  saveUser,
  deleteUser,
  toggleUserStatus,
  getCurrentUser,
  defaultPermissionsByRole,
} from '../lib/storage';

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; desc: string; color: string; bg: string; border: string }
> = {
  admin: {
    label: 'مدير النظام (Admin)',
    desc: 'صلاحيات إدارية كاملة غير مقيدة لكافة الأقسام والمستخدمين',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  accountant: {
    label: 'محاسب مالي',
    desc: 'إدارة الفواتير والمدفوعات والتقارير المالية وحسابات الموردين والعملاء',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  sales: {
    label: 'مسؤول مبيعات',
    desc: 'إنشاء الفواتير والتعامل مع العملاء والأسعار وسجل المبيعات',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  inventory: {
    label: 'أمين مستودع ومخزون',
    desc: 'إدخال البضاعة وحركات المخزون وجرد الكميات والتوريدات',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
};

const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  canManageProducts: 'إدارة وتعديل المنتجات والأسعار',
  canManageInvoices: 'إنشاء وإدارة الفواتير والتحصيل',
  canManageCustomers: 'إدارة وتعديل بيانات العملاء',
  canManageSuppliers: 'إدارة حسابات الموردين',
  canManageInventory: 'إدارة المخزون وإدخال البضاعة',
  canViewReports: 'مشاهدة تقارير الأرباح والمبيعات',
  canManageSettings: 'تعديل إعدادات النظام والفواتير',
  canManageUsers: 'إدارة حسابات المستخدمين وصلاحياتهم',
};

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-slate-700',
];

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: 'sales' as UserRole,
    password: '',
    phone: '',
    email: '',
    avatarColor: 'bg-blue-600',
    isActive: true,
    permissions: { ...defaultPermissionsByRole.sales },
  });

  const [formError, setFormError] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  // Delete Confirmation Dialog
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  const loadData = () => {
    setUsers(getUsers());
    setCurrentUser(getCurrentUser());
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (text: string, isError = false) => {
    setFeedbackNotice({ text, isError });
    setTimeout(() => {
      setFeedbackNotice(null);
    }, 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      role: 'sales',
      password: '',
      phone: '',
      email: '',
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      isActive: true,
      permissions: { ...defaultPermissionsByRole.sales },
    });
    setFormError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      password: user.password || '',
      phone: user.phone || '',
      email: user.email || '',
      avatarColor: user.avatarColor || 'bg-blue-600',
      isActive: user.isActive,
      permissions: { ...user.permissions },
    });
    setFormError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    // When changing role, preload default permissions for that role
    const newPerms = defaultPermissionsByRole[newRole] || defaultPermissionsByRole.sales;
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: { ...newPerms },
    }));
  };

  const handlePermissionToggle = (permKey: keyof UserPermissions) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey],
      },
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const res = saveUser({
      id: editingUser ? editingUser.id : undefined,
      username: formData.username,
      name: formData.name,
      role: formData.role,
      password: formData.password,
      phone: formData.phone,
      email: formData.email,
      avatarColor: formData.avatarColor,
      isActive: formData.isActive,
      permissions: formData.permissions,
    });

    if (res.success) {
      setIsModalOpen(false);
      loadData();
      showNotification(res.message);
    } else {
      setFormError(res.message);
    }
  };

  const handleToggleStatus = (user: UserAccount) => {
    const res = toggleUserStatus(user.id);
    if (res.success) {
      loadData();
      showNotification(res.message);
    } else {
      showNotification(res.message, true);
    }
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    const res = deleteUser(userToDelete.id);
    setUserToDelete(null);
    if (res.success) {
      loadData();
      showNotification(res.message);
    } else {
      showNotification(res.message, true);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term));

    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive);

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>إدارة صلاحيات الوصول والأمان</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            حسابات المستخدمين والصلاحيات
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            يمكنك إنشاء حسابات متعددة لموظفيك (مدراء، محاسبين، مسؤولي مبيعات، وأمناء مستودعات) مع تخصيص الصلاحيات وحفظها سحابياً في Google Cloud Firestore.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>إنشاء حساب جديد</span>
        </button>
      </div>

      {/* Floating Notification */}
      {feedbackNotice && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            feedbackNotice.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackNotice.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedbackNotice.text}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>إجمالي الحسابات</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{users.length}</p>
          <span className="text-[10px] text-slate-400">حسابات مسجلة بالنظام</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>الحسابات النشطة</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {users.filter(u => u.isActive).length}
          </p>
          <span className="text-[10px] text-emerald-600/80">قيد الاستخدام حالياً</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>المدراء (Admins)</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">
            {users.filter(u => u.role === 'admin').length}
          </p>
          <span className="text-[10px] text-purple-600/80">صلاحية وصول كاملة</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>الموظفين والفرق</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            {users.filter(u => u.role !== 'admin').length}
          </p>
          <span className="text-[10px] text-amber-600/80">مبيعات، حسابات، مستودع</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، اسم المستخدم، رقم الهاتف، أو البريد الإلكتروني..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">كافة الأدوار</option>
            <option value="admin">مدير النظام (Admin)</option>
            <option value="accountant">محاسب</option>
            <option value="sales">مسؤول مبيعات</option>
            <option value="inventory">أمين مستودع</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">كافة الحالات</option>
            <option value="active">الحسابات النشطة فقط</option>
            <option value="inactive">الحسابات المعطلة فقط</option>
          </select>
        </div>
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const roleConf = ROLE_CONFIG[user.role] || ROLE_CONFIG.sales;
          const isMe = currentUser?.id === user.id;

          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                !user.isActive
                  ? 'border-slate-200 bg-slate-50/70 opacity-75'
                  : isMe
                  ? 'border-blue-300 ring-1 ring-blue-400 shadow-xs'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Top */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 ${
                        user.avatarColor || 'bg-blue-600'
                      }`}
                    >
                      {user.name.substring(0, 2)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{user.name}</h3>
                        {isMe && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                            حسابك الحالي
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <span>@{user.username}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 border ${
                      roleConf.bg
                    } ${roleConf.color} ${roleConf.border}`}
                  >
                    {roleConf.label}
                  </span>
                </div>

                {/* Status and Info */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">حالة الحساب:</span>
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>نشط ومفعل</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>معطل من الإدارة</span>
                      </span>
                    )}
                  </div>

                  {user.phone && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 text-[11px]">الهاتف:</span>
                      <span className="font-mono text-slate-700 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {user.phone}
                      </span>
                    </div>
                  )}

                  {user.email && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 text-[11px]">البريد:</span>
                      <span className="text-slate-700 truncate max-w-[180px] font-mono flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {user.email}
                      </span>
                    </div>
                  )}

                  {user.lastLoginAt && (
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>آخر تسجيل دخول:</span>
                      <span className="font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(user.lastLoginAt).toLocaleDateString('ar-EG', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Permissions Tags */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    الصلاحيات الممنوحة:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {user.permissions.canManageProducts && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                        المنتجات
                      </span>
                    )}
                    {user.permissions.canManageInvoices && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                        الفواتير
                      </span>
                    )}
                    {user.permissions.canManageCustomers && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                        العملاء
                      </span>
                    )}
                    {user.permissions.canManageSuppliers && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                        الموردين
                      </span>
                    )}
                    {user.permissions.canManageInventory && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                        المخزون
                      </span>
                    )}
                    {user.permissions.canViewReports && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                        التقارير
                      </span>
                    )}
                    {user.permissions.canManageSettings && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                        الإعدادات
                      </span>
                    )}
                    {user.permissions.canManageUsers && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded text-[10px]">
                        المستخدمين
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleStatus(user)}
                  disabled={isMe && user.isActive}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    user.isActive
                      ? 'text-amber-700 hover:bg-amber-100/60'
                      : 'text-emerald-700 hover:bg-emerald-100/60'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  title={user.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                >
                  {user.isActive ? 'تعطيل' : 'تفعيل'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="تعديل الحساب والصلاحيات"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setUserToDelete(user)}
                    disabled={isMe}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isMe ? 'لا يمكنك حذف حسابك الحالي' : 'حذف الحساب'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">لا توجد حسابات مطابقة لمعايير البحث</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            جرب تغيير كلمات البحث أو المرشحات، أو قم بإنشاء حساب جديد بالضغط على زر "إنشاء حساب جديد" أعلاه.
          </p>
        </div>
      )}

      {/* Modal: Create or Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingUser ? `تعديل حساب: ${editingUser.name}` : 'إنشاء حساب موظف / مستخدم جديد'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingUser
                      ? 'قم بتحديث بيانات الحساب أو الصلاحيات المرتبطة به'
                      : 'أدخل البيانات الأساسية وحدد الدور الوظيفي والصلاحيات الممنوحة'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="m-6 mb-0 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 text-xs">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    الاسم الكامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: أحمد عبد الله"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    اسم المستخدم للدخول (Username) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    placeholder="مثال: ahmed"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    كلمة المرور {editingUser && <span className="text-slate-400 font-normal">(اتركها فارغة للاحتفاظ بالحالية)</span>}
                    {!editingUser && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••"
                      className="w-full pr-3 pl-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف للتواصل</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0599000000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="employee@system.local"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block font-bold text-slate-800">
                  الدور الوظيفي الرئيسي <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(ROLE_CONFIG) as UserRole[]).map(rKey => {
                    const conf = ROLE_CONFIG[rKey];
                    const isSelected = formData.role === rKey;

                    return (
                      <button
                        key={rKey}
                        type="button"
                        onClick={() => handleRoleChange(rKey)}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? `${conf.bg} ${conf.border} ring-2 ring-blue-500 shadow-xs`
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${conf.color}`}>{conf.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">{conf.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    تخصيص الصلاحيات الدقيقة لهذا الحساب:
                  </label>
                  <span className="text-[10px] text-slate-400">تم التعيين تلقائياً حسب الدور ويمكن تعديلها</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {(Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>).map(pKey => {
                    const isChecked = !!formData.permissions[pKey];

                    return (
                      <label
                        key={pKey}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handlePermissionToggle(pKey)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-slate-700 text-xs font-medium">
                          {PERMISSION_LABELS[pKey]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700 text-xs">لون الشعار:</span>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarColor: c })}
                      className={`w-6 h-6 rounded-full ${c} transition-transform ${
                        formData.avatarColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Active Switch */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-slate-700 cursor-pointer">
                  حساب نشط ومتاح لتسجيل الدخول فوراً
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors cursor-pointer"
                >
                  {editingUser ? 'حفظ التعديلات' : 'إنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                تأكيد حذف حساب "{userToDelete.name}"؟
              </h3>
              <p className="text-xs text-slate-500">
                اسم المستخدم: <strong className="font-mono text-slate-800">@{userToDelete.username}</strong>
                <br />
                هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً من النظام وقاعدة البيانات؟
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                نعم، احذف الحساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
