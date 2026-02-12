export interface AuthUser {
  id: string;
  name: string;
  email: string;
  login: string;
  active: boolean;
  phone?: string;
  address?: string;
  avatar?: string;
}
