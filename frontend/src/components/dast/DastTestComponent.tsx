import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Shield } from 'lucide-react';
import DastScanResults from './DastScanResults';
import dastApi from '../../api/dast';
import type { DASTScanResult } from '../../types/dastScan';

const DastTestComponent: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DASTScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to scan');
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanResult(null);

    try {const response = await dastApi.scanUrl({ url: url.trim() });
      
      if (response.status === 'success' && response.data) {setScanResult(response.data);
      } else {setError(response.message || 'DAST scan failed');
      }
    } catch (err) {setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsScanning(false);
    }
  };

  const handleTestUrls = () => {
    const testUrls = [
      'https://example.com',
      'https://httpbin.org',
      'https://httpstat.us',
      'https://www.google.com'
    ];
    
    // Pick a random test URL
    const randomUrl = testUrls[Math.floor(Math.random() * testUrls.length)];
    setUrl(randomUrl);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span>🔍 DAST Security Scanner Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="url"
              placeholder="Enter URL to scan (e.g., https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              disabled={isScanning}
            />
            <Button
              onClick={handleTestUrls}
              variant="outline"
              disabled={isScanning}
            >
              Test URL
            </Button>
            <Button
              onClick={handleScan}
              disabled={isScanning || !url.trim()}
              className="min-w-[120px]"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Scan
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isScanning && (
            <Alert>
              <Loader2 className="w-4 h-4 animate-spin" />
              <AlertDescription>
                Scanning {url} for security vulnerabilities... This may take 30-60 seconds.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {scanResult && (
        <DastScanResults scanResult={scanResult} />
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 How to Test DAST Scanning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              1. **Direct URL Scanning:**
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter any URL in the input field above and click "Scan" to test the DAST functionality.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              2. **Chat Integration Testing:**
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Go to the main chat interface and type: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">"Scan https://example.com for vulnerabilities"</code>
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              3. **Test URLs to Try:**
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">https://example.com</code> - Basic website</li>
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">https://httpbin.org</code> - HTTP testing service</li>
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">https://www.google.com</code> - Well-secured site</li>
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">https://httpstat.us</code> - Status code testing</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              4. **What Gets Scanned:**
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Security headers (HSTS, CSP, X-Frame-Options)</li>
              <li>• Mixed content detection</li>
              <li>• Form security analysis</li>
              <li>• Cookie security assessment</li>
              <li>• XSS and SQL injection patterns</li>
              <li>• Technology stack detection</li>
              <li>• Performance metrics</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DastTestComponent;
