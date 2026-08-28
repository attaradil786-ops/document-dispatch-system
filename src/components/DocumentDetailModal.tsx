import React, { useState } from 'react';
import { DocumentItem, DocumentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storageService';
import {
  X,
  FileText,
  Clock,
  User,
  Building2,
  Send,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  FileCheck,
  Tag,
  AlertTriangle,
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

  if (!doc) return null;

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

  // Determine if user can update document status:
  // Main Department can always update status, or if recipient includes user's department
  const canChangeStatus =
    isMainDept || doc.recipient_dept_ids.includes(user?.department_id || '');

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
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 tracking-wider">
                  {doc.doc_number}
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
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
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
                {doc.description}
              </p>
            </div>

            {/* Attached File Card */}
            <div className="rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black text-xs border border-blue-200 dark:border-blue-800">
                    {doc.file_type}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs">
                      {doc.file_name}
                    </p>
                    <p className="text-[11px] text-slate-500">{doc.file_size} • Verified Document Payload</p>
                  </div>
                </div>

                {doc.file_data_url ? (
                  <a
                    href={doc.file_data_url}
                    download={doc.file_name}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                ) : (
                  <button
                    onClick={() => alert(`Simulated downloading payload: ${doc.file_name}`)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download File
                  </button>
                )}
              </div>
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
                    className="text-xs font-semibold text-blue-600 hover:underline"
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
                          className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
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
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-colors"
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
                {doc.history.map((h) => (
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
                  {doc.recipient_dept_names.map((name, idx) => (
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
                Inter-Department Remarks ({doc.comments.length})
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {doc.comments.map((c) => (
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
                    className="rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-700 transition-colors"
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
