import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AUTH_URL } from '../constants/urls';
import { UserProfile } from '../models/auth';

/** Body of PUT /api/auth/v1/admin/agents/{id}; empty strings clear the profile fields. */
export interface AgentUpdateRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

/** Shape returned by GET /api/auth/v1/admin/agents (same fields as AuthResponse, minus tokens). */
export interface AgentResponse {
  id: number;
  username: string;
  email: string;
  phoneNumber?: string | null;
  authorities: string[];
  enabled?: boolean;
  propertiesCount?: number;
  createdAt?: string;
  deletedAt?: string | null;
  profile?: Partial<UserProfile> | null;
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  private http = inject(HttpClient);

  getAgents(): Observable<AgentResponse[]> {
    return this.http.get<AgentResponse[]>(`${AUTH_URL}/v1/admin/agents`);
  }

  updateAgent(id: number, body: AgentUpdateRequest): Observable<AgentResponse> {
    return this.http.put<AgentResponse>(`${AUTH_URL}/v1/admin/agents/${id}`, body);
  }

  /** Soft delete: the agent keeps their data and can be reactivated. */
  deactivateAgent(id: number): Observable<AgentResponse> {
    return this.http.delete<AgentResponse>(`${AUTH_URL}/v1/admin/agents/${id}`);
  }

  reactivateAgent(id: number): Observable<AgentResponse> {
    return this.http.post<AgentResponse>(`${AUTH_URL}/v1/admin/agents/${id}/reactivate`, {});
  }
}
