import React, { useState } from 'react';
import { SubCriteriaItem, ALL_SUB_CRITERIA } from '../utils/subCriteria';
import {
  X,
  Search,
  CheckCircle2,
  Tag,
  Filter,
  Check,
  Building2,
  ChevronRight,
  Info,
} from 'lucide-react';

interface SubCriteriaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubCriteria: string | string[];
  onSelectSubCriteria: (codes: string[]) => void;
  allowedItems?: SubCriteriaItem[];
  departmentName?: string;
  isMainDept?: boolean;
  focusedCriteriaNumber?: number | 'all';
}

export const SubCriteriaDrawer: React.FC<SubCriteriaDrawerProps> = ({
  isOpen,
  onClose,
  selectedSubCriteria,
  onSelectSubCriteria,
  allowedItems = ALL_SUB_CRITERIA,
  departmentName,
  isMainDept = false,
  focusedCriteriaNumber = 'all',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCriteriaFilter, setActiveCriteriaFilter] = useState<number | 'all'>(focusedCriteriaNumber);

  // Convert incoming selectedSubCriteria to string array
  const initialSelectedCodes = Array.isArray(selectedSubCriteria)
    ? selectedSubCriteria
    : selectedSubCriteria
    ? selectedSubCriteria.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const [selectedCodes, setSelectedCodes] = useState<string[]>(initialSelectedCodes);

  // Sync state when drawer opens or prop changes
  React.useEffect(() => {
    if (isOpen) {
      setActiveCriteriaFilter(focusedCriteriaNumber);
      setSearchQuery('');
      const codes = Array.isArray(selectedSubCriteria)
        ? selectedSubCriteria
        : selectedSubCriteria
        ? selectedSubCriteria.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      setSelectedCodes(codes);
    }
  }, [isOpen, focusedCriteriaNumber, selectedSubCriteria]);

  if (!isOpen) return null;

  // Criteria Categories Titles
  const criteriaCategoryTitles: Record<number, string> = {
    1: 'Criteria 1: Curricular Aspects (1.1 - 1.5)',
    2: 'Criteria 2: Teaching-Learning & Evaluation (2.1 - 2.5)',
    3: 'Criteria 3: Research, Innovations & Extension (3.1 - 3.5)',
    4: 'Criteria 4: Infrastructure & Learning Resources (4.1 - 4.5)',
    5: 'Criteria 5: Student Support & Progression (5.1 - 5.5)',
    6: 'Criteria 6: Governance, Leadership & Management (6.1 - 6.5)',
    7: 'Criteria 7: Institutional Values & Best Practices (7.1 - 7.5)',
  };

  // Filter items
  const filteredSubCriteria = allowedItems.filter((item) => {
    const matchesCriteriaNum =
      activeCriteriaFilter === 'all' || item.criteriaNumber === activeCriteriaFilter;
    const matchesSearch =
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (criteriaCategoryTitles[item.criteriaNumber] || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesCriteriaNum && matchesSearch;
  });

  const handleItemToggle = (code: string) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter((c) => c !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  const handleSelectAllVisible = () => {
    const visibleCodes = filteredSubCriteria.map((sc) => sc.code);
    const allSelected = visibleCodes.every((c) => selectedCodes.includes(c));
    if (allSelected) {
      setSelectedCodes(selectedCodes.filter((c) => !visibleCodes.includes(c)));
    } else {
      const combined = Array.from(new Set([...selectedCodes, ...visibleCodes]));
      setSelectedCodes(combined);
    }
  };

  const handleClearAll = () => {
    setSelectedCodes([]);
  };

  const handleApply = () => {
    onSelectSubCriteria(selectedCodes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Slide-over Drawer Body */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 transition-transform duration-300 transform translate-x-0">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold shadow-xs">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>
                  {typeof activeCriteriaFilter === 'number'
                    ? `Criteria ${activeCriteriaFilter} Sub-Criteria Drawer`
                    : 'Select Sub-Criteria'}
                </span>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                  {typeof activeCriteriaFilter === 'number'
                    ? `${filteredSubCriteria.length} Items (${activeCriteriaFilter}.1 - ${activeCriteriaFilter}.${filteredSubCriteria.length})`
                    : `${allowedItems.length} Available`}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isMainDept
                  ? 'Main HQ Access: Full 35 Sub-Criteria Matrix'
                  : `Scope: ${departmentName || 'Your Department'}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar & Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code (e.g. 1.2, 3.4) or title..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Criteria Filter Tabs + Multi-Select Actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {isMainDept && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveCriteriaFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                    activeCriteriaFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All (1-7)
                </button>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActiveCriteriaFilter(num)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                      activeCriteriaFilter === num
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Criteria {num}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-[10px] font-bold ml-auto">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
              >
                Toggle All Visible
              </button>
              {selectedCodes.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-rose-600 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Content / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredSubCriteria.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Info className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No Sub-Criteria Found
              </p>
              <p className="text-[11px] text-slate-400">
                Try searching for a different code or keyword like "Curriculum", "Library", or "Research".
              </p>
            </div>
          ) : (
            /* Group by Criteria Number */
            [1, 2, 3, 4, 5, 6, 7].map((critNum) => {
              const groupItems = filteredSubCriteria.filter((sc) => sc.criteriaNumber === critNum);
              if (groupItems.length === 0) return null;

              return (
                <div key={critNum} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      {criteriaCategoryTitles[critNum]}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {groupItems.map((sc) => {
                      const isSelected = selectedCodes.includes(sc.code);
                      return (
                        <button
                          key={sc.code}
                          type="button"
                          onClick={() => handleItemToggle(sc.code)}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50/90 dark:bg-purple-950/70 shadow-sm ring-1 ring-purple-500'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/40 dark:hover:bg-purple-950/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black text-xs transition-colors ${
                                isSelected
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 group-hover:bg-purple-200 dark:group-hover:bg-purple-900'
                              }`}
                            >
                              {sc.code}
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`text-xs font-bold truncate ${
                                  isSelected
                                    ? 'text-purple-950 dark:text-white'
                                    : 'text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300'
                                }`}
                              >
                                {sc.title}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                Criteria {sc.criteriaNumber} Nodal Sub-Criteria
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            <div
                              className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-purple-600 border-purple-600 text-white'
                                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                              }`}
                            >
                              {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
              Selected Sub-Criteria ({selectedCodes.length}):
            </span>
            <div className="truncate font-extrabold text-purple-700 dark:text-purple-300 text-xs">
              {selectedCodes.length > 0
                ? selectedCodes.map((c) => `Criteria ${c}`).join(', ')
                : 'None Selected'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Apply Selection ({selectedCodes.length})
          </button>
        </div>
      </div>
    </div>
  );
};
