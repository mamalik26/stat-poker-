import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthAPI } from '../services/authAPI';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import Cookies from 'js-cookie';

const AuthDebug = () => {
  const { user, isAuthenticated } = useAuth();
  const [apiTestResult, setApiTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const testCalculatorAPI = async () => {
    setTesting(true);
    setApiTestResult(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...AuthAPI.getAuthHeaders()
      };

      console.log('🔍 Headers being sent:', headers);
      console.log('🍪 Raw cookie:', Cookies.get('access_token'));

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
          status: response.status
        });
      } else {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        setApiTestResult({
          success: false,
          error: errorText,
          status: response.status
        });
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setApiTestResult({
        success: false,
        error: error.message,
        status: 'Network Error'
      });
    } finally {
      setTesting(false);
    }
  };

  const testAuthStatus = async () => {
    const result = await AuthAPI.getCurrentUser();
    console.log('👤 Auth status test:', result);
    return result;
  };

  return (
    <div className="space-y-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
      <h3 className="text-lg font-semibold">🔧 Authentication Debug Panel</h3>
      
      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Authentication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
          
          <Button onClick={testAuthStatus} size="sm">
            Test Auth Status
          </Button>
        </CardContent>
      </Card>

      {/* Token Debug */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Token Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <span className="text-sm font-medium">Raw Cookie:</span>
            <code className="text-xs bg-gray-200 dark:bg-gray-800 p-2 rounded block break-all">
              {Cookies.get('access_token') || 'No token found'}
            </code>
          </div>
          
          <div className="space-y-1">
            <span className="text-sm font-medium">Auth Headers:</span>
            <code className="text-xs bg-gray-200 dark:bg-gray-800 p-2 rounded block break-all">
              {JSON.stringify(AuthAPI.getAuthHeaders(), null, 2)}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* API Test */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Calculator API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            onClick={testCalculatorAPI} 
            disabled={testing}
            variant={apiTestResult?.success ? "default" : "outline"}
          >
            {testing ? "Testing..." : "Test Calculator API"}
          </Button>
          
          {apiTestResult && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={apiTestResult.success ? "default" : "destructive"}>
                  {apiTestResult.success ? "SUCCESS" : "FAILED"}
                </Badge>
                <span className="text-sm">Status: {apiTestResult.status}</span>
              </div>
              
              <code className="text-xs bg-gray-200 dark:bg-gray-800 p-2 rounded block break-all max-h-40 overflow-y-auto">
                {apiTestResult.success 
                  ? JSON.stringify(apiTestResult.data, null, 2)
                  : apiTestResult.error
                }
              </code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDebug;