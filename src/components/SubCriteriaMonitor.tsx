import React, { useState } from 'react';
import { DocumentItem } from '../types';
import { ALL_SUB_CRITERIA, SubCriteriaItem } from '../utils/subCriteria';
import {
  CheckCircle2,
  FileCheck2,
  Clock,
  Filter,
  Layers,
  ChevronRight,
  Search,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface SubCriteriaMonitorProps {
  documents: DocumentItem[];
  selectedSubCriteria: string;
  onSelectSubCriteria: (code: string) => void;
  isMainDept?: boolean;
}

export const SubCriteriaMonitor: React.FC<SubCriteriaMonitorProps> = ({
  documents,
  selectedSubCriteria,
  onSelectSubCriteria,
  isMainDept = true,
}) => {
  if (!isMainDept) return null;

  const [activeCriteriaGroup, setActiveCriteriaGroup] = useState<number | 'all'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Compute received documents mapping per sub-criteria code
  const subCriteriaStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const latestDocs: Record<string, DocumentItem> = {};

    documents.forEach((doc) => {
      if (doc.sub_criteria) {
        // Handle single or multi-coded sub_criteria e.g. "1.2, 1.5, 4.3, 5.5" or "5.5"
        const codes = doc.sub_criteria.split(',').map((s) => s.trim()).filter(Boolean);
        codes.forEach((code) => {
          counts[code] = (counts[code] || 0) + 1;
          if (!latestDocs[code] || new Date(doc.created_at) > new Date(latestDocs[code].created_at)) {
            latestDocs[code] = doc;
          }
        });
      }
    });

    return { counts, latestDocs };
  }, [documents]);

  // Total unique sub-criteria that have received at least 1 document
  const totalReceivedSubCriteria = Object.keys(subCriteriaStats.counts).length;

  // Filter sub-criteria list based on active tab and search filter
  const filteredSubCriteria = ALL_SUB_CRITERIA.filter((sc) => {
    const matchesGroup =
      activeCriteriaGroup === 'all' || sc.criteriaNumber === activeCriteriaGroup;
    const matchesSearch =
      searchFilter === '' ||
      sc.code.includes(searchFilter) ||
      sc.title.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Group items by criteriaNumber (1 to 7)
  const groupedByCriteria = [1, 2, 3, 4, 5, 6, 7]
    .map((critNum) => {
      const items = filteredSubCriteria.filter((sc) => sc.criteriaNumber === critNum);
      const totalDocsInCrit = items.reduce(
        (acc, item) => acc + (subCriteriaStats.counts[item.code] || 0),
        0
      );
      const receivedCountInCrit = items.filter(
        (item) => (subCriteriaStats.counts[item.code] || 0) > 0
      ).length;

      return {
        criteriaNumber: critNum,
        items,
        totalDocsInCrit,
        receivedCountInCrit,
      };
    })
    .filter((group) => group.items.length > 0);

  return (
    <div className="rounded-3xl border border-purple-200/80 dark:border-purple-900/50 bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header & Main Dept Tracking Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 dark:border-purple-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
              <FileCheck2 className="h-4 w-4" />
            </span>
            <span className="text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              {isMainDept ? 'Central HQ Sub-Criteria Document Monitor' : 'Department Criteria Tracker'}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
            Received Documents by Sub-Criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any sub-criteria badge (e.g. <span className="font-bold text-purple-600">Criteria 5.5</span>) to inspect documents received specifically for that node.
          </p>
        </div>

        {/* Global Compliance Metric Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-purple-200 dark:border-purple-800/80 shadow-xs shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Sub-Criteria Progress
            </span>
            <span className="text-base font-black text-purple-700 dark:text-purple-300">
              {totalReceivedSubCriteria} <span className="text-xs font-semibold text-slate-400">/ 35 Active Nodes</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-300 font-extrabold text-sm">
            {Math.round((totalReceivedSubCriteria / 35) * 100)}%
          </div>
        </div>
      </div>

      {/* Selected Filter Notice Bar */}
      {selectedSubCriteria !== 'all' && (
        <div className="p-3.5 rounded-2xl bg-purple-600 text-white flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="h-4 w-4 text-purple-200 shrink-0" />
            <div className="text-xs min-w-0">
              <span className="font-medium text-purple-100">Currently Filtering Received Documents for: </span>
              <span className="font-black underline decoration-purple-300 underline-offset-2">
                Sub-Criteria {selectedSubCriteria}
              </span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-800 text-[10px] font-bold">
                {subCriteriaStats.counts[selectedSubCriteria] || 0} Document(s) Found
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelectSubCriteria('all')}
            className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Show All Documents</span>
          </button>
        </div>
      )}

      {/* Search and Criteria Number Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Criteria Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCriteriaGroup('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeCriteriaGroup === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            All Criteria (1-7)
          </button>
          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
            const countInNum = Object.keys(subCriteriaStats.counts).filter((code) =>
              code.startsWith(`${num}.`)
            ).length;

            return (
              <button
                key={num}
                type="button"
                onClick={() => setActiveCriteriaGroup(num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeCriteriaGroup === num
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Criteria {num}</span>
                {countInNum > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      activeCriteriaGroup === num
                        ? 'bg-purple-900 text-white'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    }`}
                  >
                    {countInNum}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-48">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search code e.g. 5.5..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Grid of Sub-Criteria Items grouped by Criteria Number */}
      <div className="space-y-4">
        {groupedByCriteria.map((group) => (
          <div
            key={group.criteriaNumber}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2.5 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                  Criteria {group.criteriaNumber}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {group.receivedCountInCrit} of {group.items.length} sub-criteria submitted
                </span>
              </div>

              <span className="text-[11px] font-medium text-slate-400">
                {group.totalDocsInCrit} total doc(s)
              </span>
            </div>

            {/* Sub-Criteria Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {group.items.map((sc) => {
                const docCount = subCriteriaStats.counts[sc.code] || 0;
                const hasReceived = docCount > 0;
                const isSelected = selectedSubCriteria === sc.code;
                const latestDoc = subCriteriaStats.latestDocs[sc.code];

                return (
                  <button
                    key={sc.code}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onSelectSubCriteria('all');
                      } else {
                        onSelectSubCriteria(sc.code);
                      }
                    }}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 group relative overflow-hidden ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-400 shadow-md scale-[1.02]'
                        : hasReceived
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 hover:shadow-xs'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-purple-900 text-white'
                              : hasReceived
                              ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {sc.code}
                        </span>

                        {hasReceived ? (
                          <span
                            className={`flex items-center gap-1 text-[10px] font-extrabold ${
                              isSelected
                                ? 'text-purple-100'
                                : 'text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{docCount} Received</span>
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] font-semibold ${
                              isSelected ? 'text-purple-200' : 'text-slate-400'
                            }`}
                          >
                            Pending
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-xs font-bold leading-tight line-clamp-2 ${
                          isSelected
                            ? 'text-white'
                            : 'text-slate-800 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300'
                        }`}
                      >
                        {sc.title}
                      </h4>
                    </div>

                    {hasReceived && latestDoc && (
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px]">
                        <span
                          className={`block truncate font-medium ${
                            isSelected ? 'text-purple-200' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          From: {latestDoc.sender_dept_name}
                        </span>
                      </div>
                    )}

                    {!hasReceived && (
                      <div
                        className={`text-[10px] font-semibold flex items-center justify-between ${
                          isSelected ? 'text-purple-200' : 'text-slate-400'
                        }`}
                      >
                        <span>Click to filter</span>
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
