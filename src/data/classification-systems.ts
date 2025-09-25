
import type { ClassificationSystem } from '@/types';
import { Atom, ListTree, Dna, Network, DatabaseZap, Library } from 'lucide-react';

export const classificationSystems: ClassificationSystem[] = [
  {
    id: 'atc',
    name: 'ATC',
    description: 'The Anatomical Therapeutic Chemical (ATC) Classification System is used for the classification of active ingredients of drugs according to the organ or system on which they act and their therapeutic, pharmacological and chemical properties.',
    link: 'https://www.who.int/tools/atc-ddd-toolkit/atc-classification',
    icon: Atom,
  },
  {
    id: 'icimd',
    name: 'ICIMD',
    description: 'The International Classification of Inherited Metabolic Diseases (ICIMD) is a classification system specifically designed for inherited metabolic diseases, aiming to provide a standardized nomenclature and hierarchy.',
    link: 'http://www.icimd.org/',
    icon: ListTree,
  },
  {
    id: 'omim',
    name: 'OMIM',
    description: 'Online Mendelian Inheritance in Man (OMIM) is a comprehensive, authoritative compendium of human genes and genetic phenotypes that is freely available and updated daily. It contains information on all known mendelian disorders and over 15,000 genes.',
    link: 'https://www.omim.org/',
    icon: Dna,
  },
  {
    id: 'metabern',
    name: 'MetabERN',
    description: 'MetabERN is the European Reference Network for Hereditary Metabolic Diseases. It aims to facilitate access to diagnosis, treatment, and care for patients with rare or low-prevalence complex metabolic diseases across Europe.',
    link: 'https://metab.ern-net.eu/',
    icon: Network,
  },
  {
    id: 'iembase',
    name: 'IEMbase',
    description: 'IEMbase is a curated knowledge base focusing on inborn errors of metabolism. It provides detailed information on specific diseases, associated genes, enzymes, and relevant metabolites.',
    link: 'https://www.iembase.org/',
    icon: DatabaseZap,
  },
  {
    id: 'hpo',
    name: 'HPO',
    description: 'The Human Phenotype Ontology (HPO) provides a standardized vocabulary of phenotypic abnormalities encountered in human disease. It is widely used in genomics and clinical genetics.',
    link: 'https://hpo.jax.org/',
    icon: Library,
  },
];

