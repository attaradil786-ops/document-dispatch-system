import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Export array of objects to CSV download
export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header] === undefined || row[header] === null ? '' : String(row[header]);
          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export array of objects to Excel-compatible CSV download
export function exportToExcel(filename: string, rows: Record<string, any>[]) {
  exportToCSV(`${filename}_excel`, rows);
}

// Generate PDF Report using jsPDF
export function exportTableToPDF(
  title: string,
  headers: string[],
  data: (string | number)[][],
  filename: string,
  departmentName?: string
) {
  const doc = new jsPDF();

  // Header background
  doc.setFillColor(30, 58, 138); // Dark University Blue (#1e3a8a)
  doc.rect(0, 0, 210, 28, 'F');

  // University Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTITUTE OF TECHNOLOGY & SCIENCE', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Department Management Information System (MIS)`, 14, 18);

  if (departmentName) {
    doc.setFontSize(9);
    doc.text(`Department: ${departmentName}`, 14, 24);
  }

  // Report Title & Date
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 44);

  // AutoTable
  autoTable(doc, {
    startY: 48,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 48, left: 14, right: 14 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} - Confidential College Document`, 105, 290, { align: 'center' });
  }

  doc.save(`${filename}.pdf`);
}

// Generate Student Result Card PDF
export function generateResultCardPDF(studentName: string, rollNo: string, deptName: string, semester: number, markRecords: any[]) {
  const doc = new jsPDF();

  // College Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL ACADEMIC TRANSCRIPT', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('COLLEGE DEPARTMENT MIS - STATEMENT OF MARKS', 14, 24);

  // Student Meta Table Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 38, 182, 34, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Student Name: `, 20, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(studentName, 55, 48);

  doc.setFont('helvetica', 'bold');
  doc.text(`Roll Number: `, 20, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(rollNo, 55, 56);

  doc.setFont('helvetica', 'bold');
  doc.text(`Department: `, 110, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(deptName, 140, 48);

  doc.setFont('helvetica', 'bold');
  doc.text(`Semester: `, 110, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(`Semester ${semester}`, 140, 56);

  // Table Data
  const headers = ['Subject Code', 'Subject Name', 'Internal (20)', 'Practical (20)', 'Mid Sem (30)', 'End Sem (100)', 'Total (170)', 'Grade', 'GPA'];
  const body = markRecords.map((m) => [
    m.subject_code || m.subject_id || 'CS501',
    m.subject_name,
    m.internal,
    m.practical,
    m.mid_sem,
    m.end_sem,
    m.total_marks,
    m.grade,
    m.gpa,
  ]);

  autoTable(doc, {
    startY: 78,
    head: [headers],
    body: body,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
  });

  // Calculate SGPA
  const avgGpa = markRecords.length > 0 ? (markRecords.reduce((acc, m) => acc + (m.gpa || 0), 0) / markRecords.length).toFixed(2) : 'N/A';

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  doc.setDrawColor(30, 58, 138);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, finalY, 182, 22, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`SEMESTER GRADE POINT AVERAGE (SGPA): ${avgGpa} / 10.0`, 20, finalY + 14);

  // Signatures
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('_______________________', 20, finalY + 45);
  doc.text('Head of Department', 20, finalY + 52);

  doc.text('_______________________', 130, finalY + 45);
  doc.text('Controller of Examinations', 130, finalY + 52);

  doc.save(`${rollNo}_Semester_${semester}_Result_Card.pdf`);
}

// Generate Fee Receipt PDF
export function generateFeeReceiptPDF(feeRecord: any, departmentName: string) {
  const doc = new jsPDF();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL FEE PAYMENT RECEIPT', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('INSTITUTE OF TECHNOLOGY & SCIENCE - BURSAR OFFICE', 14, 22);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 85, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);

  const addLine = (label: string, value: string, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, y);
  };

  addLine('Receipt ID:', feeRecord.id, 48);
  addLine('Transaction Reference:', feeRecord.transaction_id || 'N/A', 56);
  addLine('Student Name:', feeRecord.student_name, 64);
  addLine('Roll Number:', feeRecord.roll_number, 72);
  addLine('Department:', departmentName, 80);
  addLine('Fee Category:', feeRecord.fee_type, 88);
  addLine('Amount Paid:', `$${feeRecord.amount}.00`, 96);
  addLine('Payment Status:', feeRecord.status, 104);
  addLine('Payment Date:', feeRecord.paid_date || new Date().toLocaleDateString(), 112);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer generated payment receipt. No signature required.', 14, 135);

  doc.save(`Fee_Receipt_${feeRecord.roll_number}_${feeRecord.fee_type}.pdf`);
}
