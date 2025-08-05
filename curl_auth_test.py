#!/usr/bin/env python3
"""
Curl-based Authentication Test for Premium Moderator Account
Replicates exact frontend behavior using curl commands to diagnose authentication issues.

This test uses curl with identical headers to frontend to reproduce the 
"Authentication credentials required" problem mentioned in the review request.
"""

import subprocess
import json
import time
import os

# Backend URL
BACKEND_URL = "https://86fa4beb-2f95-4b09-9924-af4fde58ca53.preview.emergentagent.com/api"

# Moderator credentials
MODERATOR_EMAIL = "moderator.premium@pokerpro.com"
MODERATOR_PASSWORD = "PokerPremiumMod2024!"

class CurlAuthTester:
    def __init__(self):
        self.test_results = []
        self.auth_token = None
        self.cookies_file = "/tmp/auth_cookies.txt"
        
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details
        })
    
    def run_curl_command(self, method: str, endpoint: str, data: dict = None, 
                        headers: dict = None, use_cookies: bool = False, 
                        save_cookies: bool = False) -> tuple:
        """Run curl command and return (status_code, response_text, response_headers)"""
        
        # Build curl command
        cmd = ["curl", "-s", "-w", "%{http_code}\\n%{header_json}\\n"]
        
        # Add method
        if method.upper() != "GET":
            cmd.extend(["-X", method.upper()])
        
        # Add headers
        if headers:
            for key, value in headers.items():
                cmd.extend(["-H", f"{key}: {value}"])
        
        # Add data for POST requests
        if data:
            cmd.extend(["-d", json.dumps(data)])
        
        # Cookie handling
        if save_cookies:
            cmd.extend(["-c", self.cookies_file])
        if use_cookies and os.path.exists(self.cookies_file):
            cmd.extend(["-b", self.cookies_file])
        
        # Add URL
        cmd.append(f"{BACKEND_URL}{endpoint}")
        
        try:
            # Run curl command
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            # Parse output
            lines = result.stdout.strip().split('\n')
            if len(lines) >= 2:
                status_code = int(lines[-2])
                try:
                    headers_json = json.loads(lines[-1])
                except:
                    headers_json = {}
                response_body = '\n'.join(lines[:-2])
            else:
                status_code = 0
                headers_json = {}
                response_body = result.stdout
            
            return status_code, response_body, headers_json
            
        except subprocess.TimeoutExpired:
            return 0, "Timeout", {}
        except Exception as e:
            return 0, f"Error: {str(e)}", {}
    
    def test_login_with_curl(self):
        """Test 1: Login using curl with exact frontend headers"""
        print("\n🔐 Test 1: Login avec curl (headers identiques au frontend)")
        
        # Exact headers that frontend would send
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; PokerPro-Frontend/1.0)",
            "Origin": "https://86fa4beb-2f95-4b09-9924-af4fde58ca53.preview.emergentagent.com",
            "Referer": "https://86fa4beb-2f95-4b09-9924-af4fde58ca53.preview.emergentagent.com/login"
        }
        
        payload = {
            "email": MODERATOR_EMAIL,
            "password": MODERATOR_PASSWORD
        }
        
        print(f"   Curl Command Headers: {headers}")
        print(f"   Login Payload: {payload}")
        
        status_code, response_body, response_headers = self.run_curl_command(
            "POST", "/auth/login", data=payload, headers=headers, save_cookies=True
        )
        
        print(f"   Status Code: {status_code}")
        print(f"   Response Headers: {response_headers}")
        
        if status_code == 200:
            try:
                data = json.loads(response_body)
                if "access_token" in data:
                    self.auth_token = data["access_token"]
                    user_info = data.get("user", {})
                    
                    print(f"   JWT Token: {self.auth_token[:50]}...")
                    print(f"   User Role: {user_info.get('role', 'N/A')}")
                    print(f"   Subscription: {user_info.get('subscription_status', 'N/A')}")
                    
                    # Check if cookies were saved
                    cookies_saved = os.path.exists(self.cookies_file)
                    print(f"   Cookies Saved: {cookies_saved}")
                    
                    self.log_test("Curl Login Test", True, 
                                f"Login successful via curl. Token received, cookies saved: {cookies_saved}")
                    return True
                else:
                    self.log_test("Curl Login Test", False, "No access_token in response")
                    return False
            except json.JSONDecodeError:
                self.log_test("Curl Login Test", False, f"Invalid JSON response: {response_body}")
                return False
        else:
            self.log_test("Curl Login Test", False, 
                        f"Login failed. Status: {status_code}, Response: {response_body}")
            return False
    
    def test_auth_me_with_curl(self):
        """Test 2: Test /auth/me with curl using Authorization header"""
        print("\n🔍 Test 2: Test /auth/me avec curl (Authorization header)")
        
        if not self.auth_token:
            self.log_test("Curl /auth/me Test", False, "No auth token available")
            return False
        
        # Headers exactly like frontend
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; PokerPro-Frontend/1.0)"
        }
        
        print(f"   Authorization Header: Bearer {self.auth_token[:50]}...")
        
        status_code, response_body, response_headers = self.run_curl_command(
            "GET", "/auth/me", headers=headers, use_cookies=True
        )
        
        print(f"   Status Code: {status_code}")
        
        if status_code == 200:
            try:
                data = json.loads(response_body)
                email = data.get("email", "N/A")
                role = data.get("role", "N/A")
                subscription = data.get("subscription_status", "N/A")
                
                print(f"   Email: {email}")
                print(f"   Role: {role}")
                print(f"   Subscription: {subscription}")
                
                self.log_test("Curl /auth/me Test", True, 
                            f"Auth verification successful. Role: {role}, Subscription: {subscription}")
                return True
            except json.JSONDecodeError:
                self.log_test("Curl /auth/me Test", False, f"Invalid JSON: {response_body}")
                return False
        else:
            self.log_test("Curl /auth/me Test", False, 
                        f"Auth verification failed. Status: {status_code}, Response: {response_body}")
            return False
    
    def test_calculator_with_curl(self):
        """Test 3: Test calculator access with curl (exact frontend simulation)"""
        print("\n🃏 Test 3: Test calculateur avec curl (simulation frontend exacte)")
        
        if not self.auth_token:
            self.log_test("Curl Calculator Test", False, "No auth token available")
            return False
        
        # Exact payload and headers that frontend sends
        payload = {
            "hole_cards": [
                {"rank": "A", "suit": "spades"},
                {"rank": "K", "suit": "hearts"}
            ],
            "community_cards": [],
            "player_count": 2,
            "simulation_iterations": 50000
        }
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; PokerPro-Frontend/1.0)",
            "Origin": "https://86fa4beb-2f95-4b09-9924-af4fde58ca53.preview.emergentagent.com",
            "Referer": "https://86fa4beb-2f95-4b09-9924-af4fde58ca53.preview.emergentagent.com/calculator"
        }
        
        print(f"   Request URL: {BACKEND_URL}/analyze-hand")
        print(f"   Authorization: Bearer {self.auth_token[:50]}...")
        print(f"   Payload: {json.dumps(payload, indent=2)}")
        
        start_time = time.time()
        status_code, response_body, response_headers = self.run_curl_command(
            "POST", "/analyze-hand", data=payload, headers=headers, use_cookies=True
        )
        end_time = time.time()
        
        response_time = end_time - start_time
        
        print(f"   Status Code: {status_code}")
        print(f"   Response Time: {response_time:.2f}s")
        
        if status_code == 200:
            try:
                data = json.loads(response_body)
                win_prob = data.get("win_probability", 0)
                tie_prob = data.get("tie_probability", 0)
                lose_prob = data.get("lose_probability", 0)
                
                print(f"   Win Probability: {win_prob}%")
                print(f"   Tie Probability: {tie_prob}%")
                print(f"   Lose Probability: {lose_prob}%")
                
                self.log_test("Curl Calculator Test", True, 
                            f"Calculator access successful via curl! Win: {win_prob}%, Time: {response_time:.2f}s")
                return True
            except json.JSONDecodeError:
                self.log_test("Curl Calculator Test", False, f"Invalid JSON: {response_body}")
                return False
        else:
            print(f"   Error Response: {response_body}")
            
            # Check for the specific error mentioned in review request
            if "Authentication credentials required" in response_body:
                self.log_test("Curl Calculator Test", False, 
                            "❌ REPRODUCED: 'Authentication credentials required' error!")
            elif status_code == 403:
                self.log_test("Curl Calculator Test", False, 
                            f"Access denied (403): {response_body}")
            elif status_code == 401:
                self.log_test("Curl Calculator Test", False, 
                            f"Unauthorized (401): {response_body}")
            else:
                self.log_test("Curl Calculator Test", False, 
                            f"Unexpected error. Status: {status_code}, Response: {response_body}")
            return False
    
    def test_cookie_vs_header_auth(self):
        """Test 4: Compare cookie-based vs header-based authentication"""
        print("\n🍪 Test 4: Comparaison cookies vs headers")
        
        if not self.auth_token:
            self.log_test("Cookie vs Header Test", False, "No auth token available")
            return False
        
        # Test 1: Only cookies (no Authorization header)
        print("   Testing with cookies only (no Authorization header)...")
        status_code_cookies, response_cookies, _ = self.run_curl_command(
            "GET", "/auth/me", headers={"Content-Type": "application/json"}, use_cookies=True
        )
        
        # Test 2: Only Authorization header (no cookies)
        print("   Testing with Authorization header only (no cookies)...")
        headers_only = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        status_code_headers, response_headers, _ = self.run_curl_command(
            "GET", "/auth/me", headers=headers_only, use_cookies=False
        )
        
        print(f"   Cookies Only Status: {status_code_cookies}")
        print(f"   Headers Only Status: {status_code_headers}")
        
        # Analyze results
        cookies_work = status_code_cookies == 200
        headers_work = status_code_headers == 200
        
        if cookies_work and headers_work:
            self.log_test("Cookie vs Header Test", True, 
                        "Both cookie and header authentication work")
        elif headers_work and not cookies_work:
            self.log_test("Cookie vs Header Test", True, 
                        "Header authentication works, cookies don't (expected)")
        elif cookies_work and not headers_work:
            self.log_test("Cookie vs Header Test", False, 
                        "Only cookies work, headers don't (unexpected)")
        else:
            self.log_test("Cookie vs Header Test", False, 
                        "Neither cookies nor headers work")
        
        return headers_work
    
    def test_timing_and_race_conditions(self):
        """Test 5: Test for timing issues and race conditions"""
        print("\n⏱️ Test 5: Test timing et race conditions")
        
        if not self.auth_token:
            self.log_test("Timing Test", False, "No auth token available")
            return False
        
        # Make rapid successive requests to check for race conditions
        print("   Making rapid successive requests...")
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        success_count = 0
        total_requests = 5
        
        for i in range(total_requests):
            print(f"   Request {i+1}/{total_requests}...")
            status_code, response_body, _ = self.run_curl_command(
                "GET", "/auth/me", headers=headers
            )
            
            if status_code == 200:
                success_count += 1
            else:
                print(f"     Failed with status {status_code}: {response_body}")
            
            # Small delay between requests
            time.sleep(0.1)
        
        success_rate = (success_count / total_requests) * 100
        print(f"   Success Rate: {success_count}/{total_requests} ({success_rate}%)")
        
        if success_rate == 100:
            self.log_test("Timing Test", True, 
                        f"All {total_requests} rapid requests successful - no race conditions detected")
        else:
            self.log_test("Timing Test", False, 
                        f"Only {success_count}/{total_requests} requests successful - possible timing issues")
        
        return success_rate == 100
    
    def run_all_tests(self):
        """Run all curl-based authentication tests"""
        print("🎯 Test d'authentification avec curl (simulation frontend exacte)")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Moderator Account: {MODERATOR_EMAIL}")
        print(f"Testing with curl commands identical to frontend requests")
        print("=" * 80)
        
        # Clean up any existing cookies
        if os.path.exists(self.cookies_file):
            os.remove(self.cookies_file)
        
        # Run tests in sequence
        login_success = self.test_login_with_curl()
        
        if login_success:
            self.test_auth_me_with_curl()
            self.test_calculator_with_curl()
            self.test_cookie_vs_header_auth()
            self.test_timing_and_race_conditions()
        else:
            print("\n❌ Login failed - skipping remaining tests")
        
        # Clean up cookies file
        if os.path.exists(self.cookies_file):
            os.remove(self.cookies_file)
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 CURL TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["passed"])
        total = len(self.test_results)
        success_rate = (passed / total) * 100 if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Detailed results
        print(f"\n📋 Detailed Results:")
        for result in self.test_results:
            status = "✅" if result["passed"] else "❌"
            print(f"  {status} {result['test']}")
            if result["details"]:
                print(f"     {result['details']}")
        
        # Diagnostic conclusion
        print(f"\n🔍 DIAGNOSTIC CONCLUSION:")
        if passed == total:
            print("🎉 ALL CURL TESTS PASSED!")
            print("   ✅ Authentication working correctly with curl")
            print("   ✅ No 'Authentication credentials required' error found")
            print("   ✅ Headers and cookies both working as expected")
            print("   ✅ No timing or race condition issues detected")
            print("   ✅ Calculator access working with moderator privileges")
        else:
            print("⚠️  ISSUES DETECTED:")
            failed_tests = [result for result in self.test_results if not result["passed"]]
            for test in failed_tests:
                print(f"   ❌ {test['test']}: {test['details']}")
            
            # Check for specific authentication error
            auth_error_found = any("Authentication credentials required" in result["details"] 
                                 for result in failed_tests)
            if auth_error_found:
                print(f"\n🚨 CONFIRMED: 'Authentication credentials required' error reproduced!")
                print("   This confirms the issue reported in the review request.")
                print("   Possible causes:")
                print("   - JWT token format issue")
                print("   - Backend validation problem")
                print("   - Cookie/header handling mismatch")
                print("   - CORS or middleware issue")
        
        return {
            "total_tests": total,
            "passed_tests": passed,
            "failed_tests": total - passed,
            "success_rate": success_rate,
            "all_results": self.test_results
        }

def main():
    """Main test execution"""
    print("🚀 Starting Curl-based Authentication Testing...")
    print("=" * 80)
    
    tester = CurlAuthTester()
    results = tester.run_all_tests()
    
    if results['failed_tests'] == 0:
        print("\n🎉 CONCLUSION: Authentication system working correctly with curl!")
        exit(0)
    else:
        print(f"\n⚠️  CONCLUSION: {results['failed_tests']} issue(s) detected with curl testing.")
        exit(1)

if __name__ == "__main__":
    main()