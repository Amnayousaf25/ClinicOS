export enum Department {
  Design = 'Design',
  Engineering = 'Engineering',
  Marketing = 'Marketing',
  Sales = 'Sales',
  HR = 'HR',
  Finance = 'Finance',
  Admin = 'Admin',
  QA = 'Quality Assurance',
  Support = 'Support',
  IT = 'Information Technology',
  Research = 'Research and Development',
  DevOps = 'DevOps',
}

export const DEFAULT_DEPARTMENT_NAMES: string[] = Object.values(Department);

// Names that were seeded in a previous version and should be retired so
// they stop appearing in filters/invite forms. The seeder marks any
// matching records as inactive on boot.
export const RETIRED_DEPARTMENT_NAMES: string[] = ['Management'];
