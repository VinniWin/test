export type Status = "PENDING" | "APPROVED" | "REJECTED";
export type AuditActions = "create" | "approve" | "edit" | "reject";

export interface Admin {
  id: string;
  email: string;
  password: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  pricePerDay: number;
  submittedBy: string;
  submittedAt: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  adminId?: string;
}

export interface AuditLog {
  id: string;
  action: AuditActions;
  timestamp: string;
  listingId: string;
  adminId: string;
  details?: string;
}
