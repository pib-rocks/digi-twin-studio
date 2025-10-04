import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProxyTestService {

  constructor(private http: HttpClient) {}

  testProxy(): Observable<any> {
    return this.http.get('http://localhost:3001/test').pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Proxy test failed:', error);
        return throwError(() => new Error(`Proxy test failed: ${error.status} ${error.statusText}. Make sure the proxy server is running on port 3001.`));
      })
    );
  }

  testHealth(): Observable<any> {
    return this.http.get('http://localhost:3001/health').pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Health check failed:', error);
        return throwError(() => new Error(`Health check failed: ${error.status} ${error.statusText}`));
      })
    );
  }
}
