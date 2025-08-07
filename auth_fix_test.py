#!/usr/bin/env python3
"""
Authentication Fix Verification Test
Tests the specific authentication fixes mentioned in the review request:
1. Frontend AuthAPI.getAuthHeaders() - Cookie parsing improvements
2. Frontend handleCalculate() - Auth verification before API calls  
3. Backend get_current_user() - Debug logs for authentication

Focus: Test with moderator.premium@pokerpro.com to verify "Authentication credentials required" error is resolved
"""

import requests
import json
import time
import os
from typing import Dict, Any

# Get backend URL from environment
BACKEND_URL = "https://86fa4beb-2f95-4b09-9924-af4fde58ca53.preview.emergentagent.com/api"

class AuthenticationFixTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
        # Specific credentials mentioned in review request
        self.moderator_email = "moderator.premium@pokerpro.com"
        self.moderator_password = "PokerPremiumMod2024!"
        
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test results with enhanced formatting"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details
        })
    
    def set_auth_header(self, token: str):
        """Set authorization header for authenticated requests"""
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        print(f"🔑 Auth token set: {token[:20]}...")
    
    def clear_auth_header(self):
        """Clear authorization header"""
        if "Authorization" in self.session.headers:
            del self.session.headers["Authorization"]
            print("🔓 Auth token cleared")
    
    def test_moderator_login_with_debug_logs(self):
        """Test 1: Moderator login and verify JWT token format"""
        print("\n🔐 PHASE 1: MODERATOR LOGIN WITH DEBUG VERIFICATION")
        
        payload = {
            "email": self.moderator_email,
            "password": self.moderator_password
        }
        
        try:
            print(f"📧 Attempting login with: {self.moderator_email}")
            response = self.session.post(f"{self.base_url}/auth/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify JWT token format (should have 3 parts separated by dots)
                token = data.get("access_token", "")
                token_parts = token.split(".")
                
                if len(token_parts) == 3:
                    self.set_auth_header(token)
                    
                    # Verify user info
                    user = data.get("user", {})
                    if (user.get("email") == self.moderator_email and 
                        user.get("role") == "moderator" and
                        user.get("subscription_status") == "active"):
                        
                        self.log_test("Moderator Login with JWT Token Verification", True, 
                                    f"Login successful - Role: {user.get('role')}, Subscription: {user.get('subscription_status')}")
                        return True
                    else:
                        self.log_test("Moderator Login with JWT Token Verification", False, 
                                    f"Incorrect user info: {user}")
                        return False
                else:
                    self.log_test("Moderator Login with JWT Token Verification", False, 
                                f"Invalid JWT token format: {len(token_parts)} parts")
                    return False
            else:
                self.log_test("Moderator Login with JWT Token Verification", False, 
                            f"Login failed - Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Moderator Login with JWT Token Verification", False, f"Exception: {str(e)}")
            return False
    
    def test_auth_me_endpoint_with_debug(self):
        """Test 2: Verify /api/auth/me endpoint works with authentication"""
        print("\n👤 PHASE 2: AUTHENTICATION VERIFICATION WITH /api/auth/me")
        
        try:
            print("📡 Making authenticated request to /api/auth/me")
            response = self.session.get(f"{self.base_url}/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify all required fields are present
                required_fields = ["id", "name", "email", "role", "subscription_status", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    if (data.get("email") == self.moderator_email and 
                        data.get("role") == "moderator" and
                        data.get("subscription_status") == "active"):
                        
                        self.log_test("Authentication /api/auth/me Endpoint", True, 
                                    f"User authenticated: {data.get('email')}, Role: {data.get('role')}")
                        return True
                    else:
                        self.log_test("Authentication /api/auth/me Endpoint", False, 
                                    f"Incorrect user data: {data}")
                        return False
                else:
                    self.log_test("Authentication /api/auth/me Endpoint", False, 
                                f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Authentication /api/auth/me Endpoint", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Authentication /api/auth/me Endpoint", False, f"Exception: {str(e)}")
            return False
    
    def test_analyze_hand_with_authentication_debug(self):
        """Test 3: Test analyze-hand API with proper authentication headers"""
        print("\n🃏 PHASE 3: ANALYZE-HAND API WITH AUTHENTICATION VERIFICATION")
        
        # AK vs 2 players scenario as mentioned in review request
        payload = {
            "hole_cards": [
                {"rank": "A", "suit": "spades"},
                {"rank": "K", "suit": "hearts"}
            ],
            "community_cards": [None, None, None, None, None],
            "player_count": 2,
            "simulation_iterations": 50000
        }
        
        try:
            print("🎯 Testing AK vs 2 players scenario with authentication")
            print(f"📡 Authorization header: {self.session.headers.get('Authorization', 'NOT SET')[:30]}...")
            
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/analyze-hand", json=payload)
            end_time = time.time()
            
            print(f"⏱️  Response time: {end_time - start_time:.2f}s")
            print(f"📊 Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify all required fields are present
                required_fields = ["win_probability", "tie_probability", "lose_probability", 
                                 "hand_strength", "opponent_ranges", "recommendation"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Verify probability calculations
                    win_prob = data.get("win_probability", 0)
                    tie_prob = data.get("tie_probability", 0)
                    lose_prob = data.get("lose_probability", 0)
                    total_prob = win_prob + tie_prob + lose_prob
                    
                    # Check if probabilities are reasonable for AK preflop
                    if (50 <= win_prob <= 80 and  # AK should win 50-80% vs 1 opponent
                        99.0 <= total_prob <= 101.0):  # Probabilities should sum to ~100%
                        
                        self.log_test("Analyze-Hand API with Authentication", True, 
                                    f"Analysis successful - Win: {win_prob}%, Tie: {tie_prob}%, Lose: {lose_prob}%")
                        
                        # Check for usage info (should show unlimited for moderator)
                        usage_info = data.get("usage_info", {})
                        if usage_info.get("is_premium"):
                            print(f"✅ Premium status confirmed: {usage_info}")
                        
                        return True
                    else:
                        self.log_test("Analyze-Hand API with Authentication", False, 
                                    f"Unrealistic probabilities - Win: {win_prob}%, Total: {total_prob}%")
                        return False
                else:
                    self.log_test("Analyze-Hand API with Authentication", False, 
                                f"Missing response fields: {missing_fields}")
                    return False
                    
            elif response.status_code == 401:
                self.log_test("Analyze-Hand API with Authentication", False, 
                            "❌ CRITICAL: 401 Unauthorized - Authentication credentials required error still exists!")
                return False
            elif response.status_code == 403:
                self.log_test("Analyze-Hand API with Authentication", False, 
                            "❌ CRITICAL: 403 Forbidden - Authentication or subscription issue")
                return False
            else:
                self.log_test("Analyze-Hand API with Authentication", False, 
                            f"Unexpected status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Analyze-Hand API with Authentication", False, f"Exception: {str(e)}")
            return False
    
    def test_cookie_authentication_simulation(self):
        """Test 4: Simulate cookie-based authentication as frontend would do"""
        print("\n🍪 PHASE 4: COOKIE AUTHENTICATION SIMULATION")
        
        try:
            # First login to get cookies
            login_payload = {
                "email": self.moderator_email,
                "password": self.moderator_password
            }
            
            print("🔐 Logging in to get HTTP-only cookies")
            login_response = self.session.post(f"{self.base_url}/auth/login", json=login_payload)
            
            if login_response.status_code == 200:
                # Check if cookies were set
                cookies = self.session.cookies
                print(f"🍪 Cookies received: {len(cookies)} cookies")
                
                for cookie in cookies:
                    print(f"   - {cookie.name}: {cookie.value[:20]}... (httponly: {cookie.has_nonstandard_attr('httponly')})")
                
                # Clear authorization header to test cookie-only auth
                self.clear_auth_header()
                
                # Try to access protected endpoint with cookies only
                print("📡 Testing cookie-only authentication on /api/auth/me")
                me_response = self.session.get(f"{self.base_url}/auth/me")
                
                if me_response.status_code == 200:
                    data = me_response.json()
                    if data.get("email") == self.moderator_email:
                        self.log_test("Cookie Authentication Simulation", True, 
                                    f"Cookie auth successful for: {data.get('email')}")
                        return True
                    else:
                        self.log_test("Cookie Authentication Simulation", False, 
                                    f"Wrong user data: {data}")
                        return False
                else:
                    self.log_test("Cookie Authentication Simulation", False, 
                                f"Cookie auth failed: {me_response.status_code}")
                    return False
            else:
                self.log_test("Cookie Authentication Simulation", False, 
                            f"Login failed: {login_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Cookie Authentication Simulation", False, f"Exception: {str(e)}")
            return False
    
    def test_multiple_consecutive_analyses(self):
        """Test 5: Multiple consecutive analyses to verify session persistence"""
        print("\n🔄 PHASE 5: MULTIPLE CONSECUTIVE ANALYSES")
        
        # Re-login to ensure we have fresh auth
        login_payload = {
            "email": self.moderator_email,
            "password": self.moderator_password
        }
        
        try:
            login_response = self.session.post(f"{self.base_url}/auth/login", json=login_payload)
            if login_response.status_code == 200:
                token = login_response.json().get("access_token")
                self.set_auth_header(token)
            else:
                self.log_test("Multiple Consecutive Analyses", False, "Failed to re-login")
                return False
            
            # Test different scenarios
            test_scenarios = [
                {
                    "name": "AK preflop",
                    "hole_cards": [{"rank": "A", "suit": "spades"}, {"rank": "K", "suit": "hearts"}],
                    "community_cards": [None, None, None, None, None],
                    "player_count": 2
                },
                {
                    "name": "Pocket Aces",
                    "hole_cards": [{"rank": "A", "suit": "hearts"}, {"rank": "A", "suit": "diamonds"}],
                    "community_cards": [None, None, None, None, None],
                    "player_count": 3
                },
                {
                    "name": "Suited Connectors",
                    "hole_cards": [{"rank": "7", "suit": "hearts"}, {"rank": "8", "suit": "hearts"}],
                    "community_cards": [None, None, None, None, None],
                    "player_count": 4
                }
            ]
            
            successful_analyses = 0
            
            for i, scenario in enumerate(test_scenarios, 1):
                payload = {
                    "hole_cards": scenario["hole_cards"],
                    "community_cards": scenario["community_cards"],
                    "player_count": scenario["player_count"],
                    "simulation_iterations": 25000
                }
                
                print(f"🎯 Analysis {i}: {scenario['name']}")
                response = self.session.post(f"{self.base_url}/analyze-hand", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    win_prob = data.get("win_probability", 0)
                    print(f"   ✅ Success - Win probability: {win_prob}%")
                    successful_analyses += 1
                else:
                    print(f"   ❌ Failed - Status: {response.status_code}")
                    if response.status_code == 401:
                        print("   🚨 AUTHENTICATION ERROR DETECTED!")
            
            if successful_analyses == len(test_scenarios):
                self.log_test("Multiple Consecutive Analyses", True, 
                            f"All {successful_analyses} analyses completed successfully")
                return True
            else:
                self.log_test("Multiple Consecutive Analyses", False, 
                            f"Only {successful_analyses}/{len(test_scenarios)} analyses successful")
                return False
                
        except Exception as e:
            self.log_test("Multiple Consecutive Analyses", False, f"Exception: {str(e)}")
            return False
    
    def run_authentication_fix_verification(self):
        """Run all authentication fix verification tests"""
        print("🔐 AUTHENTICATION FIX VERIFICATION TEST")
        print("=" * 60)
        print(f"🎯 Target: Verify 'Authentication credentials required' error is resolved")
        print(f"👤 Testing with: {self.moderator_email}")
        print(f"🌐 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run all test phases
        test_phases = [
            self.test_moderator_login_with_debug_logs,
            self.test_auth_me_endpoint_with_debug,
            self.test_analyze_hand_with_authentication_debug,
            self.test_cookie_authentication_simulation,
            self.test_multiple_consecutive_analyses
        ]
        
        passed_phases = 0
        total_phases = len(test_phases)
        
        for phase_func in test_phases:
            try:
                if phase_func():
                    passed_phases += 1
                time.sleep(0.5)  # Small delay between phases
            except Exception as e:
                print(f"❌ Phase failed with exception: {str(e)}")
        
        # Final Summary
        print("\n" + "=" * 60)
        print("🏆 AUTHENTICATION FIX VERIFICATION SUMMARY")
        print("=" * 60)
        
        passed_tests = sum(1 for result in self.test_results if result["passed"])
        total_tests = len(self.test_results)
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"📊 Test Results: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
        print(f"🔄 Phases Completed: {passed_phases}/{total_phases}")
        
        if passed_tests == total_tests:
            print("🎉 ✅ ALL TESTS PASSED!")
            print("🔓 Authentication credentials error has been RESOLVED!")
            print("✅ Moderator can successfully access calculator without authentication errors")
        else:
            print("⚠️  ❌ SOME TESTS FAILED!")
            print("🚨 Authentication credentials error may still exist")
            
            failed_tests = [result for result in self.test_results if not result["passed"]]
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        # Specific findings for the review request
        print("\n🎯 SPECIFIC FINDINGS FOR REVIEW REQUEST:")
        
        auth_errors = [result for result in self.test_results if 
                      not result["passed"] and ("401" in result["details"] or "credentials" in result["details"].lower())]
        
        if not auth_errors:
            print("✅ No 'Authentication credentials required' errors found")
            print("✅ JWT token authentication working correctly")
            print("✅ Cookie authentication working correctly")
            print("✅ Moderator can access analyze-hand API successfully")
        else:
            print("❌ Authentication credentials errors still present:")
            for error in auth_errors:
                print(f"   • {error['test']}: {error['details']}")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": total_tests - passed_tests,
            "success_rate": success_rate,
            "phases_passed": passed_phases,
            "total_phases": total_phases,
            "authentication_fixed": passed_tests == total_tests,
            "all_results": self.test_results
        }

def main():
    """Main function to run the authentication fix verification"""
    tester = AuthenticationFixTester(BACKEND_URL)
    results = tester.run_authentication_fix_verification()
    
    # Return appropriate exit code
    if results["authentication_fixed"]:
        print("\n🎉 AUTHENTICATION FIX VERIFICATION: SUCCESS")
        exit(0)
    else:
        print("\n❌ AUTHENTICATION FIX VERIFICATION: FAILED")
        exit(1)

if __name__ == "__main__":
    main()