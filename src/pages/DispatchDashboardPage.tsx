import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storageService';
import { DocumentItem, DocumentCategory, DocumentPriority, DocumentStatus } from '../types';
import { getSubCriteriaForDepartment } from '../utils/subCriteria';
import {
  FileText,
  Send,
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Building2,
  ShieldCheck,
  ChevronRight,
  Eye,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { DocumentDetailModal } from '../components/DocumentDetailModal';
import { SubCriteriaMonitor } from '../components/SubCriteriaMonitor';

interface DispatchDashboardPageProps {
  onNavigateUpload: () => void;
}

export const DispatchDashboardPage: React.FC<DispatchDashboardPageProps> = ({
  onNavigateUpload,
}) => {
  const { user, isMainDept, departmentId, departmentName } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    return storageService.subscribe(() => {
      setRefreshTrigger((prev) => prev + 1);
    });
  }, []);

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSubCriteria, setSelectedSubCriteria] = useState<string>('all');

  const userDocs = storageService.getDocumentsForUser(departmentId, isMainDept);
  const stats = storageService.getDispatchStats(departmentId, isMainDept);

  const allowedSubCriteria = getSubCriteriaForDepartment(departmentId, isMainDept);

  // Filter logic
  const filteredDocs = userDocs.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.doc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sender_dept_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.sub_criteria && doc.sub_criteria.includes(searchQuery));

    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || doc.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    const matchesSubCriteria =
      selectedSubCriteria === 'all' ||
      (doc.sub_criteria &&
        doc.sub_criteria
          .split(',')
          .map((s) => s.trim())
          .includes(selectedSubCriteria));

    return (
      matchesSearch &&
      matchesCategory &&
      matchesPriority &&
      matchesStatus &&
      matchesSubCriteria
    );
  });

  const getPriorityBadge = (p: DocumentPriority) => {
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

  return (
    <div className="space-y-6">
      {/* Top Banner Context Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-extrabold text-blue-300 border border-blue-400/30 uppercase tracking-wider">
              {isMainDept ? 'Central Main Dept Oversight' : `${departmentName}`}
            </span>
            <span className="text-xs text-slate-400">
              {isMainDept ? '⚡ Multi-Dept Broadcast & Oversight' : '🔒 Work dispatches routed to Main Dept'}
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            Department Document Dispatch Center
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Real-time inter-department work uploads, official dispatches, and status verification.
          </p>
        </div>

        <button
          onClick={onNavigateUpload}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Upload & Dispatch Work</span>
        </button>
      </section>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Dispatches</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalDispatched}
            </h3>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Accessible under RLS token</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Received Items</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.receivedCount}
            </h3>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Targeted or broadcasted</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Inbox className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Review</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {stats.pendingCount}
            </h3>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting processing</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved & Resolved</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.approvedCount}
            </h3>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Official approval closed</span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Sub-Criteria Received Monitor & Compliance Matrix (Strictly Central HQ Access Only) */}
      {isMainDept && (
        <SubCriteriaMonitor
          documents={userDocs}
          selectedSubCriteria={selectedSubCriteria}
          onSelectSubCriteria={(code) => setSelectedSubCriteria(code)}
          isMainDept={isMainDept}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, doc number, or department..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedSubCriteria}
              onChange={(e) => setSelectedSubCriteria(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">
                {isMainDept ? 'All Sub-Criteria (1.1 - 7.5)' : 'All Dept Sub-Criteria'}
              </option>
              {allowedSubCriteria.map((sc) => (
                <option key={sc.code} value={sc.code}>
                  Criteria {sc.code} - {sc.title}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Work Report">Work Report</option>
              <option value="Audit & Finance">Audit & Finance</option>
              <option value="Policy & Circular">Policy & Circular</option>
              <option value="Project Request">Project Request</option>
              <option value="HR & Staffing">HR & Staffing</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Confidential">Confidential</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Under Review">Under Review</option>
              <option value="Action Taken">Action Taken</option>
              <option value="Approved">Approved</option>
              <option value="Revision Requested">Revision Requested</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dispatches Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Inter-Department Document Registry ({filteredDocs.length})
            </h3>
            <p className="text-xs text-slate-500">
              {isMainDept
                ? 'Showing all institutional dispatches'
                : `Showing dispatches involved with ${departmentName}`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Ref Number & Title</th>
                <th className="py-3.5 px-4">Sub-Criteria</th>
                <th className="py-3.5 px-4">Sender Dept</th>
                <th className="py-3.5 px-4">Recipient Target</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching documents found in registry.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isOutgoing = doc.sender_dept_id === departmentId;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {isOutgoing ? (
                            <ArrowUpRight className="h-4 w-4 text-blue-600 shrink-0" title="Outgoing Work Dispatch" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4 text-emerald-600 shrink-0" title="Incoming Dispatch" />
                          )}
                          <div>
                            <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 block">
                              {doc.doc_number}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {doc.title}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {doc.sub_criteria && (
                            doc.sub_criteria.split(',').map((codeStr) => {
                              const code = codeStr.trim();
                              if (!code) return null;
                              const isSelectedCode = selectedSubCriteria === code;
                              return (
                                <button
                                  key={code}
                                  type="button"
                                  onClick={() => setSelectedSubCriteria(isSelectedCode ? 'all' : code)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border transition-all cursor-pointer ${
                                    isSelectedCode
                                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-1 ring-purple-400'
                                      : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900 hover:bg-purple-100 dark:hover:bg-purple-900'
                                  }`}
                                  title={`Filter by Criteria ${code}`}
                                >
                                  Criteria {code}
                                </button>
                              );
                            })
                          )}
                          {doc.is_personal_hq_dispatch && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800">
                              ⚡ Personal HQ
                            </span>
                          )}
                          {!doc.sub_criteria && !doc.is_personal_hq_dispatch && (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {doc.sender_dept_name}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {doc.recipient_dept_names.join(', ')}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400">
                        {doc.category}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(
                            doc.priority
                          )}`}
                        >
                          {doc.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            doc.status
                          )}`}
                        >
                          {doc.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Details Modal */}
      {selectedDoc && (
        <DocumentDetailModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={() => setRefreshTrigger((prev) => prev + 1)}
        />
      )}
    </div>
  );
};
