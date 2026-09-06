import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { getSettings, saveSettings, exportBackupJSON, importBackupJSON, resetToDemoData, clearAllData } from '../lib/storage';
import {
  Settings,
  Save,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Building,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  Cloud,
  Database,
  Users,
  ArrowLeft,
} from 'lucide-react';

interface SettingsPageProps {
  onDataReset: () => void;
  onNavigateToUsers?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onDataReset, onNavigateToUsers }) => {
  const [settings, setSettingsState] = useState<AppSettings>(getSettings());
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setSettingsState(getSettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    setNotification({ type: 'success', text: 'تم حفظ الإعدادات بنجاح.' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-medical-sales-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification({ type: 'success', text: 'تم تنزيل النسخة الاحتياطية بنجاح.' });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = importBackupJSON(content);
      if (res.success) {
        setNotification({ type: 'success', text: res.message });
        setSettingsState(getSettings());
        onDataReset();
      } else {
        setNotification({ type: 'error', text: res.message });
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (
      window.confirm(
        'هل أنت متأكد من رغبتك في إعادة ضبط النظام إلى البيانات التجريبية الأولية؟\nسيتم استرجاع المنتجات والعملاء الافتراضيين مع سيناريو الفحص.'
      )
    ) {
      resetToDemoData();
      setSettingsState(getSettings());
      onDataReset();
      setNotification({ type: 'success', text: 'تمت استعادة البيانات التجريبية بنجاح.' });
    }
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        'هل أنت متأكد من رغبتك في حذف وتفريغ كافة البيانات (المنتجات، الفواتير، العملاء، الموردين، حركات المخزون، والدفعات)؟\nسيتم مسحها سحابياً من Firebase Firestore ومحلياً للبدء بنظام فارغ تماماً لإدخال بياناتك الخاصة.'
      )
    ) {
      clearAllData();
      setSettingsState(getSettings());
      onDataReset();
      setNotification({ type: 'success', text: 'تم تفريغ وحذف كافة البيانات بنجاح، النظام الآن فارغ وجاهز لإدخال بياناتك الخاصة.' });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <span>إعدادات النظام والفواتير</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          تخصيص ترويسة الفاتورة المطبوعة، معلومات الاتصال، وقواعد ترقيم الفواتير وإدارة النسخ الاحتياطية.
        </p>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span className="font-semibold">{notification.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business & Invoice Header Info */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>بيانات المنشأة وترويسة الفاتورة المطبوعة</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم المنشأة / النشاط التجاري *</label>
              <input
                type="text"
                required
                value={settings.businessName}
                onChange={e => setSettingsState({ ...settings, businessName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف للتواصل *</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={e => setSettingsState({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left focus:outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={settings.email}
                onChange={e => setSettingsState({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-left focus:outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">العنوان / المقر</label>
              <input
                type="text"
                value={settings.address}
                onChange={e => setSettingsState({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">نص ترويسة الفاتورة (Header Text)</label>
              <input
                type="text"
                value={settings.invoiceHeader}
                onChange={e => setSettingsState({ ...settings, invoiceHeader: e.target.value })}
                placeholder="مثال: مستحضرات طبية وتجميلية معتمدة"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">شروط وملاحظات أسفل الفاتورة (Footer / Terms)</label>
              <textarea
                rows={2}
                value={settings.invoiceFooter}
                onChange={e => setSettingsState({ ...settings, invoiceFooter: e.target.value })}
                placeholder="مثال: البضاعة المباعة لا ترد ولا تستبدل بعد 7 أيام..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Currency & Invoice Numbering & Stock Rules */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Coins className="w-4 h-4 text-blue-600" />
            <span>العملة والترقيم وضوابط البيع</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Currency (Locked) */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="block font-bold text-slate-700 mb-1">العملة المعتمدة في النظام</label>
              <div className="font-mono text-base font-bold text-blue-600 flex items-center gap-2 py-1">
                <span>₪</span>
                <span>شيكل إسرائيلي (ILS)</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                * كافة الحسابات والأسعار والفواتير معتمدة حصرياً بعملة الشيكل ₪.
              </span>
            </div>

            {/* Prefix */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">بادئة ترقيم الفواتير (Prefix)</label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={e => setSettingsState({ ...settings, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
              />
              <span className="text-[10px] text-slate-400 block mt-1">مثال: INV-</span>
            </div>

            {/* Next number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الفاتورة القادمة</label>
              <input
                type="number"
                min="1"
                value={settings.nextInvoiceNumber}
                onChange={e =>
                  setSettingsState({
                    ...settings,
                    nextInvoiceNumber: Math.max(1, parseInt(e.target.value, 10) || 1),
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center"
              />
              <span className="text-[10px] text-slate-400 block mt-1">يزداد تلقائياً مع كل فاتورة جديدة.</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-3 text-xs">
            <input
              type="checkbox"
              id="allowOutOfStock"
              checked={settings.allowSellingOutOfStock}
              onChange={e =>
                setSettingsState({ ...settings, allowSellingOutOfStock: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded border-slate-300"
            />
            <label htmlFor="allowOutOfStock" className="font-semibold text-slate-700 cursor-pointer">
              السماح بالبيع حتى لو كان المخزون غير كافٍ (قد يؤدي إلى رصيد مخزون سالب)
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>حفظ كافة الإعدادات</span>
          </button>
        </div>
      </form>

      {/* Cloud Firestore Persistence Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>قاعدة بيانات Google Cloud Firestore</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  نشطة ومحفوظة دائمًا
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                كافة المنتجات، الفواتير، العملاء، الموردين، الدفعات، وسجل حركة المخزون يتم حفظها ومزامنتها لحظياً في السحابة.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 font-mono">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>europe-west2 / Firestore</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-[11px]">مجموعة المنتجات</div>
            <div className="font-mono text-emerald-400 font-semibold mt-1">products</div>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-[11px]">مجموعة الفواتير</div>
            <div className="font-mono text-emerald-400 font-semibold mt-1">invoices</div>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-[11px]">حركات المخزون</div>
            <div className="font-mono text-emerald-400 font-semibold mt-1">stock_movements</div>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400 text-[11px]">العملاء والموردين</div>
            <div className="font-mono text-emerald-400 font-semibold mt-1">customers / suppliers</div>
          </div>
        </div>
      </div>

      {/* Multi-user Accounts & Roles Quick Access */}
      {onNavigateToUsers && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">إدارة حسابات المستخدمين وصلاحيات الموظفين</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إضافة وتعديل حسابات المدراء والمحاسبين ومسؤولي المبيعات مع تعيين كلمات المرور وتخصيص الصلاحيات.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToUsers}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <span>فتح إدارة المستخدمين</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Backup and Restore Section */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>النسخ الاحتياطي وإدارة البيانات (Backup & Restore)</span>
        </h2>

        <p className="text-xs text-slate-500">
          يمكنك تنزيل نسخة احتياطية كاملة لكافة بيانات النظام (المنتجات، الفواتير، العملاء، الموردين، والدفعات) بصيغة ملف JSON واستعادتها في أي وقت.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>تصدير نسخة احتياطية (JSON)</span>
          </button>

          <label className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>استعادة نسخة احتياطية من ملف</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          <button
            onClick={handleClearAllData}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>تفريغ وحذف كافة البيانات للبدء من الصفر</span>
          </button>

          <button
            onClick={handleResetDemo}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold rounded-xl flex items-center gap-2 transition-colors mr-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>استعادة بيانات تجريبية (Demo Data)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
