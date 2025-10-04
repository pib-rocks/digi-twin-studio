# Backend Testing Setup

This guide helps you set up and test Onshape API authentication using backend-stored credentials.

## 🔐 Setup Your Credentials

### Option 1: Interactive Setup (Recommended)
```bash
npm run setup-secrets
```
This will guide you through entering your Onshape API credentials securely.

### Option 2: Manual Setup
1. Copy the example file:
   ```bash
   cp secrets.example.json secrets.json
   ```

2. Edit `secrets.json` with your actual credentials:
   ```json
   {
     "onshape": {
       "accessKey": "YOUR_ACTUAL_ACCESS_KEY",
       "secretKey": "YOUR_ACTUAL_SECRET_KEY",
       "testAssemblyUrl": "https://cad.onshape.com/documents/YOUR_DOCUMENT_ID/w/YOUR_WORKSPACE_ID/e/YOUR_ELEMENT_ID"
     }
   }
   ```

## 🧪 Test Backend Authentication

### 1. Start the Proxy Server
```bash
npm run proxy
```

### 2. Test Backend Authentication
```bash
npm run backend-test
```

Or visit: `http://localhost:3001/backend-test`

### 3. Expected Results

**✅ Success Response:**
```json
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "headers": { ... },
  "body": "[{\"id\":\"...\",\"name\":\"...\"}]",
  "request": { ... }
}
```

**❌ Authentication Error:**
```json
{
  "success": false,
  "status": 401,
  "statusText": "Unauthorized",
  "headers": { ... },
  "body": "{\"error\":\"Invalid credentials\"}",
  "request": { ... }
}
```

## 🔍 Debugging

### Check Proxy Server Logs
The proxy server will log detailed information:
- Request headers being sent to Onshape
- Response status and headers
- Any errors during signature generation

### Common Issues

1. **Empty Credentials**: Make sure `secrets.json` contains your actual API keys
2. **Invalid Keys**: Verify your keys in the Onshape Developer Portal
3. **Wrong Format**: Ensure keys are not truncated or have extra spaces

## 🛡️ Security Notes

- `secrets.json` is automatically ignored by git
- Never commit your actual API credentials
- Use this only for development/testing
- For production, use environment variables or secure key management

## 📊 What This Tests

The backend test verifies:
- ✅ Request signature generation
- ✅ HMAC-SHA256 hashing
- ✅ Header formatting
- ✅ Direct communication with Onshape API
- ✅ Credential validation

This helps isolate whether authentication issues are:
- Frontend signature generation problems
- Credential validity issues
- Network/proxy problems
- Onshape API endpoint issues

