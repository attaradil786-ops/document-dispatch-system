import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storageService';
import { DocumentItem } from '../types';
import { FileCheck, Eye, ArrowUpRight } from 'lucide-react';
import { DocumentDetailModal } from '../components/DocumentDetailModal';

export const OutboxPage: React.FC = () => {
  const { isMainDept, departmentId } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    return storageService.subscribe(() => {
      setRefresh((prev) => prev + 1);
    });
  }, []);

  const allUserDocs = storageService.getDocumentsForUser(departmentId, isMainDept);

  // Outbox = items sent BY this department
  const outboxDocs = allUserDocs.filter((d) => d.sender_dept_id === departmentId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 to-slate-900 p-6 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <FileCheck className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Sent Dispatches (Outbox)</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Documents uploaded and dispatched by your department.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Outbound Dispatches ({outboxDocs.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {outboxDocs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No sent dispatches recorded.
            </div>
          ) : (
            outboxDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0 mt-0.5">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {doc.doc_number}
                      </span>
                      {doc.sub_criteria && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                          Criteria {doc.sub_criteria}
                        </span>
                      )}
                      {doc.is_personal_hq_dispatch && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800">
                          ⚡ Personal HQ Dispatch
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {doc.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {doc.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      {doc.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Target Recipient: <span className="font-semibold text-slate-700 dark:text-slate-300">{doc.recipient_dept_names.join(', ')}</span> • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Details</span>
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
