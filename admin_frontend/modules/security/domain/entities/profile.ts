export interface Profile {
  id: string;
  name: string;
  description: string;
  active: boolean;
  permissionCount: number;
  created?: string;
  updated?: string;
}

