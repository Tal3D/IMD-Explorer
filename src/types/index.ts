
import type { LucideIcon } from 'lucide-react';

export interface IMD {
  name: string;
  alternativeName?: string;
  diseaseAbbreviation?: string;
  icimdNosologyNumber?: string;
  icimdCategoryName?: string;
  iemBaseId?: string;
  geneSymbol?: string;
  iemNosologyCode?: string;
  omimId?: string;
  imdStatus?: string;
  minGroupSize?: string;
  Collaborators?: string;
  recruitedCount?: number;
}

export interface GroupedIMDs {
  [categoryName: string]: IMD[];
}

export interface OrderedGroupedIMD {
  categoryName: string;
  imds: IMD[];
  count: number;
}

export interface ClassificationSystem {
  id: string;
  name: string;
  description: string;
  link: string;
  icon?: LucideIcon;
}

export interface ImdStats {
  categoryCount: number;
  imdCount: number;
  recruitedPatientCount?: number;
}
