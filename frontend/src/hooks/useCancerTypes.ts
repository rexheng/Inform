import type { CancerType } from '../api/client';

const CANCER_TYPES: CancerType[] = [
  { value: "Suspected acute leukaemia", display_name: "Acute Leukaemia", standards: ["FDS"] },
  { value: "Suspected brain/central nervous system tumours", display_name: "Brain / CNS", standards: ["FDS"] },
  { value: "Suspected breast cancer", display_name: "Breast", standards: ["FDS"] },
  { value: "Suspected cancer - non-specific symptoms", display_name: "Non-Specific Symptoms", standards: ["FDS"] },
  { value: "Suspected children's cancer", display_name: "Children's Cancer", standards: ["FDS"] },
  { value: "Suspected gynaecological cancer", display_name: "Gynaecological", standards: ["FDS"] },
  { value: "Suspected haematological malignancies (excluding acute leukaemia)", display_name: "Haematological", standards: ["FDS"] },
  { value: "Suspected head & neck cancer", display_name: "Head & Neck", standards: ["FDS"] },
  { value: "Suspected lower gastrointestinal cancer", display_name: "Lower GI", standards: ["FDS"] },
  { value: "Suspected lung cancer", display_name: "Lung", standards: ["FDS"] },
  { value: "Suspected other cancer", display_name: "Other", standards: ["FDS"] },
  { value: "Suspected sarcoma", display_name: "Sarcoma", standards: ["FDS"] },
  { value: "Suspected skin cancer", display_name: "Skin", standards: ["FDS"] },
  { value: "Suspected testicular cancer", display_name: "Testicular", standards: ["FDS"] },
  { value: "Suspected upper gastrointestinal cancer", display_name: "Upper GI", standards: ["FDS"] },
  { value: "Suspected urological malignancies (excluding testicular)", display_name: "Urological", standards: ["FDS"] },
];

export function useCancerTypes() {
  return { types: CANCER_TYPES, loading: false };
}
