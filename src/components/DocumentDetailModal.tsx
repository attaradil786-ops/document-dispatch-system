import React, { useState, useMemo } from 'react';
import { DocumentItem, DocumentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { storageService, API_BASE } from '../services/storageService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  X,
  FileText,
  Clock,
  User,
  Building2,
  Send,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  MessageSquare,
  FileCheck,
  Tag,
  Eye,
  EyeOff,
  Maximize2,
} from 'lucide-react';

interface DocumentDetailModalProps {
  document: DocumentItem | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document: doc,
  onClose,
  onUpdate,
}) => {
  const { user, isMainDept } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | ''>('');
  const [statusRemark, setStatusRemark] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showInlinePreview, setShowInlinePreview] = useState(false);

  // Helper to convert base64 data URL to a safe Blob URL
  const getBlobUrlFromDataUrl = (dataUrl: string): string => {
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Error creating blob from data url:', e);
      return dataUrl;
    }
  };

  // Helper to generate official dispatch record PDF on the fly
  const generateOfficialPdfBlob = (d: DocumentItem): Blob => {
    const pdf = new jsPDF();

    // Header bar
    pdf.setFillColor(30, 58, 138); // blue-900
    pdf.rect(0, 0, 210, 32, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INTER-DEPARTMENT DOCUMENT DISPATCH SYSTEM', 14, 14);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Official Institutional Dispatch Record & Verification Sheet', 14, 23);

    // Document Title
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text(d.title || 'Untitled Document', 14, 44);

    autoTable(pdf, {
      startY: 50,
      head: [['Metadata Field', 'Official Record Details']],
      body: [
        ['Document Reference Number', d.doc_number || d.reference_number || 'N/A'],
        ['Sub-Criteria Classification', d.sub_criteria ? `Criteria ${d.sub_criteria}` : 'General'],
        ['Sender Department', `${d.sender_dept_name} (${d.sender_user_name})`],
        [
          'Target Recipient(s)',
          Array.isArray(d.recipient_dept_names) && d.recipient_dept_names.length > 0
            ? d.recipient_dept_names.join(', ')
            : 'Main Department (Central HQ & Registry)',
        ],
        ['Priority & Category', `${d.priority} Priority • ${d.category}`],
        ['Current Processing Status', d.status || 'Dispatched'],
        ['Dispatched Date & Time', new Date(d.created_at).toLocaleString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 9 },
    });

    const lastY = (pdf as any).lastAutoTable?.finalY || 120;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Document Summary & Official Intent:', 14, lastY + 10);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const splitDescription = pdf.splitTextToSize(
      d.description || 'No additional summary text provided.',
      180
    );
    pdf.text(splitDescription, 14, lastY + 18);

    if (d.personal_dispatch_note) {
      const noteY = lastY + 18 + splitDescription.length * 6 + 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(109, 40, 217);
      pdf.text('⚡ Personal HQ Directive / Sub-Criteria Instructions:', 14, noteY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      const splitNote = pdf.splitTextToSize(d.personal_dispatch_note, 180);
      pdf.text(splitNote, 14, noteY + 8);
    }

    return pdf.output('blob');
  };

  // Safe file preview URL resolution
  const resolvedFileUrl = useMemo(() => {
    if (!doc) return '';
    if (doc.file_url) {
      return doc.file_url.startsWith('http')
        ? doc.file_url
        : `${API_BASE || 'http://localhost:3000'}${doc.file_url}`;
    }
    if (doc.file_data_url) {
      return getBlobUrlFromDataUrl(doc.file_data_url);
    }
    return '';
  }, [doc]);

  if (!doc) return null;

  // Open Document in New Tab
  const handleOpenFile = (e: React.MouseEvent) => {
    e.preventDefault();
    if (doc.file_url) {
      const targetUrl = doc.file_url.startsWith('http')
        ? doc.file_url
        : `${API_BASE || 'http://localhost:3000'}${doc.file_url}`;
      window.open(targetUrl, '_blank');
      return;
    }
    if (doc.file_data_url) {
      const blobUrl = getBlobUrlFromDataUrl(doc.file_data_url);
      window.open(blobUrl, '_blank');
      return;
    }

    // Text-only dispatch: generate and open official dispatch PDF
    const pdfBlob = generateOfficialPdfBlob(doc);
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  // Download Document
  const handleDownloadFile = (e: React.MouseEvent) => {
    e.preventDefault();
    const downloadName = doc.file_name || `${(doc.title || 'document').replace(/\s+/g, '_')}.pdf`;

    if (doc.file_url) {
      const targetUrl = doc.file_url.startsWith('http')
        ? doc.file_url
        : `${API_BASE || 'http://localhost:3000'}${doc.file_url}`;
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = downloadName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (doc.file_data_url) {
      const blobUrl = getBlobUrlFromDataUrl(doc.file_data_url);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Text-only dispatch: generate official PDF and download
    const pdfBlob = generateOfficialPdfBlob(doc);
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 15000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    storageService.addComment(doc.id, commentText.trim(), user);
    setCommentText('');
    onUpdate();
  };

  const handleStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus || !user) return;

    storageService.updateDocumentStatus(doc.id, selectedStatus, user, statusRemark.trim());
    setIsUpdatingStatus(false);
    setStatusRemark('');
    setSelectedStatus('');
    onUpdate();
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Urgent':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';
      case 'Confidential':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  const getStatusBadge = (s: DocumentStatus) => {
    switch (s) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200';
      case 'Action Taken':
      case 'Under Review':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
      case 'Revision Requested':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200';
    }
  };

  const isImageFile =
    doc.file_type?.toUpperCase() === 'PNG' ||
    doc.file_type?.toUpperCase() === 'JPG' ||
    doc.file_type?.toUpperCase() === 'JPEG' ||
    doc.file_type?.toUpperCase() === 'WEBP' ||
    doc.file_name?.match(/\.(png|jpg|jpeg|webp)$/i);

  const isPdfFile =
    doc.file_type?.toUpperCase() === 'PDF' || doc.file_name?.match(/\.pdf$/i) || !doc.file_type;

  const canChangeStatus =
    isMainDept || (Array.isArray(doc.recipient_dept_ids) && doc.recipient_dept_ids.includes(user?.department_id || ''));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 tracking-wider font-mono">
                  {doc.doc_number || doc.reference_number}
                </span>
                {doc.sub_criteria && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Criteria {doc.sub_criteria}
                  </span>
                )}
                {doc.is_personal_hq_dispatch && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                    ⚡ Personal HQ Dispatch
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(doc.priority)}`}>
                  {doc.priority}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(doc.status)}`}>
                  {doc.status}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {doc.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-h-[75vh] overflow-y-auto">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal HQ Directive Callout */}
            {doc.is_personal_hq_dispatch && doc.personal_dispatch_note && (
              <div className="rounded-2xl border border-purple-200 dark:border-purple-900 bg-purple-50/80 dark:bg-purple-950/40 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  Personal HQ Directive / Instructions for Sub-Criteria Coordinator
                </h4>
                <p className="text-xs font-semibold text-purple-950 dark:text-purple-100 leading-relaxed whitespace-pre-line">
                  {doc.personal_dispatch_note}
                </p>
              </div>
            )}

            {/* Description */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Document Summary & Intent
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {doc.description || 'No additional summary text provided.'}
              </p>
            </div>

            {/* Attached File Action Card */}
            <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black text-xs border border-blue-200 dark:border-blue-800">
                    {doc.file_type || 'PDF'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs">
                      {doc.file_name || `${doc.title}.pdf`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {doc.file_size || 'Verified'} • Official Document File Payload
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle Preview Button */}
                  <button
                    type="button"
                    onClick={() => setShowInlinePreview(!showInlinePreview)}
                    className="flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 shadow-xs hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {showInlinePreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{showInlinePreview ? 'Hide Preview' : 'Live Preview'}</span>
                  </button>

                  {/* Open in New Tab Button */}
                  <button
                    type="button"
                    onClick={handleOpenFile}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white px-3.5 py-2 text-xs font-bold shadow-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                    <span>Open in New Tab</span>
                  </button>

                  {/* Download File Button */}
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Inline Document Preview Box */}
              {showInlinePreview && (
                <div className="pt-3 border-t border-blue-200/60 dark:border-blue-900/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-blue-600" />
                      Document Inline Viewer
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenFile}
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Maximize2 className="h-3 w-3" /> Fullscreen Tab
                    </button>
                  </div>

                  {isImageFile && resolvedFileUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/5 flex items-center justify-center p-2">
                      <img
                        src={resolvedFileUrl}
                        alt={doc.title}
                        className="max-h-96 object-contain rounded-lg shadow-sm"
                      />
                    </div>
                  ) : resolvedFileUrl ? (
                    <iframe
                      src={resolvedFileUrl}
                      title={doc.title}
                      className="w-full h-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                    />
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="font-semibold">Official Dispatch Metadata Record</p>
                      <button
                        type="button"
                        onClick={handleOpenFile}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
                      >
                        Generate & Open Official Document PDF
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Change Status Action Box (for Authorized users) */}
            {canChangeStatus && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                    Update Dispatch Processing Status
                  </h4>
                  <button
                    onClick={() => setIsUpdatingStatus(!isUpdatingStatus)}
                    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    {isUpdatingStatus ? 'Cancel' : 'Change Status'}
                  </button>
                </div>

                {isUpdatingStatus && (
                  <form onSubmit={handleStatusChange} className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        ['Under Review', 'Action Taken', 'Approved', 'Revision Requested', 'Archived'] as DocumentStatus[]
                      ).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedStatus(st)}
                          className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                            selectedStatus === st
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={statusRemark}
                      onChange={(e) => setStatusRemark(e.target.value)}
                      placeholder="Add processing note or official instruction (optional)..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="submit"
                      disabled={!selectedStatus}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      Confirm Status Change
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* History & Audit Trail */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Dispatch Audit & Timeline History
              </h4>
              <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-800 pl-4 ml-1">
                {Array.isArray(doc.history) &&
                  doc.history.map((h) => (
                    <div key={h.id} className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900"></div>
                      <p className="font-bold text-slate-900 dark:text-white">{h.action}</p>
                      <p className="text-[10px] text-slate-500">
                        By {h.performed_by} ({h.dept_name}) • {h.timestamp}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info & Comments Column */}
          <div className="space-y-6">
            {/* Sender & Recipient Context Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sender Department</span>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {doc.sender_dept_name}
                    </p>
                    <p className="text-[10px] text-slate-500">Officer: {doc.sender_user_name}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Recipient</span>
                <div className="mt-1 space-y-1">
                  {Array.isArray(doc.recipient_dept_names) &&
                    doc.recipient_dept_names.map((name, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <Send className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{name}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Category & Date</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {doc.category}
                </p>
                <p className="text-[10px] text-slate-500">{new Date(doc.created_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Official Remarks / Comment Feed */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                Inter-Department Remarks ({Array.isArray(doc.comments) ? doc.comments.length : 0})
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {Array.isArray(doc.comments) &&
                  doc.comments.map((c) => (
                    <div key={c.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{c.author_name}</span>
                        <span className="text-[9px] text-slate-400">{c.sender_dept_name}</span>
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-300 text-[11px]">{c.message}</p>
                    </div>
                  ))}
              </div>

              <form onSubmit={handleAddComment} className="pt-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type official remark..."
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
