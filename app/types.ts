export type Role = "Admin" | "AE" | "CSM" | "RevOps";

export type HandoffStatus =
  | "draft"
  | "extracting"
  | "ready"
  | "reviewed"
  | "missing_fields";

export type SourceKind = "CRM" | "Transcript";

export type Evidence = {
  source: SourceKind;
  label: string;
  excerpt: string;
};

export type HandoffField = {
  key: string;
  label: string;
  value: string;
  required: boolean;
  missing: boolean;
  confidence: number;
  evidence: Evidence[];
};

export type Contact = {
  id: string;
  name: string;
  title: string;
  role: string;
  email: string;
};

export type Deal = {
  id: string;
  name: string;
  accountName: string;
  stage: string;
  closeDate: string;
  owner: string;
  assignedCsm: string;
  acv: string;
  contacts: Contact[];
  notes: string;
};

export type Transcript = {
  id: string;
  title: string;
  source: "Zoom" | "Manual Upload";
  uploadedAt: string;
  content: string;
};

export type Review = {
  reviewed: boolean;
  rating: number;
  comment: string;
  flags: string[];
};

export type Handoff = {
  id: string;
  status: HandoffStatus;
  completion: number;
  updatedAt: string;
  fields: HandoffField[];
  review: Review;
};
