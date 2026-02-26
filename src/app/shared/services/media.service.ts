import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MEDIA_SERVICE_URL } from '../constants/urls';
import { Observable } from 'rxjs';
import { Property } from '../models/properties';
import { MediaSession } from '../models/media';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  constructor(private http: HttpClient) {}

  uploadImage(property_id: number | null, files: File[]): Observable<Property> {
    const formData: FormData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const params = new HttpParams().append('property_id', property_id?.toString() || '');

    return this.http.post<Property>(`${MEDIA_SERVICE_URL}/v1/upload`, formData, { params });
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
