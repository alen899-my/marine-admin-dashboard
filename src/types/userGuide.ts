export interface UserGuideSection {
  _id: string;
  groupId: string;
  group: {
    id: string;
    name: string;
    sortOrder: number;
  } | null;
  title: string;
  content: string;
  roleContents: Record<string, string>;
  assignedRoles: string[];
  sortOrder: number;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface UserGuideGroup {
  _id: string;
  name: string;
  sortOrder: number;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface UserGuideListResponse {
  data: UserGuideSection[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
