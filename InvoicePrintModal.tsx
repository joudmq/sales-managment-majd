import React, { useState } from 'react';
import { Invoice, AppSettings } from '../types';
import { InvoicePrintTemplate } from './InvoicePrintTemplate';
import { exportInvoiceToPdf } from '../lib/pdf';
import { Printer, FileDown, X, Check, Loader2 } from 'lucide-react';

interface InvoicePrintModalProps {
  invoice: Invoice;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  settings,
  isOpen,
  onClose,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    setIsExportingPdf(true);
    setPdfSuccess(false);
    try {
      const success = await exportInvoiceToPdf('printable-invoice-modal', invoice.invoiceNumber);
      if (success) {
        setPdfSuccess(true);
        setTimeout(() => setPdfSuccess(false), 3000);
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-100 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Action Bar (Hidden during window.print) */}
        <div className="no-print bg-white px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-slate-800">
              معاينة الفاتورة: <span className="text-blue-600 font-mono">{invoice.invoiceNumber}</span>
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
              نسخة العميل المعتمدة (بدون بيانات الأرباح)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة</span>
            </button>

            <button
              onClick={handleSavePdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors shadow-md"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تصدير PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>تم حفظ PDF!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>حفظ PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 flex justify-center bg-slate-200/60">
          <InvoicePrintTemplate
            invoice={invoice}
            settings={settings}
            elementId="printable-invoice-modal"
          />
        </div>
      </div>
    </div>
  );
};
