import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { LoggingService } from './logging.service';
import * as CryptoJS from 'crypto-js';

export interface OnshapeCredentials {
  accessKey: string;
  secretKey: string;
  assemblyUrl: string;
}

export interface OnshapeDocument {
  id: string;
  name: string;
  type: string;
}

export interface OnshapeAssembly {
  id: string;
  name: string;
  elements: OnshapeElement[];
}

export interface OnshapeElement {
  id: string;
  name: string;
  type: string;
  transform?: number[];
  material?: string;
  appearance?: string;
}

export interface OnshapePart {
  id: string;
  name: string;
  material?: string;
  appearance?: string;
  boundingBox?: {
    minCorner: number[];
    maxCorner: number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class OnshapeApiService {
  private readonly baseUrl = 'http://localhost:3001/api'; // Use local proxy server
  
  constructor(private http: HttpClient, private logger: LoggingService) {}

  /**
   * Extract document, workspace, and assembly IDs from Onshape URL
   */
  parseAssemblyUrl(url: string): { documentId: string; workspaceId: string; assemblyId: string } | null {
    const match = url.match(/\/documents\/([^\/]+)\/w\/([^\/]+)\/e\/([^\/]+)/);
    if (match) {
      return {
        documentId: match[1],
        workspaceId: match[2],
        assemblyId: match[3]
      };
    }
    return null;
  }

  /**
   * Create authentication headers for Onshape API using Request Signature method
   */
  private createAuthHeaders(credentials: OnshapeCredentials, method: string = 'GET', url: string = ''): HttpHeaders {
    const authDate = new Date().toUTCString();
    const nonce = this.generateNonce();
    const contentType = 'application/json';
    
    // When using the proxy server, don't send authentication headers
    // The proxy server handles authentication using secrets.json
    console.log('Using proxy server - authentication handled by backend...');
    return new HttpHeaders({
      'Content-Type': contentType,
      'Accept': 'application/json',
      'User-Agent': 'DigiTwin-Studio/1.0'
    });
  }

  /**
   * Generate a random nonce for the request
   * Following the Python client approach (25-character alphanumeric)
   */
  private generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 25; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log('Generated nonce:', result);
    return result;
  }

  /**
   * Create the request signature according to Onshape API documentation
   * Based on the working Python client implementation
   */
  private createSignature(method: string, url: string, nonce: string, authDate: string, contentType: string, accessKey: string, secretKey: string): string {
    try {
      // Parse the URL to get path and query (following Python client approach)
      const urlObj = new URL(url);
      const urlPath = urlObj.pathname;
      const urlQuery = urlObj.search.substring(1); // Remove the '?' prefix
      
      // Create the string to sign (must be lowercase, newline-separated)
      // This matches exactly what the Python client does
      const stringToSign = [
        method.toLowerCase(),
        nonce.toLowerCase(),
        authDate.toLowerCase(),
        contentType.toLowerCase(),
        urlPath.toLowerCase(),
        urlQuery.toLowerCase()
      ].join('\n');
      
      console.log('String to sign:', stringToSign);
      console.log('Secret key length:', secretKey.length);
      
      // Use crypto-js for proper HMAC-SHA256 (same as Python client)
      const signature = CryptoJS.HmacSHA256(stringToSign, secretKey).toString(CryptoJS.enc.Base64);
      
      const authHeader = `On ${accessKey}:HmacSHA256:${signature}`;
      console.log('Generated auth header:', authHeader.substring(0, 50) + '...');
      
      return authHeader;
    } catch (error) {
      console.error('Error creating signature:', error);
      // Fallback to basic auth for now
      return `Basic ${btoa(`${accessKey}:${secretKey}`)}`;
    }
  }


  /**
   * Get assembly information from Onshape
   */
  getAssembly(credentials: OnshapeCredentials): Observable<OnshapeAssembly> {
    const urlData = this.parseAssemblyUrl(credentials.assemblyUrl);
    if (!urlData) {
      const error = 'Invalid Onshape assembly URL. Expected format: https://cad.onshape.com/documents/{documentId}/w/{workspaceId}/e/{elementId}';
      console.error('URL parsing failed:', { url: credentials.assemblyUrl, error });
      throw new Error(error);
    }

    const url = `${this.baseUrl}/assemblies/d/${urlData.documentId}/w/${urlData.workspaceId}/e/${urlData.assemblyId}`;
    const headers = this.createAuthHeaders(credentials, 'GET', url);

    console.log('Fetching assembly data...', { url, documentId: urlData.documentId, assemblyId: urlData.assemblyId });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        console.log('Assembly data received:', response);
        return this.mapAssemblyResponse(response, urlData.assemblyId);
      }),
      catchError(error => this.handleApiError('getAssembly', error, { url, urlData }))
    );
  }

  /**
   * Get parts from an assembly (extracted from assembly data)
   */
  getAssemblyParts(credentials: OnshapeCredentials): Observable<OnshapePart[]> {
    // Instead of making a separate API call, extract parts from the assembly data
    return this.getAssembly(credentials).pipe(
      map(assembly => {
        console.log('Extracting parts from assembly data...', assembly);
        return this.extractPartsFromAssembly(assembly);
      }),
      catchError(error => this.handleApiError('getAssemblyParts', error, { credentials }))
    );
  }

  /**
   * Extract parts from assembly occurrences
   */
  private extractPartsFromAssembly(assembly: OnshapeAssembly): OnshapePart[] {
    const parts: OnshapePart[] = [];
    
    if (assembly.elements) {
      assembly.elements.forEach(element => {
        parts.push({
          id: element.id,
          name: element.name,
          material: element.material,
          appearance: element.appearance,
          // Add bounding box if available from transform
          boundingBox: element.transform ? this.calculateBoundingBox(element.transform) : undefined
        });
      });
    }
    
    console.log('Extracted parts from assembly:', parts);
    return parts;
  }

  /**
   * Calculate bounding box from transform matrix (simplified)
   */
  private calculateBoundingBox(transform: number[]): { minCorner: number[]; maxCorner: number[] } | undefined {
    if (!transform || transform.length < 16) {
      return undefined;
    }
    
    // Extract translation from transform matrix (last 3 elements)
    const translation = [transform[12], transform[13], transform[14]];
    
    // Create a simple bounding box around the translation point
    const size = 0.1; // Default size
    return {
      minCorner: [translation[0] - size, translation[1] - size, translation[2] - size],
      maxCorner: [translation[0] + size, translation[1] + size, translation[2] + size]
    };
  }

  /**
   * Download STL file for a part
   */
  downloadStl(credentials: OnshapeCredentials, partId: string): Observable<Blob> {
    const urlData = this.parseAssemblyUrl(credentials.assemblyUrl);
    if (!urlData) {
      throw new Error('Invalid Onshape assembly URL');
    }

    const url = `${this.baseUrl}/parts/d/${urlData.documentId}/w/${urlData.workspaceId}/e/${partId}/stl`;
    const headers = this.createAuthHeaders(credentials, 'GET', url);

    console.log('Downloading STL for part...', { partId, url });

    return this.http.get(url, { 
      headers, 
      responseType: 'blob' 
    }).pipe(
      map(blob => {
        console.log('STL downloaded successfully:', { partId, size: blob.size });
        return blob;
      }),
      catchError(error => this.handleApiError('downloadStl', error, { partId, url, urlData }))
    );
  }

  /**
   * Get part metadata including bounding box
   */
  getPartMetadata(credentials: OnshapeCredentials, partId: string): Observable<any> {
    const urlData = this.parseAssemblyUrl(credentials.assemblyUrl);
    if (!urlData) {
      throw new Error('Invalid Onshape assembly URL');
    }

    const url = `${this.baseUrl}/parts/d/${urlData.documentId}/w/${urlData.workspaceId}/e/${partId}/metadata`;
    const headers = this.createAuthHeaders(credentials, 'GET', url);

    return this.http.get(url, { headers });
  }

  /**
   * Map Onshape API response to our assembly interface
   */
  private mapAssemblyResponse(response: any, assemblyId: string): OnshapeAssembly {
    console.log('Mapping assembly response:', response);
    
    // Extract occurrences from rootAssembly
    const occurrences = response.rootAssembly?.occurrences || [];
    
    return {
      id: assemblyId,
      name: response.name || 'Assembly',
      elements: occurrences.map((occurrence: any) => ({
        id: occurrence.path?.[0] || occurrence.id || `element_${Math.random()}`,
        name: occurrence.path?.[0] || `Element_${occurrence.id}`,
        type: 'Part',
        transform: occurrence.transform,
        material: occurrence.material?.name,
        appearance: occurrence.appearance?.name
      }))
    };
  }

  /**
   * Map Onshape API response to our parts interface
   */
  private mapPartsResponse(response: any): OnshapePart[] {
    return response.body?.map((part: any) => ({
      id: part.id,
      name: part.name || `Part_${part.id}`,
      material: part.material?.name,
      appearance: part.appearance?.name,
      boundingBox: part.boundingBox
    })) || [];
  }

  /**
   * Test API connection with credentials
   */
  testConnection(credentials: OnshapeCredentials): Observable<boolean> {
    // First validate credentials format
    if (!credentials.accessKey || !credentials.secretKey) {
      this.logger.error('Invalid credentials: missing access key or secret key', { 
        hasAccessKey: !!credentials.accessKey, 
        hasSecretKey: !!credentials.secretKey 
      }, 'testConnection');
      throw new Error('Invalid credentials: Access Key and Secret Key are required');
    }

    if (credentials.accessKey.length < 10 || credentials.secretKey.length < 10) {
      this.logger.error('Invalid credentials: keys too short', { 
        accessKeyLength: credentials.accessKey.length, 
        secretKeyLength: credentials.secretKey.length 
      }, 'testConnection');
      throw new Error('Invalid credentials: Access Key and Secret Key appear to be too short');
    }

    // Test signature generation first
    this.testSignatureGeneration(credentials);

    // Try the documents endpoint first as it's more likely to work
    const testUrl = `${this.baseUrl}/documents`;
    const headers = this.createAuthHeaders(credentials, 'GET', testUrl);
    
    this.logger.info('Testing Onshape API connection', { 
      testUrl, 
      hasAuth: !!headers.get('Authorization'),
      accessKeyPreview: credentials.accessKey.substring(0, 8) + '...',
      secretKeyLength: credentials.secretKey.length
    }, 'testConnection');
    
    return this.http.get(testUrl, { headers }).pipe(
      map((response: any) => {
        this.logger.info('API connection successful', response, 'testConnection');
        return true;
      }),
      catchError(error => {
        // If /documents fails, try /users/current as fallback
        if (error.status === 404 || error.status === 401) {
          this.logger.warn('Primary endpoint failed, trying fallback', { error: error.status }, 'testConnection');
          return this.testConnectionFallback(credentials);
        }
        return this.handleApiError('testConnection', error, { testUrl, credentials: { accessKey: credentials.accessKey.substring(0, 8) + '...' } });
      })
    );
  }

  /**
   * Test signature generation to verify it matches Python client approach
   */
  private testSignatureGeneration(credentials: OnshapeCredentials): void {
    const testUrl = `${this.baseUrl}/documents`;
    const testMethod = 'GET';
    const testNonce = 'testnonce123456789012345';
    const testDate = 'Mon, 01 Jan 2024 12:00:00 GMT';
    const testContentType = 'application/json';
    
    const signature = this.createSignature(testMethod, testUrl, testNonce, testDate, testContentType, credentials.accessKey, credentials.secretKey);
    
    console.log('=== SIGNATURE GENERATION TEST ===');
    console.log('Method:', testMethod);
    console.log('URL:', testUrl);
    console.log('Nonce:', testNonce);
    console.log('Date:', testDate);
    console.log('Content-Type:', testContentType);
    console.log('Access Key:', credentials.accessKey.substring(0, 8) + '...');
    console.log('Secret Key Length:', credentials.secretKey.length);
    console.log('Generated Signature:', signature);
    console.log('================================');
  }

  /**
   * Fallback connection test using sessioninfo endpoint
   */
  private testConnectionFallback(credentials: OnshapeCredentials): Observable<boolean> {
    const testUrl = `${this.baseUrl}/users/current`;
    const headers = this.createAuthHeaders(credentials, 'GET', testUrl);
    
    this.logger.info('Testing Onshape API connection (fallback)', { testUrl }, 'testConnectionFallback');
    
    return this.http.get(testUrl, { headers }).pipe(
      map((response: any) => {
        this.logger.info('API connection successful (fallback)', response, 'testConnectionFallback');
        return true;
      }),
      catchError(error => this.handleApiError('testConnectionFallback', error, { testUrl, credentials: { accessKey: credentials.accessKey.substring(0, 8) + '...' } }))
    );
  }

  /**
   * Handle API errors with detailed logging
   */
  private handleApiError(operation: string, error: HttpErrorResponse, context: any): Observable<never> {
    const errorInfo = {
      operation,
      context,
      timestamp: new Date().toISOString(),
      request: {
        url: error.url,
        method: 'GET', // We're only doing GET requests for now
        headers: context.headers || 'Not available'
      },
      response: {
        status: error.status,
        statusText: error.statusText,
        headers: error.headers ? this.headersToObject(error.headers) : 'Not available',
        body: error.error,
        message: error.message
      },
      fullError: error
    };
    
    this.logger.error(`API Error in ${operation}`, errorInfo, operation);

    // Create a very detailed error message
    let errorMessage = `❌ ${operation} failed with HTTP ${error.status}`;
    
    if (error.status === 401) {
      errorMessage = `❌ Authentication failed (HTTP 401)\n\n` +
        `• Check your Onshape API Access Key and Secret Key\n` +
        `• Ensure credentials are not expired\n` +
        `• Verify the API key has proper permissions\n\n` +
        `Request URL: ${error.url}\n` +
        `Response: ${JSON.stringify(error.error, null, 2)}`;
    } else if (error.status === 403) {
      errorMessage = `❌ Access forbidden (HTTP 403)\n\n` +
        `• Your API credentials may not have permission to access this assembly\n` +
        `• Check if the assembly is public or you have sharing permissions\n` +
        `• Verify the document/assembly exists and is accessible\n\n` +
        `Request URL: ${error.url}\n` +
        `Response: ${JSON.stringify(error.error, null, 2)}`;
    } else if (error.status === 404) {
      errorMessage = `❌ Not found (HTTP 404)\n\n` +
        `• Check the Onshape URL format: https://cad.onshape.com/documents/{documentId}/w/{workspaceId}/e/{elementId}\n` +
        `• Ensure the assembly exists and is not deleted\n` +
        `• Verify you have access to the document\n\n` +
        `Request URL: ${error.url}\n` +
        `Response: ${JSON.stringify(error.error, null, 2)}`;
    } else if (error.status === 429) {
      errorMessage = `❌ Rate limit exceeded (HTTP 429)\n\n` +
        `• Too many requests to Onshape API\n` +
        `• Wait a few minutes before trying again\n` +
        `• Consider upgrading your API plan if this persists\n\n` +
        `Request URL: ${error.url}\n` +
        `Response: ${JSON.stringify(error.error, null, 2)}`;
    } else if (error.status >= 500) {
      errorMessage = `❌ Server error (HTTP ${error.status})\n\n` +
        `• Onshape server is experiencing issues\n` +
        `• Try again in a few minutes\n` +
        `• Check Onshape status page for outages\n\n` +
        `Request URL: ${error.url}\n` +
        `Response: ${JSON.stringify(error.error, null, 2)}`;
    } else if (error.error && error.error.message) {
      errorMessage = `❌ API Error (HTTP ${error.status})\n\n` +
        `• ${error.error.message}\n\n` +
        `Request URL: ${error.url}\n` +
        `Full Response: ${JSON.stringify(error.error, null, 2)}`;
    } else if (error.status === 0 || error.message.includes('Unknown Error') || error.message.includes('Http failure response')) {
      errorMessage = `❌ CORS/Network Error (HTTP ${error.status})\n\n` +
        `• This is likely a CORS (Cross-Origin Resource Sharing) issue\n` +
        `• The proxy server may not be running on port 3001\n` +
        `• Start the proxy server: npm run proxy\n` +
        `• Check if the proxy server is accessible at http://localhost:3001/health\n` +
        `• Verify your internet connection\n\n` +
        `Request URL: ${error.url}\n` +
        `Response: ${JSON.stringify(error.error, null, 2)}\n\n` +
        `💡 Solution: Run 'npm run proxy' in a separate terminal to start the CORS proxy server.`;
    } else if (error.status === 200 && error.error && typeof error.error === 'object' && error.error.text && error.error.text.includes('<!doctype html>')) {
      errorMessage = `❌ Authentication Error (HTTP 200 - HTML Response)\n\n` +
        `• The API returned an HTML login page instead of JSON data\n` +
        `• This indicates authentication failed or the endpoint requires login\n` +
        `• Check your Onshape API Access Key and Secret Key\n` +
        `• Verify the credentials are correct and not expired\n` +
        `• Ensure the API key has proper permissions\n\n` +
        `Request URL: ${error.url}\n` +
        `Response Type: HTML (login page)\n` +
        `Response Preview: ${error.error.text.substring(0, 200)}...\n\n` +
        `💡 Solution: Verify your Onshape API credentials in the Onshape Developer Portal.`;
    } else if (error.message) {
      errorMessage = `❌ Network Error (HTTP ${error.status})\n\n` +
        `• ${error.message}\n` +
        `• Check your internet connection\n` +
        `• Verify Onshape API is accessible\n\n` +
        `Request URL: ${error.url}\n` +
        `Response: ${JSON.stringify(error.error, null, 2)}`;
    } else {
      errorMessage = `❌ Unknown error (HTTP ${error.status})\n\n` +
        `• Unexpected error occurred\n` +
        `• Check browser console for more details\n\n` +
        `Request URL: ${error.url}\n` +
        `Response: ${JSON.stringify(error.error, null, 2)}`;
    }

    // Create enhanced error with all details
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).details = errorInfo;
    (enhancedError as any).status = error.status;
    (enhancedError as any).url = error.url;
    (enhancedError as any).response = error.error;

    return throwError(() => enhancedError);
  }

  /**
   * Convert HttpHeaders to plain object for logging
   */
  private headersToObject(headers: any): any {
    const result: any = {};
    headers.keys().forEach((key: string) => {
      result[key] = headers.get(key);
    });
    return result;
  }
}
