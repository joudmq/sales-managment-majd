import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportInvoiceToPdf(elementId: string, invoiceNumber: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Invoice print element not found');
    return false;
  }

  try {
    // Render target element to canvas with high resolution
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
    pdf.save(`فاتورة_${invoiceNumber}.pdf`);
    return true;
  } catch (error) {
    console.error('Failed to export PDF:', error);
    // Fallback to native print to PDF
    window.print();
    return false;
  }
}
