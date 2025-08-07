import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthAPI } from '../services/authAPI';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import Cookies from 'js-cookie';

const AuthDebugFixed = () => {
  const { user, isAuthenticated } = useAuth();
  const [apiTestResult, setApiTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [authHeaders, setAuthHeaders] = useState(null);
  const [cookieDebug, setCookieDebug] = useState(null);

  useEffect(() => {
    debugAuthState();
  }, [user]);

  const debugAuthState = () => {
    // Debug cookie state
    const rawCookie = Cookies.get('access_token');
    const allCookies = document.cookie;
    const headers = AuthAPI.getAuthHeaders();
    
    setCookieDebug({
      rawCookie,
      allCookies,
      cookieExists: !!rawCookie,
      cookieFormat: rawCookie ? (rawCookie.startsWith('Bearer ') ? 'Bearer format' : 'Raw token') : 'No cookie'
    });
    
    setAuthHeaders(headers);
    
    console.log('🔍 Auth Debug State:');
    console.log('Raw cookie:', rawCookie);
    console.log('All cookies:', allCookies);
    console.log('Auth headers:', headers);
    console.log('User:', user);
    console.log('Is authenticated:', isAuthenticated);
  };

  const testCalculatorAPIFixed = async () => {
    setTesting(true);
    setApiTestResult(null);

    try {
      // Enhanced header debugging
      const rawToken = Cookies.get('access_token');
      console.log('🔍 Raw token from cookie:', rawToken);
      
      let cleanToken = null;
      if (rawToken) {
        // Remove quotes and extract just the token part
        cleanToken = rawToken.replace(/"/g, '').replace('Bearer ', '');
        console.log('🔍 Clean token:', cleanToken);
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': cleanToken ? `Bearer ${cleanToken}` : '',
      };

      console.log('🔍 Headers being sent:', headers);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/analyze-hand`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          hole_cards: [
            { rank: "A", suit: "spades" },
            { rank: "K", suit: "hearts" }
          ],
          community_cards: [null, null, null, null, null],
          player_count: 2,
          simulation_iterations: 10000
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', [...response.headers.entries()]);

      if (response.ok) {
        const data = await response.json();
        setApiTestResult({
          success: true,
          data: data,
          status: response.status,
          message: 'API call successful!'
        });
      } else {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        
        let errorJson = {};
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          errorJson = { detail: errorText };
        }
        
        setApiTestResult({
          success: false,
          error: errorJson,
          status: response.status,
          message: `API call failed with status ${response.status}`
        });
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setApiTestResult({
        success: false,
        error: error.message,
        status: 'Network Error',
        message: 'Network error occurred'
      });
    } finally {
      setTesting(false);
    }
  };

  const testDirectTokenUsage = async () => {
    console.log('🧪 Testing direct token usage');
    
    // Get the raw cookie
    const rawCookie = Cookies.get('access_token');
    console.log('Raw cookie value:', rawCookie);
    
    if (!rawCookie) {
      alert('No access token found in cookies!');
      return;
    }
    
    // Extract token properly
    let token = rawCookie;
    if (token.startsWith('"Bearer ')) {
      token = token.slice(8, -1); // Remove "Bearer and trailing quote
    } else if (token.startsWith('Bearer ')) {
      token = token.slice(7); // Remove Bearer prefix
    }
    
    console.log('Extracted token:', token);
    
    // Test with curl-like request
    const testUrl = `${process.env.REACT_APP_BACKEND_URL}/api/auth/me`;
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Auth test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth test successful:', data);
        alert('Token is valid! User: ' + data.name);
      } else {
        const errorData = await response.text();
        console.log('Auth test failed:', errorData);
        alert('Token validation failed: ' + errorData);
      }
    } catch (error) {
      console.error('Auth test error:', error);
      alert('Auth test error: ' + error.message);
    }
  };

  const fixTokenAndRetry = async () => {
    console.log('🔧 Attempting to fix token format');
    
    const rawCookie = Cookies.get('access_token');
    if (!rawCookie) {
      alert('No token to fix!');
      return;
    }
    
    console.log('Original token:', rawCookie);
    
    // Try to clean up the token
    let cleanedToken = rawCookie;
    
    // Remove quotes if present
    if (cleanedToken.startsWith('"') && cleanedToken.endsWith('"')) {
      cleanedToken = cleanedToken.slice(1, -1);
    }
    
    // Make sure it has Bearer prefix
    if (!cleanedToken.startsWith('Bearer ')) {
      cleanedToken = `Bearer ${cleanedToken}`;
    }
    
    console.log('Cleaned token:', cleanedToken);
    
    // Update the cookie
    Cookies.set('access_token', cleanedToken, { 
      expires: 30,
      sameSite: 'lax'
    });
    
    alert('Token format fixed! Try the API call now.');
    
    // Refresh debug state
    debugAuthState();
  };

  return (
    <div className="space-y-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg max-w-4xl mx-auto">
      <h3 className="text-lg font-semibold">🔧 Enhanced Authentication Debug & Fix Panel</h3>
      
      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Authentication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Authenticated:</span>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "Yes" : "No"}
              </Badge>
            </div>
            
            {user && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Role:</span>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Subscription:</span>
                  <Badge variant={user.subscription_status === 'active' ? "default" : "secondary"}>
                    {user.subscription_status}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cookie Debug */}
      {cookieDebug && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cookie Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Cookie Exists:</span>
                <Badge variant={cookieDebug.cookieExists ? "default" : "destructive"}>
                  {cookieDebug.cookieExists ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Format:</span>
                <Badge variant="outline">{cookieDebug.cookieFormat}</Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-sm font-medium">Raw Cookie Value:</span>
              <code className="text-xs bg-gray-200 dark:bg-gray-800 p-2 rounded block break-all">
                {cookieDebug.rawCookie || 'No cookie found'}
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auth Headers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Authorization Headers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <span className="text-sm font-medium">Current Auth Headers:</span>
            <code className="text-xs bg-gray-200 dark:bg-gray-800 p-2 rounded block break-all">
              {JSON.stringify(authHeaders, null, 2)}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Button onClick={debugAuthState} variant="outline" size="sm">
          Refresh Debug
        </Button>
        
        <Button onClick={testDirectTokenUsage} variant="outline" size="sm">
          Test Token
        </Button>
        
        <Button onClick={fixTokenAndRetry} variant="outline" size="sm">
          Fix Token Format
        </Button>
        
        <Button 
          onClick={testCalculatorAPIFixed} 
          disabled={testing}
          variant={apiTestResult?.success ? "default" : "outline"}
          size="sm"
        >
          {testing ? "Testing..." : "Test Calculator API"}
        </Button>
      </div>

      {/* API Test Results */}
      {apiTestResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Calculator API Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={apiTestResult.success ? "default" : "destructive"}>
                  {apiTestResult.success ? "SUCCESS" : "FAILED"}
                </Badge>
                <span className="text-sm">Status: {apiTestResult.status}</span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {apiTestResult.message}
              </p>
              
              <code className="text-xs bg-gray-200 dark:bg-gray-800 p-2 rounded block break-all max-h-40 overflow-y-auto">
                {apiTestResult.success 
                  ? JSON.stringify(apiTestResult.data, null, 2)
                  : JSON.stringify(apiTestResult.error, null, 2)
                }
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold mb-2">🔍 Debugging Instructions</h4>
          <ol className="text-xs space-y-1 list-decimal list-inside">
            <li>Click "Refresh Debug" to check current auth state</li>
            <li>Click "Test Token" to validate your authentication token</li>
            <li>Click "Fix Token Format" if token format issues are detected</li>
            <li>Click "Test Calculator API" to test the actual analysis endpoint</li>
            <li>Check browser console for detailed debug information</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDebugFixed;