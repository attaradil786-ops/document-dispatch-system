import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storageService';
import { DocumentCategory, DocumentPriority } from '../types';
import {
  getSubCriteriaForDepartment,
  getCriteriaNumberFromDeptId,
  ALL_SUB_CRITERIA,
} from '../utils/subCriteria';
import { SubCriteriaDrawer } from '../components/SubCriteriaDrawer';
import {
  UploadCloud,
  FileText,
  Send,
  Building2,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Tag,
  Info,
  X,
  FileCheck,
  Plus,
} from 'lucide-react';

interface DispatchUploadPageProps {
  onSuccess: () => void;
}

interface AttachedFileItem {
  id: string;
  file: File;
  name: string;
  sizeMb: string;
  fileType: string;
  dataUrl?: string;
}

export const DispatchUploadPage: React.FC<DispatchUploadPageProps> = ({ onSuccess }) => {
  const { user, isMainDept, departmentName } = useAuth();
  const subDepts = storageService.getSubDepartments();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Work Report');
  const [priority, setPriority] = useState<DocumentPriority>('Normal');

  // Get allowed sub-criteria strictly for user's department
  const allowedSubCriteria = getSubCriteriaForDepartment(user?.department_id, isMainDept);
  const userCriteriaNum = getCriteriaNumberFromDeptId(user?.department_id);

  // Selected Sub-Criteria Codes state array (allows single or multiple codes like ['1.2', '1.5', '4.3', '5.5'])
  const [selectedSubCriteriaCodes, setSelectedSubCriteriaCodes] = useState<string[]>([
    allowedSubCriteria[0]?.code || '1.1',
  ]);

  // Derived subCriteria string representation (e.g. "1.2, 1.5, 4.3, 5.5")
  const subCriteria = selectedSubCriteriaCodes.length > 0 ? selectedSubCriteriaCodes.join(', ') : '1.1';

  // Ensure selectedSubCriteriaCodes state stays within allowed range if user department shifts
  useEffect(() => {
    if (allowedSubCriteria.length > 0) {
      const valid = selectedSubCriteriaCodes.filter((code) =>
        allowedSubCriteria.some((sc) => sc.code === code)
      );
      if (valid.length === 0) {
        setSelectedSubCriteriaCodes([allowedSubCriteria[0].code]);
      } else if (valid.length !== selectedSubCriteriaCodes.length) {
        setSelectedSubCriteriaCodes(valid);
      }
    }
  }, [user?.department_id, isMainDept]);

  // Toggle or update multi sub-criteria
  const handleToggleSubCriteria = (code: string) => {
    let updated: string[];
    if (selectedSubCriteriaCodes.includes(code)) {
      if (selectedSubCriteriaCodes.length === 1) return; // Keep at least 1 selected
      updated = selectedSubCriteriaCodes.filter((c) => c !== code);
    } else {
      updated = [...selectedSubCriteriaCodes, code];
    }
    setSelectedSubCriteriaCodes(updated);

    if (isMainDept) {
      const targetDepts = Array.from(
        new Set(
          updated
            .map((c) => parseInt(c.split('.')[0], 10))
            .filter((n) => !isNaN(n))
            .map((n) => `dept-c${n}`)
        )
      );
      setSelectedTargets(targetDepts.length > 0 ? targetDepts : ['all']);
    }
  };

  const handleSetSubCriteriaCodes = (codes: string[]) => {
    if (codes.length === 0) return;
    setSelectedSubCriteriaCodes(codes);

    if (isMainDept) {
      const targetDepts = Array.from(
        new Set(
          codes
            .map((c) => parseInt(c.split('.')[0], 10))
            .filter((n) => !isNaN(n))
            .map((n) => `dept-c${n}`)
        )
      );
      setSelectedTargets(targetDepts.length > 0 ? targetDepts : ['all']);
    }
  };

  // If Main Dept: selected sub-dept IDs or 'all'
  // If Sub Dept: locked to ['main-dept']
  const [selectedTargets, setSelectedTargets] = useState<string[]>(
    isMainDept ? ['all'] : ['main-dept']
  );

  // Personal HQ Dispatch mode state (Main Dept personal upload to sub-criteria branches)
  const [isPersonalHqDispatch, setIsPersonalHqDispatch] = useState<boolean>(false);
  const [personalDispatchNote, setPersonalDispatchNote] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerCriteriaNum, setDrawerCriteriaNum] = useState<number | 'all'>('all');

  const openDrawerForCriteria = (critNum: number | 'all') => {
    setDrawerCriteriaNum(critNum);
    setIsDrawerOpen(true);
  };

  const handlePersonalSubCriteriaChange = (code: string) => {
    handleToggleSubCriteria(code);
  };

  // Multiple attached files state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray: File[] = Array.from(e.target.files);
    setUploadError('');

    // Auto-fill title from first attached file if title is currently empty
    if (!title.trim() && filesArray.length > 0) {
      const cleanName = filesArray[0].name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .trim();
      if (cleanName) {
        setTitle(cleanName);
      }
    }
    
    filesArray.forEach((selectedFile: File) => {
      const fileSizeMb = (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB';
      const fileName = selectedFile.name;
      const fileType = selectedFile.name.split('.').pop()?.toUpperCase() || 'PDF';
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles((prev) => [
          ...prev,
          {
            id: fileId,
            file: selectedFile,
            name: fileName,
            sizeMb: fileSizeMb,
            fileType,
            dataUrl: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(selectedFile);
    });

    // Reset input value so same files can be chosen again if needed
    e.target.value = '';
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const toggleTarget = (deptId: string) => {
    if (!isMainDept) return; // Sub-departments cannot change target

    if (deptId === 'all') {
      setSelectedTargets(['all']);
      return;
    }

    let updated = selectedTargets.filter((t) => t !== 'all');
    if (updated.includes(deptId)) {
      updated = updated.filter((t) => t !== deptId);
    } else {
      updated.push(deptId);
    }

    if (updated.length === 0) {
      updated = ['all'];
    }
    setSelectedTargets(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTitle =
      title.trim() ||
      (attachedFiles.length > 0
        ? attachedFiles[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').trim()
        : '');

    if (!effectiveTitle) {
      setUploadError('Please enter a document title or select at least one file to upload.');
      return;
    }

    if (!user) {
      setUploadError('User session not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    setUploadError('');

    setTimeout(() => {
      try {
        if (attachedFiles.length > 0) {
          // Multi-file dispatch: Create 1 document per attached file
          attachedFiles.forEach((fileItem, index) => {
            const docTitle =
              attachedFiles.length === 1
                ? effectiveTitle
                : `${effectiveTitle} (${index + 1}/${attachedFiles.length}: ${fileItem.name})`;

            storageService.addDocument(
              {
                title: docTitle,
                description: description.trim(),
                category,
                priority,
                subCriteria,
                isPersonalHqDispatch: isMainDept ? isPersonalHqDispatch : false,
                personalDispatchNote: isMainDept && isPersonalHqDispatch ? personalDispatchNote.trim() : undefined,
                targetDeptIds: selectedTargets,
                fileName: fileItem.name,
                fileSize: fileItem.sizeMb,
                fileType: fileItem.fileType,
                fileDataUrl: fileItem.dataUrl,
              },
              user
            );
          });

          setIsSubmitting(false);
          setSuccessMsg(
            `Successfully uploaded and dispatched ${attachedFiles.length} ${
              attachedFiles.length === 1 ? 'document' : 'documents'
            } simultaneously!`
          );
        } else {
          // Fallback single document dispatch
          const fileSizeMb = '1.2 MB';
          const fileName = `${effectiveTitle.replace(/\s+/g, '_')}.pdf`;
          const fileType = 'PDF';

          storageService.addDocument(
            {
              title: effectiveTitle,
              description: description.trim(),
              category,
              priority,
              subCriteria,
              isPersonalHqDispatch: isMainDept ? isPersonalHqDispatch : false,
              personalDispatchNote: isMainDept && isPersonalHqDispatch ? personalDispatchNote.trim() : undefined,
              targetDeptIds: selectedTargets,
              fileName,
              fileSize: fileSizeMb,
              fileType,
            },
            user
          );

          setIsSubmitting(false);
          setSuccessMsg('Document successfully uploaded and dispatched!');
        }

        setTimeout(() => {
          onSuccess();
        }, 1200);
      } catch (err: any) {
        console.error('Error uploading document:', err);
        setIsSubmitting(false);
        setUploadError(err?.message || 'Failed to dispatch document. Please try again.');
      }
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <UploadCloud className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-bold text-blue-300 border border-blue-400/30 uppercase tracking-widest">
              Inter-Department Dispatch Hub
            </span>
            <h2 className="text-2xl font-black tracking-tight mt-1">
              Upload & Dispatch Department Document
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Securely transmit work reports, policy memos, budget audits, and academic files with strict department routing.
            </p>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-4 text-rose-800 dark:text-rose-200 font-bold text-xs animate-in zoom-in-95">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-4 text-emerald-800 dark:text-emerald-200 font-bold text-xs animate-in zoom-in-95">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
          {/* Target Department Selection Box */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-blue-600" />
                Target Recipient Department(s)
              </span>
              {!isMainDept && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Locked to Main Dept
                </span>
              )}
            </label>

            {/* Sub-Department Enforcement Callout */}
            {!isMainDept ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Target: Main Department (Central HQ & Registry)
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      Sub-departments (like {departmentName}) upload documents strictly to the Main Department. Direct cross-department transmissions are restricted to prevent data leakage.
                    </p>
                  </div>
                </div>

                {/* Sub-Criteria Selection Block for Criteria Officers */}
                <div className="rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/40 p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span>Select Sub-Criteria Tag (Criteria {userCriteriaNum || '1'} Options) <span className="text-rose-500">*</span></span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Tag className="h-3 w-3" />
                      <span>Open Full Drawer</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Select which sub-criteria node(s) this document is associated with before dispatching:
                  </p>

                  {/* Quick Select Buttons for Department's Sub-Criteria */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allowedSubCriteria.map((sc) => {
                      const isSelected = selectedSubCriteriaCodes.includes(sc.code);
                      return (
                        <button
                          key={sc.code}
                          type="button"
                          onClick={() => handleToggleSubCriteria(sc.code)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 shadow-xs ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-400 scale-[1.01]'
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
                                  isSelected
                                    ? 'bg-purple-900 text-white'
                                    : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200'
                                }`}
                              >
                                Criteria {sc.code}
                              </span>
                            </div>
                            <p
                              className={`text-xs font-bold mt-1 truncate ${
                                isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {sc.title}
                            </p>
                          </div>

                          <div
                            className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'bg-purple-900 border-purple-900 text-white'
                                : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary of Selected Sub-Criteria */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 font-medium">Document Sub-Criteria Code:</span>
                    <span className="font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2.5 py-1 rounded-md font-mono">
                      Criteria {subCriteria}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Main Dept Choice & Mode Toggle */
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPersonalHqDispatch(false);
                      setSelectedTargets(['all']);
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      !isPersonalHqDispatch
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-800'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Standard Broadcast / Multi-Dept Target</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPersonalHqDispatch(true);
                      handlePersonalSubCriteriaChange(subCriteria);
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isPersonalHqDispatch
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md ring-2 ring-purple-400 dark:ring-purple-500/80 scale-[1.01]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50/60 dark:hover:bg-purple-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-purple-200" />
                      <span>⚡ Personal Direct HQ Dispatch to Sub-Criteria Branch</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-purple-900/40 text-purple-100 border border-purple-400/30 shrink-0">
                      35 Sub-Criteria
                    </span>
                  </button>
                </div>

                {isPersonalHqDispatch ? (
                  /* Personal HQ Dispatch Box */
                  <div className="space-y-4 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/40 shadow-xs">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-purple-900 dark:text-purple-200">
                          Personal HQ Dispatch Mode Active
                        </p>
                        <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
                          Select the target Sub-Criteria Nodal Branch below to route this document personally with official directives.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Sub-Criteria Selection via Criteria Drawer Buttons & Multi-Select Pills */}
                    <div className="space-y-3 pt-1 border-t border-purple-200/60 dark:border-purple-900/40">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-purple-600" />
                          <span>Selected Sub-Criteria Matrix ({selectedSubCriteriaCodes.length})</span>
                        </label>

                        <span className="text-[10px] font-black text-purple-800 dark:text-purple-200 bg-purple-100 dark:bg-purple-950 px-2.5 py-0.5 rounded-md border border-purple-300 dark:border-purple-800">
                          Multi-Select Mode Active
                        </span>
                      </div>

                      {/* Active Selected Sub-Criteria Badges / Tags */}
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Attached Criteria Codes:
                          </span>
                          {selectedSubCriteriaCodes.length > 1 && (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                              {selectedSubCriteriaCodes.length} Criteria Selected
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedSubCriteriaCodes.map((code) => {
                            const scObj = ALL_SUB_CRITERIA.find((s) => s.code === code);
                            return (
                              <span
                                key={code}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-600 text-white shadow-xs"
                              >
                                <span>Criteria {code}</span>
                                {selectedSubCriteriaCodes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSubCriteria(code)}
                                    className="hover:bg-purple-800 rounded-md p-0.5 transition-colors cursor-pointer"
                                    title={`Remove ${code}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Criteria Select Buttons with specific drawer triggers */}
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((critNum) => {
                          const groupItems = ALL_SUB_CRITERIA.filter((sc) => sc.criteriaNumber === critNum);
                          const minCode = groupItems[0]?.code || `${critNum}.1`;
                          const maxCode = groupItems[groupItems.length - 1]?.code || `${critNum}.5`;
                          const selectedInGroup = selectedSubCriteriaCodes.filter((c) =>
                            c.startsWith(`${critNum}.`)
                          );
                          const hasSelectedInGroup = selectedInGroup.length > 0;

                          return (
                            <div key={critNum} className="flex items-center gap-2 flex-wrap">
                              {/* Dedicated Criteria Select Button that opens drawer for this specific criteria */}
                              <button
                                type="button"
                                onClick={() => openDrawerForCriteria(critNum)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border shadow-xs ${
                                  hasSelectedInGroup
                                    ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-400 scale-[1.01]'
                                    : 'bg-purple-100/90 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900'
                                }`}
                              >
                                <Tag className="h-3.5 w-3.5 shrink-0" />
                                <span>Criteria {critNum} ({minCode} - {maxCode})</span>
                                {hasSelectedInGroup && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-900 text-white font-black">
                                    {selectedInGroup.length} Selected
                                  </span>
                                )}
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-900/30 text-purple-100 font-black tracking-wide uppercase">
                                  📑 Open Drawer
                                </span>
                              </button>

                              {/* Quick sub-criteria pills for multi-toggle */}
                              <div className="flex items-center gap-1 flex-wrap">
                                {groupItems.map((sc) => {
                                  const isCurrent = selectedSubCriteriaCodes.includes(sc.code);
                                  return (
                                    <button
                                      key={sc.code}
                                      type="button"
                                      onClick={() => handleToggleSubCriteria(sc.code)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                        isCurrent
                                          ? 'bg-purple-900 text-white shadow-xs font-black ring-1 ring-purple-400'
                                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-purple-200 dark:border-purple-900/60 hover:bg-purple-100 dark:hover:bg-purple-950'
                                      }`}
                                      title={`Toggle Sub-Criteria ${sc.code}: ${sc.title}`}
                                    >
                                      <span>{sc.code}</span>
                                      {isCurrent ? (
                                        <CheckCircle2 className="h-3 w-3 text-white shrink-0" />
                                      ) : (
                                        <span className="text-[9px] text-slate-400 font-mono">+</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Automated Department Routing & Multi-Criteria Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Selected Sub-Criteria Codes
                        </label>
                        <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span className="font-mono text-purple-700 dark:text-purple-300 truncate">
                            {subCriteria}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-2">
                            ({selectedSubCriteriaCodes.length} criteria)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Automated Nodal Branch Routing
                        </label>
                        <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-100/50 dark:bg-purple-900/30 text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center justify-between">
                          <span className="truncate">
                            Routes to:{' '}
                            {Array.from(
                              new Set(selectedSubCriteriaCodes.map((c) => c.split('.')[0]))
                            )
                              .map((c) => `Criteria ${c}`)
                              .join(', ')}
                          </span>
                          <span className="text-[10px] bg-purple-200 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-md font-mono shrink-0 ml-2">
                            {selectedTargets.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>Personal HQ Directive / Special Note for Sub-Criteria Officer</span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">Optional directive</span>
                      </label>
                      <input
                        type="text"
                        value={personalDispatchNote}
                        onChange={(e) => setPersonalDispatchNote(e.target.value)}
                        placeholder="e.g. Attention Criteria 1.2 Nodal Officer: Urgent review required for NAAC SSR submission."
                        className="w-full rounded-xl border border-purple-200 dark:border-purple-900 bg-white dark:bg-slate-900 p-2.5 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ) : (
                  /* Standard Broadcast Grid */
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">
                      Select sub-departments to dispatch this document to, or broadcast to all departments:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleTarget('all')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                          selectedTargets.includes('all')
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>📢 ALL Sub-Departments</span>
                        {selectedTargets.includes('all') && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </button>

                      {subDepts.map((d) => {
                        const isSelected = selectedTargets.includes(d.id);
                        const cNum = getCriteriaNumberFromDeptId(d.id);
                        const rangeLabel = cNum ? `${cNum}.1 - ${cNum}.5` : '';
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleTarget(d.id)}
                            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}
                          >
                            <div className="flex flex-col items-start gap-0.5 min-w-0">
                              <span className="truncate font-bold">{d.name}</span>
                              {rangeLabel && (
                                <span className={`text-[10px] font-extrabold ${isSelected ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                                  Sub-Criteria {rangeLabel}
                                </span>
                              )}
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-white shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Document Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Document Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q3 AI Research Progress Report & Equipment Allocation"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Work Report">Work Report</option>
                <option value="Audit & Finance">Audit & Finance</option>
                <option value="Policy & Circular">Policy & Circular</option>
                <option value="Project Request">Project Request</option>
                <option value="HR & Staffing">HR & Staffing</option>
                <option value="Academic Record">Academic Record</option>
                <option value="General Memo">General Memo</option>
              </select>
            </div>
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Priority Classification
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Normal', 'Urgent', 'Confidential'] as DocumentPriority[]).map((p) => {
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? p === 'Urgent'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                          : p === 'Confidential'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                          : 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p === 'Urgent' && '🔥 '}
                    {p === 'Confidential' && '🔒 '}
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Description / Notes for Recipient
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background context, required actions, deadlines, or official references..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Multi-File Drag-and-Drop Dropzone */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-600" />
                <span>Attach Official Document Files (Multi-Upload Supported)</span>
              </label>
              {attachedFiles.length > 0 && (
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  {attachedFiles.length} {attachedFiles.length === 1 ? 'file' : 'files'} attached
                </span>
              )}
            </div>

            {/* Drag & Drop Input Zone */}
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-500 transition-colors cursor-pointer group">
              <input
                type="file"
                multiple
                onChange={handleMultipleFilesChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Click to select or drag & drop multiple files here
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Supports PDF, Word, Excel, Images, or ZIP archives (Select multiple files at once)
                  </p>
                </div>
              </div>
            </div>

            {/* List of Attached Files */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Attached Files List ({attachedFiles.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachedFiles.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-[10px]">
                          {item.fileType}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {item.sizeMb} • Ready for dispatch
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAttachedFile(item.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting || (!title.trim() && attachedFiles.length === 0)}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>
              {isSubmitting
                ? 'Uploading & Transmitting...'
                : attachedFiles.length > 1
                ? `Dispatch ${attachedFiles.length} Documents`
                : 'Dispatch Document'}
            </span>
          </button>
        </div>
      </form>

      {/* Sub-Criteria Selection Slide-over Drawer */}
      <SubCriteriaDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedSubCriteria={selectedSubCriteriaCodes}
        onSelectSubCriteria={(codes) => {
          handleSetSubCriteriaCodes(codes);
        }}
        allowedItems={allowedSubCriteria}
        departmentName={user?.department_name}
        isMainDept={isMainDept}
        focusedCriteriaNumber={drawerCriteriaNum}
      />
    </div>
  );
};
