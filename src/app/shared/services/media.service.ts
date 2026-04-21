import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MEDIA_SERVICE_URL } from '../constants/urls';
import { Observable } from 'rxjs';
import { MediaSession } from '../models/media';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  constructor(private http: HttpClient) {}

  uploadProductImage(property_id: number | null, files: File[]): Observable<number> {
    const formData: FormData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const params = new HttpParams().append('property_id', property_id?.toString() || '');

    return this.http.post<number>(`${MEDIA_SERVICE_URL}/v1/upload-product-media`, formData, {
      params,
    });
  }

  uploadUserAvatar(user_id: number, file: File): Observable<string> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    const params = new HttpParams().append('user_id', user_id.toString());
    return this.http.post<string>(`${MEDIA_SERVICE_URL}/v1/upload-user-avatar`, formData, {
      params,
    });
  }

  createMediaSession(): Observable<MediaSession> {
    return this.http.post<MediaSession>(`${MEDIA_SERVICE_URL}/v1/session`, {});
  }
  checkSessionStatus(sessionId: string, token: string): Observable<any> {
    return this.http.get(`${MEDIA_SERVICE_URL}/v1/session/${sessionId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
