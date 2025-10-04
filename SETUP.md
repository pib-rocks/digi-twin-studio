# DigiTwin Studio Setup Guide

## CORS Issue Resolution

The application requires a CORS proxy server to communicate with the Onshape API due to browser security restrictions.

### Quick Start

1. **Start the CORS Proxy Server** (in a separate terminal):
   ```bash
   npm run proxy
   ```
   This will start the proxy server on `http://localhost:3001`

2. **Start the Angular Application** (in another terminal):
   ```bash
   npm start
   ```
   This will start the app on `http://localhost:4200`

3. **Open your browser** and go to `http://localhost:4200`

### What the Proxy Does

The proxy server:
- Runs on port 3001
- Forwards API requests to `https://cad.onshape.com`
- Adds CORS headers to allow browser requests
- Logs all API calls for debugging

### Troubleshooting

**If you see "CORS/Network Error (HTTP 0)":**
1. Make sure the proxy server is running: `npm run proxy`
2. Check the proxy health: `http://localhost:3001/health`
3. Verify both servers are running on different ports

**If the proxy server fails to start:**
1. Install dependencies: `npm install`
2. Check if port 3001 is available
3. Try a different port by editing `proxy-server.js`

### Development Mode

For development with auto-restart:
```bash
npm run proxy-dev  # Proxy with auto-restart
npm start          # Angular app
```

### API Endpoints

- **Proxy Health Check**: `http://localhost:3001/health`
- **Onshape API Proxy**: `http://localhost:3001/api/*`
- **Angular App**: `http://localhost:4200`

### Error Messages

The application now provides detailed error messages for:
- CORS issues (HTTP 0 errors)
- Authentication failures (HTTP 401)
- Permission errors (HTTP 403)
- Not found errors (HTTP 404)
- Rate limiting (HTTP 429)
- Server errors (HTTP 5xx)

All errors include:
- Detailed troubleshooting steps
- Full API request/response data
- Console logs for debugging
- Export functionality for logs

