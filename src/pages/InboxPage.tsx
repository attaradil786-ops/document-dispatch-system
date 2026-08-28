import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storageService';
import { DocumentItem } from '../types';
import { Inbox, Eye, ArrowDownLeft, FileText, Filter, X } from 'lucide-react';
import { DocumentDetailModal } from '../components/DocumentDetailModal';
import { SubCriteriaMonitor } from '../components/SubCriteriaMonitor';

export const InboxPage: React.FC = () => {
  const { isMainDept, departmentId, departmentName } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [selectedSubCriteriaFilter, setSelectedSubCriteriaFilter] = useState<string>('all');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    return storageService.subscribe(() => {
      setRefresh((prev) => prev + 1);
    });
  }, []);

  const allUserDocs = storageService.getDocumentsForUser(departmentId, isMainDept);

  // Inbox items = items received by this department
  const inboxDocs = allUserDocs.filter(
    (d) =>
      d.recipient_dept_ids.includes(departmentId) ||
      (d.is_sent_to_all && !isMainDept) ||
      (isMainDept && d.sender_dept_id !== 'main-dept')
  );

  const filteredInboxDocs = inboxDocs.filter((d) => {
    if (selectedSubCriteriaFilter === 'all') return true;
    if (!d.sub_criteria) return false;
    const codes = d.sub_criteria.split(',').map((s) => s.trim());
    return codes.includes(selectedSubCriteriaFilter);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <Inbox className="h-6 w-6 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Received Dispatches (Inbox)</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              Documents and directives received by {isMainDept ? 'Main Department' : departmentName}.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Criteria Received Monitor (Strictly Central HQ Access Only) */}
      {isMainDept && (
        <SubCriteriaMonitor
          documents={inboxDocs}
          selectedSubCriteria={selectedSubCriteriaFilter}
          onSelectSubCriteria={(code) => setSelectedSubCriteriaFilter(code)}
          isMainDept={isMainDept}
        />
      )}

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Incoming Documents ({filteredInboxDocs.length})
          </h3>
          {selectedSubCriteriaFilter !== 'all' && (
            <button
              onClick={() => setSelectedSubCriteriaFilter('all')}
              className="text-xs font-bold text-purple-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              <span>Clear Filter ({selectedSubCriteriaFilter})</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredInboxDocs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No received documents matching {selectedSubCriteriaFilter !== 'all' ? `Criteria ${selectedSubCriteriaFilter}` : 'your inbox'}.
            </div>
          ) : (
            filteredInboxDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 shrink-0 mt-0.5">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {doc.doc_number}
                      </span>
                      {doc.sub_criteria &&
                        doc.sub_criteria.split(',').map((codeStr) => {
                          const code = codeStr.trim();
                          if (!code) return null;
                          const isSel = selectedSubCriteriaFilter === code;
                          return (
                            <button
                              key={code}
                              onClick={() => setSelectedSubCriteriaFilter(isSel ? 'all' : code)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold cursor-pointer border transition-all ${
                                isSel
                                  ? 'bg-purple-600 text-white border-purple-600 ring-1 ring-purple-400'
                                  : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900 hover:bg-blue-200'
                              }`}
                              title={`Filter Inbox by Criteria ${code}`}
                            >
                              Criteria {code}
                            </button>
                          );
                        })}
                      {doc.is_personal_hq_dispatch && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800">
                          ⚡ Personal HQ Dispatch
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {doc.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                        {doc.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      {doc.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      From: <span className="font-semibold text-slate-700 dark:text-slate-300">{doc.sender_dept_name}</span> ({doc.sender_user_name}) • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Review</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedDoc && (
        <DocumentDetailModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={() => setRefresh((p) => p + 1)}
        />
      )}
    </div>
  );
};
