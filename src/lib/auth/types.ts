export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'developer' | 'admin';
  createdAt: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string;
  role: string;
  exp: number; // Unix timestamp
}

export interface AuthResult {
  success: boolean;
  user?: User;
  sessionToken?: string;
  error?: string;
}
