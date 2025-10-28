import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Info, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import type { DASTScanResult } from '../../types/dastScan';

interface DastScanResultsProps {
  scanResult: DASTScanResult;
  className?: string;
}

const DastScanResults: React.FC<DastScanResultsProps> = ({ scanResult, className = '' }) => {
  const [expandedVulnerabilities, setExpandedVulnerabilities] = useState<Set<string>>(new Set());

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-black';
      case 'Low': return 'bg-green-500 text-white';
      case 'Info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'High': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'Medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'Low': return <Info className="w-4 h-4 text-green-500" />;
      case 'Info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const toggleVulnerability = (id: string) => {
    const newExpanded = new Set(expandedVulnerabilities);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedVulnerabilities(newExpanded);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-blue-500" />
              <div>
                <CardTitle className="text-lg">🔍 DAST Security Scan Results</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Scanned: {scanResult.url}
                </p>
              </div>
            </div>
            <Badge className={getRiskColor(scanResult.overallRisk)}>
              {scanResult.overallRisk}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-500">
                  {scanResult.vulnerabilities.filter(v => v.severity === 'Critical').length}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-500">
                  {scanResult.vulnerabilities.filter(v => v.severity === 'High').length}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">High</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-500">
                  {scanResult.vulnerabilities.filter(v => v.severity === 'Medium').length}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Medium</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {scanResult.technologies.length}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Technologies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatTime(scanResult.performance.loadTime)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Load Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatTime(scanResult.performance.domContentLoaded)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">DOM Ready</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {formatTime(scanResult.performance.firstContentfulPaint)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">First Paint</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {formatTime(scanResult.performance.largestContentfulPaint)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Largest Paint</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detected Technologies */}
      {scanResult.technologies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🛠️ Detected Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {scanResult.technologies.map((tech, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Headers */}
      <Card>
        <CardHeader>
          <CardTitle>🔒 Security Headers Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(scanResult.securityHeaders).map(([header, value]) => (
              <div key={header} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    {header.replace(/-/g, ' ').toUpperCase()}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300">
                    {value}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            ))}
            {Object.keys(scanResult.securityHeaders).length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No security headers detected
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilities */}
      {scanResult.vulnerabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Security Vulnerabilities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scanResult.vulnerabilities.map((vuln) => (
                <Collapsible key={vuln.id}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between p-4 h-auto"
                      onClick={() => toggleVulnerability(vuln.id)}
                    >
                      <div className="flex items-center space-x-3 text-left">
                        {getSeverityIcon(vuln.severity)}
                        <div>
                          <p className="font-medium">{vuln.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {vuln.category}
                          </p>
                        </div>
                      </div>
                      <Badge className={getRiskColor(vuln.severity)}>
                        {vuln.severity}
                      </Badge>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <Card className="ml-4">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Description:</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {vuln.description}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Evidence:</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {vuln.evidence}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Remediation:</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {vuln.remediation}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {vuln.cwe && (
                            <Badge variant="secondary" className="text-xs">
                              CWE: {vuln.cwe}
                            </Badge>
                          )}
                          {vuln.owasp && (
                            <Badge variant="secondary" className="text-xs">
                              OWASP: {vuln.owasp}
                            </Badge>
                          )}
                          {vuln.relatedCVEs && vuln.relatedCVEs.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              Related CVEs: {vuln.relatedCVEs.length}
                            </Badge>
                          )}
                        </div>
                        
                        {vuln.relatedCVEs && vuln.relatedCVEs.length > 0 && (
                          <div className="mt-3">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Related CVE IDs:</h4>
                            <div className="space-y-2">
                              {vuln.relatedCVEs.map((cve, cveIndex) => (
                                <div key={cveIndex} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-mono text-sm font-medium text-blue-800 dark:text-blue-200">
                                      {cve.cveId}
                                    </span>
                                    <Badge 
                                      className={`text-xs ${
                                        cve.severity === 'Critical' ? 'bg-red-500 text-white' :
                                        cve.severity === 'High' ? 'bg-orange-500 text-white' :
                                        cve.severity === 'Medium' ? 'bg-yellow-500 text-black' :
                                        'bg-green-500 text-white'
                                      }`}
                                    >
                                      {cve.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">
                                    {cve.description}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-blue-500 dark:text-blue-400">
                                    <span>Published: {new Date(cve.publishedDate).toLocaleDateString()}</span>
                                    <span>Source: {cve.source}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forms Analysis */}
      {scanResult.forms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📝 Forms Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scanResult.forms.map((form, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Form {index + 1}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Action:</p>
                      <p className="font-mono text-xs">{form.action || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Method:</p>
                      <p className="font-medium">{form.method}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-600 dark:text-gray-400">Input Fields:</p>
                    <p className="text-sm">{form.inputs.length} fields detected</p>
                  </div>
                  {form.vulnerabilities.length > 0 && (
                    <div className="mt-2">
                      <p className="text-red-600 dark:text-red-400 font-medium">Issues:</p>
                      <ul className="text-sm text-red-600 dark:text-red-400">
                        {form.vulnerabilities.map((vuln, idx) => (
                          <li key={idx}>• {vuln}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Scan Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Scan Time:</p>
              <p>{new Date(scanResult.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Redirects:</p>
              <p>{scanResult.redirects.length} redirects detected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DastScanResults;
