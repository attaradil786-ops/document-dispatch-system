export interface SubCriteriaItem {
  code: string; // e.g. '1.1'
  title: string; // e.g. 'Curricular Design & Development'
  criteriaNumber: number; // e.g. 1
}

export const ALL_SUB_CRITERIA: SubCriteriaItem[] = [
  // Criteria 1
  { code: '1.1', title: 'Curricular Design & Development', criteriaNumber: 1 },
  { code: '1.2', title: 'Academic Flexibility', criteriaNumber: 1 },
  { code: '1.3', title: 'Curriculum Enrichment', criteriaNumber: 1 },
  { code: '1.4', title: 'Feedback System', criteriaNumber: 1 },
  { code: '1.5', title: 'Outcome Assessment & Review', criteriaNumber: 1 },

  // Criteria 2
  { code: '2.1', title: 'Student Enrolment & Profile', criteriaNumber: 2 },
  { code: '2.2', title: 'Catering to Student Diversity', criteriaNumber: 2 },
  { code: '2.3', title: 'Teaching-Learning Process', criteriaNumber: 2 },
  { code: '2.4', title: 'Teacher Profile & Quality', criteriaNumber: 2 },
  { code: '2.5', title: 'Evaluation Process & Reforms', criteriaNumber: 2 },

  // Criteria 3
  { code: '3.1', title: 'Resource Mobilization for Research', criteriaNumber: 3 },
  { code: '3.2', title: 'Innovation Ecosystem', criteriaNumber: 3 },
  { code: '3.3', title: 'Research Publications & Awards', criteriaNumber: 3 },
  { code: '3.4', title: 'Extension Activities', criteriaNumber: 3 },
  { code: '3.5', title: 'Collaboration & MoUs', criteriaNumber: 3 },

  // Criteria 4
  { code: '4.1', title: 'Physical Facilities', criteriaNumber: 4 },
  { code: '4.2', title: 'Library as a Learning Resource', criteriaNumber: 4 },
  { code: '4.3', title: 'IT Infrastructure', criteriaNumber: 4 },
  { code: '4.4', title: 'Maintenance of Campus Infrastructure', criteriaNumber: 4 },
  { code: '4.5', title: 'Utilities & Energy Conservation', criteriaNumber: 4 },

  // Criteria 5
  { code: '5.1', title: 'Student Support Services', criteriaNumber: 5 },
  { code: '5.2', title: 'Student Progression', criteriaNumber: 5 },
  { code: '5.3', title: 'Student Participation & Activities', criteriaNumber: 5 },
  { code: '5.4', title: 'Alumni Engagement', criteriaNumber: 5 },
  { code: '5.5', title: 'Guidance & Placement Services', criteriaNumber: 5 },

  // Criteria 6
  { code: '6.1', title: 'Institutional Vision & Leadership', criteriaNumber: 6 },
  { code: '6.2', title: 'Strategy Development & Deployment', criteriaNumber: 6 },
  { code: '6.3', title: 'Faculty Empowerment Strategies', criteriaNumber: 6 },
  { code: '6.4', title: 'Financial Management & Audits', criteriaNumber: 6 },
  { code: '6.5', title: 'Internal Quality Assurance System (IQAC)', criteriaNumber: 6 },

  // Criteria 7
  { code: '7.1', title: 'Institutional Values & Social Responsibilities', criteriaNumber: 7 },
  { code: '7.2', title: 'Best Practices', criteriaNumber: 7 },
  { code: '7.3', title: 'Institutional Distinctiveness', criteriaNumber: 7 },
  { code: '7.4', title: 'Green Initiatives & Sustainability', criteriaNumber: 7 },
  { code: '7.5', title: 'Code of Conduct & Ethics', criteriaNumber: 7 },
];

/**
 * Extracts criteria number from department ID (e.g. 'dept-c1' -> 1)
 */
export function getCriteriaNumberFromDeptId(deptId?: string): number | null {
  if (!deptId) return null;
  if (deptId === 'main-dept') return null; // Main dept has access to all
  const match = deptId.match(/dept-c(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Returns sub-criteria items allowed for a given department.
 * - Non-main Criteria dept (e.g. Criteria 1) -> ONLY 1.1 to 1.5
 * - Main dept -> ALL (1.1 to 7.5)
 */
export function getSubCriteriaForDepartment(deptId?: string, isMainDept: boolean = false): SubCriteriaItem[] {
  if (isMainDept || deptId === 'main-dept') {
    return ALL_SUB_CRITERIA;
  }

  const critNum = getCriteriaNumberFromDeptId(deptId);
  if (critNum !== null) {
    return ALL_SUB_CRITERIA.filter((sc) => sc.criteriaNumber === critNum);
  }

  return ALL_SUB_CRITERIA;
}

/**
 * Validates if a department has access to a specific sub-criteria code (e.g. '1.1')
 */
export function canAccessSubCriteria(deptId: string, isMainDept: boolean, subCriteriaCode?: string): boolean {
  if (!subCriteriaCode) return true;
  if (isMainDept || deptId === 'main-dept') return true;

  const allowed = getSubCriteriaForDepartment(deptId, isMainDept);
  return allowed.some((item) => item.code === subCriteriaCode);
}
