const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

// Load secrets
let secrets = {};
try {
  secrets = JSON.parse(fs.readFileSync('secrets.json', 'utf8'));
  console.log('✅ Secrets loaded successfully');
  console.log('Access Key:', secrets.onshape?.accessKey?.substring(0, 8) + '...');
  console.log('Secret Key Length:', secrets.onshape?.secretKey?.length);
} catch (error) {
  console.log('⚠️  No secrets.json found, using example file');
  try {
    secrets = JSON.parse(fs.readFileSync('secrets.example.json', 'utf8'));
  } catch (e) {
    console.log('❌ No secrets file available');
  }
}

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4201'],
  credentials: true
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Proxy endpoint for Onshape API documents
app.get('/api/documents', async (req, res) => {
  try {
    console.log('🔍 ASSEMBLY PROXY REQUEST HANDLER TRIGGERED');
    console.log('Original request URL:', req.url);
    console.log('Request method:', req.method);
    
    // Build the target URL
    const targetUrl = `https://cad.onshape.com${req.url}`;
    console.log('Target URL:', targetUrl);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'DigiTwin-Studio-Proxy/1.0'
    };
    
    // Add authentication headers from secrets.json
    if (secrets.onshape && secrets.onshape.accessKey && secrets.onshape.secretKey) {
      const authHeader = `Basic ${Buffer.from(`${secrets.onshape.accessKey}:${secrets.onshape.secretKey}`).toString('base64')}`;
      headers['Authorization'] = authHeader;
      console.log('✅ Added authentication header from secrets.json');
      console.log('Access Key:', secrets.onshape.accessKey.substring(0, 8) + '...');
    } else {
      console.log('⚠️ No authentication credentials found in secrets.json');
    }
    
    console.log('Final headers being sent:', JSON.stringify(headers, null, 2));
    
    // Make the request to Onshape API
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers
    });
    
    console.log('Onshape API Response Status:', response.status);
    console.log('Onshape API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Get response body
    const responseText = await response.text();
    console.log('Response body preview:', responseText.substring(0, 200) + '...');
    
    // Set response headers
    res.status(response.status);
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.set('Content-Type', response.headers.get('content-type') || 'application/json');
    
    // Send response
    res.send(responseText);
    
  } catch (error) {
    console.error('Assembly Proxy Error:', error);
    res.status(500).json({
      error: 'Assembly Proxy Error',
      message: error.message,
      details: error.toString()
    });
  }
});

// Proxy endpoint for Onshape API assemblies
app.get('/api/assemblies/d/:documentId/w/:workspaceId/e/:elementId', async (req, res) => {
  try {
    console.log('🔍 ASSEMBLY PROXY REQUEST HANDLER TRIGGERED');
    console.log('Original request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Document ID:', req.params.documentId);
    console.log('Workspace ID:', req.params.workspaceId);
    console.log('Element ID:', req.params.elementId);
    
    // Build the target URL
    const targetUrl = `https://cad.onshape.com${req.url}`;
    console.log('Target URL:', targetUrl);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'DigiTwin-Studio-Proxy/1.0'
    };
    
    // Add authentication headers from secrets.json
    if (secrets.onshape && secrets.onshape.accessKey && secrets.onshape.secretKey) {
      const authHeader = `Basic ${Buffer.from(`${secrets.onshape.accessKey}:${secrets.onshape.secretKey}`).toString('base64')}`;
      headers['Authorization'] = authHeader;
      console.log('✅ Added authentication header from secrets.json');
      console.log('Access Key:', secrets.onshape.accessKey.substring(0, 8) + '...');
    } else {
      console.log('⚠️ No authentication credentials found in secrets.json');
    }
    
    console.log('Final headers being sent:', JSON.stringify(headers, null, 2));
    
    // Make the request to Onshape API
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers
    });
    
    console.log('Onshape API Response Status:', response.status);
    console.log('Onshape API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Get response body
    const responseText = await response.text();
    console.log('Response body preview:', responseText.substring(0, 200) + '...');
    
    // Set response headers
    res.status(response.status);
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.set('Content-Type', response.headers.get('content-type') || 'application/json');
    
    // Send response
    res.send(responseText);
    
  } catch (error) {
    console.error('Assembly Proxy Error:', error);
    res.status(500).json({
      error: 'Assembly Proxy Error',
      message: error.message,
      details: error.toString()
    });
  }
});

// Proxy endpoint for Onshape API assembly parts (alternative endpoint)
app.get('/api/assemblies/d/:documentId/w/:workspaceId/e/:elementId/parts', async (req, res) => {
  try {
    console.log('🔍 ASSEMBLY PARTS PROXY REQUEST HANDLER TRIGGERED');
    console.log('Original request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Document ID:', req.params.documentId);
    console.log('Workspace ID:', req.params.workspaceId);
    console.log('Element ID:', req.params.elementId);
    
    // Build the target URL
    const targetUrl = `https://cad.onshape.com${req.url}`;
    console.log('Target URL:', targetUrl);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'DigiTwin-Studio-Proxy/1.0'
    };
    
    // Add authentication headers from secrets.json
    if (secrets.onshape && secrets.onshape.accessKey && secrets.onshape.secretKey) {
      const authHeader = `Basic ${Buffer.from(`${secrets.onshape.accessKey}:${secrets.onshape.secretKey}`).toString('base64')}`;
      headers['Authorization'] = authHeader;
      console.log('✅ Added authentication header from secrets.json');
      console.log('Access Key:', secrets.onshape.accessKey.substring(0, 8) + '...');
    } else {
      console.log('⚠️ No authentication credentials found in secrets.json');
    }
    
    console.log('Final headers being sent:', JSON.stringify(headers, null, 2));
    
    // Make the request to Onshape API
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers
    });
    
    console.log('Onshape API Response Status:', response.status);
    console.log('Onshape API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Get response body
    const responseText = await response.text();
    console.log('Response body preview:', responseText.substring(0, 200) + '...');
    
    // Set response headers
    res.status(response.status);
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.set('Content-Type', response.headers.get('content-type') || 'application/json');
    
    // Send response
    res.send(responseText);
    
  } catch (error) {
    console.error('Assembly Parts Proxy Error:', error);
    res.status(500).json({
      error: 'Assembly Parts Proxy Error',
      message: error.message,
      details: error.toString()
    });
  }
});

// Proxy endpoint for Onshape API parts
app.get('/api/parts/d/:documentId/w/:workspaceId/e/:elementId/stl', async (req, res) => {
  try {
    console.log('🔍 PARTS STL PROXY REQUEST HANDLER TRIGGERED');
    console.log('Original request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Document ID:', req.params.documentId);
    console.log('Workspace ID:', req.params.workspaceId);
    console.log('Element ID:', req.params.elementId);
    
    // Build the target URL
    const targetUrl = `https://cad.onshape.com${req.url}`;
    console.log('Target URL:', targetUrl);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'DigiTwin-Studio-Proxy/1.0'
    };
    
    // Add authentication headers from secrets.json
    if (secrets.onshape && secrets.onshape.accessKey && secrets.onshape.secretKey) {
      const authHeader = `Basic ${Buffer.from(`${secrets.onshape.accessKey}:${secrets.onshape.secretKey}`).toString('base64')}`;
      headers['Authorization'] = authHeader;
      console.log('✅ Added authentication header from secrets.json');
      console.log('Access Key:', secrets.onshape.accessKey.substring(0, 8) + '...');
    } else {
      console.log('⚠️ No authentication credentials found in secrets.json');
    }
    
    console.log('Final headers being sent:', JSON.stringify(headers, null, 2));
    
    // Make the request to Onshape API
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers
    });
    
    console.log('Onshape API Response Status:', response.status);
    console.log('Onshape API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Get response body
    const responseText = await response.text();
    console.log('Response body preview:', responseText.substring(0, 200) + '...');
    
    // Set response headers
    res.status(response.status);
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.set('Content-Type', response.headers.get('content-type') || 'application/json');
    
    // Send response
    res.send(responseText);
    
  } catch (error) {
    console.error('Parts STL Proxy Error:', error);
    res.status(500).json({
      error: 'Parts STL Proxy Error',
      message: error.message,
      details: error.toString()
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint to verify proxy is working
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Proxy server is working',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Test endpoint to verify API proxy is working
app.get('/api-test', async (req, res) => {
  try {
    console.log('🧪 API TEST ENDPOINT CALLED');
    const targetUrl = 'https://cad.onshape.com/api/users/current';
    
    if (secrets.onshape && secrets.onshape.accessKey && secrets.onshape.secretKey) {
      const authHeader = `Basic ${Buffer.from(`${secrets.onshape.accessKey}:${secrets.onshape.secretKey}`).toString('base64')}`;
      
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'DigiTwin-Studio-Test/1.0'
        }
      });
      
      const responseText = await response.text();
      
      res.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        bodyPreview: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
        request: {
          url: targetUrl,
          method: 'GET',
          authHeader: authHeader.substring(0, 50) + '...'
        }
      });
    } else {
      res.status(500).json({
        error: 'No credentials found in secrets.json'
      });
    }
  } catch (error) {
    console.error('API test error:', error);
    res.status(500).json({
      error: 'API test failed',
      message: error.message
    });
  }
});

// Backend authentication functions
function generateNonce() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 25; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createSignature(method, url, nonce, authDate, contentType, accessKey, secretKey) {
  try {
    const urlObj = new URL(url);
    const urlPath = urlObj.pathname;
    const urlQuery = urlObj.search.substring(1);
    
    const stringToSign = [
      method.toLowerCase(),
      nonce.toLowerCase(),
      authDate.toLowerCase(),
      contentType.toLowerCase(),
      urlPath.toLowerCase(),
      urlQuery.toLowerCase()
    ].join('\n');
    
    const signature = crypto.createHmac('sha256', secretKey)
      .update(stringToSign)
      .digest('base64');
    
    return `On ${accessKey}:HmacSHA256:${signature}`;
  } catch (error) {
    console.error('Error creating signature:', error);
    return null;
  }
}

// Backend credentials endpoint
app.get('/backend-credentials', (req, res) => {
  // Reload secrets file to ensure we have the latest credentials
  try {
    const secretsPath = './secrets.json';
    console.log('🔍 Loading credentials for frontend...');
    
    const freshSecrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    console.log('✅ Credentials loaded successfully for frontend');
    
    res.json(freshSecrets);
  } catch (error) {
    console.log('❌ Failed to load credentials for frontend:', error.message);
    res.status(500).json({
      error: 'Failed to load credentials',
      message: error.message
    });
  }
});

// Backend test endpoint for Onshape API
app.get('/backend-test', async (req, res) => {
  // Reload secrets file to ensure we have the latest credentials
  try {
    const secretsPath = './secrets.json';
    console.log('🔍 Looking for secrets at:', secretsPath);
    console.log('🔍 Current working directory:', process.cwd());
    console.log('🔍 File exists:', fs.existsSync(secretsPath));
    
    secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    console.log('🔄 Secrets reloaded for backend test');
    console.log('🔍 Access Key:', secrets.onshape?.accessKey?.substring(0, 8) + '...');
    console.log('🔍 Secret Key Length:', secrets.onshape?.secretKey?.length);
  } catch (error) {
    console.log('❌ Failed to reload secrets:', error.message);
    console.log('❌ Error details:', error);
  }
  
  if (!secrets.onshape || !secrets.onshape.accessKey || !secrets.onshape.secretKey) {
    return res.status(400).json({
      error: 'No credentials configured',
      message: 'Please add your Onshape API credentials to secrets.json'
    });
  }

  const testUrl = 'https://cad.onshape.com/api/users/current';
  const method = 'GET';
  const authDate = new Date().toUTCString();
  const nonce = generateNonce();
  const contentType = 'application/json';
  
  const signature = createSignature(method, testUrl, nonce, authDate, contentType, 
    secrets.onshape.accessKey, secrets.onshape.secretKey);
  
  if (!signature) {
    return res.status(500).json({
      error: 'Failed to create signature'
    });
  }

  // Use Basic Authentication (confirmed working with Python tests)
  const headers = {
    'Authorization': `Basic ${Buffer.from(`${secrets.onshape.accessKey}:${secrets.onshape.secretKey}`).toString('base64')}`,
    'Content-Type': contentType,
    'Accept': 'application/json',
    'User-Agent': 'DigiTwin-Studio-Backend/1.0'
  };

  console.log('Backend test - Making request to Onshape API...');
  console.log('URL:', testUrl);
  console.log('Access Key:', secrets.onshape.accessKey.substring(0, 8) + '...');
  console.log('Secret Key Length:', secrets.onshape.secretKey.length);
  console.log('Headers:', JSON.stringify(headers, null, 2));

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(testUrl, { 
      method: 'GET',
      headers: headers
    });
    
    const responseText = await response.text();
    
    console.log('Onshape API Response Status:', response.status);
    console.log('Onshape API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
      bodyPreview: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
      request: {
        url: testUrl,
        method: method,
        headers: headers
      }
    });
  } catch (error) {
    console.error('Backend test error:', error);
    res.status(500).json({
      error: 'Request failed',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying Onshape API requests to https://cad.onshape.com`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
