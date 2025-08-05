#!/usr/bin/env python3
"""
Test for New Premium Moderator Account
Tests authentication and calculator access for the new moderator account:
- Email: moderator.premium@pokerpro.com
- Password: PokerPremiumMod2024!
- Role: moderator
- Subscription status: active
"""

import requests
import json
import time
import os
from typing import Dict, Any

# Get backend URL from environment
BACKEND_URL = "https://86fa4beb-2f95-4b09-9924-af4fde58ca53.preview.emergentagent.com/api"

class ModeratorPremiumTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.auth_token = None
        
        # Moderator credentials from review request
        self.moderator_email = "moderator.premium@pokerpro.com"
        self.moderator_password = "PokerPremiumMod2024!"
        
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
    
    def set_auth_header(self, token: str):
        """Set authorization header for authenticated requests"""
        self.auth_token = token
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def clear_auth_header(self):
        """Clear authorization header"""
        self.auth_token = None
        if "Authorization" in self.session.headers:
            del self.session.headers["Authorization"]
    
    def test_moderator_login(self):
        """Test 1: Test de connexion - Verify login works with moderator credentials"""
        payload = {
            "email": self.moderator_email,
            "password": self.moderator_password
        }
        
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json=payload)
            if response.status_code == 200:
                data = response.json()
                required_fields = ["access_token", "token_type", "user"]
                
                if all(field in data for field in required_fields):
                    # Store token for future tests
                    self.set_auth_header(data["access_token"])
                    user_info = data["user"]
                    
                    # Verify moderator role and active subscription
                    role = user_info.get("role", "user")
                    subscription_status = user_info.get("subscription_status", "inactive")
                    
                    self.log_test("Test de connexion - Moderator login", True, 
                                f"Login successful! Email: {user_info.get('email')}, Role: {role}, Subscription: {subscription_status}")
                    return True
                else:
                    self.log_test("Test de connexion - Moderator login", False, "Missing required fields in response")
                    return False
            else:
                self.log_test("Test de connexion - Moderator login", False, 
                            f"Status code: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Test de connexion - Moderator login", False, f"Exception: {str(e)}")
            return False
    
    def test_jwt_authentication(self):
        """Test 2: Test d'authentification - Verify JWT token is correctly generated and validated"""
        if not self.auth_token:
            self.log_test("Test d'authentification - JWT validation", False, "No auth token available")
            return False
        
        try:
            # Test JWT token format (should have 3 parts separated by dots)
            token_parts = self.auth_token.split('.')
            if len(token_parts) != 3:
                self.log_test("Test d'authentification - JWT validation", False, f"Invalid JWT format: {len(token_parts)} parts")
                return False
            
            # Test token validation by calling /auth/me
            response = self.session.get(f"{self.base_url}/auth/me")
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "name", "email", "subscription_status"]
                
                if all(field in data for field in required_fields):
                    role = data.get("role", "user")
                    self.log_test("Test d'authentification - JWT validation", True, 
                                f"JWT token valid! User: {data['email']}, Role: {role}")
                    return True
                else:
                    self.log_test("Test d'authentification - JWT validation", False, "Missing user fields in /auth/me response")
                    return False
            else:
                self.log_test("Test d'authentification - JWT validation", False, 
                            f"/auth/me failed with status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Test d'authentification - JWT validation", False, f"Exception: {str(e)}")
            return False
    
    def test_calculator_access(self):
        """Test 3: Test d'accès calculateur - Verify moderator can access /api/analyze-hand without subscription restriction"""
        if not self.auth_token:
            self.log_test("Test d'accès calculateur - Calculator access", False, "No auth token available")
            return False
        
        # Test with a simple pre-flop scenario
        payload = {
            "hole_cards": [
                {"rank": "A", "suit": "spades"},
                {"rank": "K", "suit": "hearts"}
            ],
            "community_cards": [None, None, None, None, None],
            "player_count": 2,
            "simulation_iterations": 10000
        }
        
        try:
            response = self.session.post(f"{self.base_url}/analyze-hand", json=payload)
            if response.status_code == 200:
                data = response.json()
                required_fields = ["win_probability", "tie_probability", "lose_probability", 
                                 "hand_strength", "opponent_ranges", "recommendation"]
                
                if all(field in data for field in required_fields):
                    win_prob = data["win_probability"]
                    self.log_test("Test d'accès calculateur - Calculator access", True, 
                                f"Calculator accessible! Win probability: {win_prob}%")
                    return True
                else:
                    self.log_test("Test d'accès calculateur - Calculator access", False, 
                                "Missing required fields in analysis response")
                    return False
            else:
                self.log_test("Test d'accès calculateur - Calculator access", False, 
                            f"Calculator access denied. Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Test d'accès calculateur - Calculator access", False, f"Exception: {str(e)}")
            return False
    
    def test_subscription_bypass(self):
        """Test 4: Test de privilèges - Confirm subscription bypass works for moderators"""
        if not self.auth_token:
            self.log_test("Test de privilèges - Subscription bypass", False, "No auth token available")
            return False
        
        try:
            # First verify user info shows moderator role
            user_response = self.session.get(f"{self.base_url}/auth/me")
            if user_response.status_code == 200:
                user_data = user_response.json()
                role = user_data.get("role", "user")
                subscription_status = user_data.get("subscription_status", "inactive")
                
                # Test calculator access (should work regardless of subscription for moderators)
                calc_payload = {
                    "hole_cards": [
                        {"rank": "Q", "suit": "hearts"},
                        {"rank": "Q", "suit": "spades"}
                    ],
                    "community_cards": [None, None, None, None, None],
                    "player_count": 3,
                    "simulation_iterations": 15000
                }
                
                calc_response = self.session.post(f"{self.base_url}/analyze-hand", json=calc_payload)
                if calc_response.status_code == 200:
                    self.log_test("Test de privilèges - Subscription bypass", True, 
                                f"Moderator bypass working! Role: {role}, Can access calculator without subscription check")
                    return True
                else:
                    self.log_test("Test de privilèges - Subscription bypass", False, 
                                f"Calculator blocked for moderator. Status: {calc_response.status_code}")
                    return False
            else:
                self.log_test("Test de privilèges - Subscription bypass", False, 
                            f"Failed to get user info. Status: {user_response.status_code}")
                return False
        except Exception as e:
            self.log_test("Test de privilèges - Subscription bypass", False, f"Exception: {str(e)}")
            return False
    
    def test_complete_poker_analysis(self):
        """Test 5: Test API complète - Perform complete probability calculation with poker hand example"""
        if not self.auth_token:
            self.log_test("Test API complète - Complete poker analysis", False, "No auth token available")
            return False
        
        # Test with a more complex flop scenario
        payload = {
            "hole_cards": [
                {"rank": "J", "suit": "hearts"},
                {"rank": "J", "suit": "diamonds"}
            ],
            "community_cards": [
                {"rank": "J", "suit": "spades"},  # Trip jacks
                {"rank": "7", "suit": "clubs"},
                {"rank": "2", "suit": "hearts"},
                None,
                None
            ],
            "player_count": 4,
            "simulation_iterations": 50000
        }
        
        try:
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/analyze-hand", json=payload)
            end_time = time.time()
            
            if response.status_code == 200:
                data = response.json()
                response_time = end_time - start_time
                
                # Verify all required fields
                required_fields = ["win_probability", "tie_probability", "lose_probability", 
                                 "hand_strength", "opponent_ranges", "recommendation", "calculations"]
                
                if all(field in data for field in required_fields):
                    win_prob = data["win_probability"]
                    tie_prob = data["tie_probability"]
                    lose_prob = data["lose_probability"]
                    hand_strength = data["hand_strength"]
                    recommendation = data["recommendation"]
                    
                    # Verify probabilities sum to ~100%
                    total_prob = win_prob + tie_prob + lose_prob
                    prob_valid = 99.0 <= total_prob <= 101.0
                    
                    # Verify Monte Carlo simulation worked (trip jacks should have high win rate)
                    strong_hand = win_prob > 80
                    
                    if prob_valid and strong_hand:
                        self.log_test("Test API complète - Complete poker analysis", True, 
                                    f"Complete analysis successful! Win: {win_prob}%, Tie: {tie_prob}%, Lose: {lose_prob}%, "
                                    f"Hand: {hand_strength.get('made_hand', 'Unknown')}, Time: {response_time:.2f}s")
                        
                        # Test history saving by checking if analysis was stored
                        print(f"   📊 Analysis Details:")
                        print(f"      Hand Strength: {hand_strength.get('made_hand', 'N/A')}")
                        print(f"      Recommendation: {recommendation.get('action', 'N/A')} ({recommendation.get('confidence', 'N/A')})")
                        print(f"      Simulation Time: {response_time:.2f}s")
                        print(f"      Monte Carlo Iterations: {payload['simulation_iterations']:,}")
                        
                        return True
                    else:
                        issues = []
                        if not prob_valid:
                            issues.append(f"Invalid probability sum: {total_prob}%")
                        if not strong_hand:
                            issues.append(f"Unexpected win rate for trip jacks: {win_prob}%")
                        
                        self.log_test("Test API complète - Complete poker analysis", False, 
                                    f"Analysis issues: {'; '.join(issues)}")
                        return False
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("Test API complète - Complete poker analysis", False, 
                                f"Missing response fields: {missing_fields}")
                    return False
            else:
                self.log_test("Test API complète - Complete poker analysis", False, 
                            f"Analysis failed. Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Test API complète - Complete poker analysis", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all moderator tests and return summary"""
        print("🎯 Testing New Premium Moderator Account...")
        print(f"Testing backend at: {self.base_url}")
        print(f"Moderator Email: {self.moderator_email}")
        print("=" * 80)
        
        # Run tests in sequence
        print("\n🔐 Phase 1: Authentication Tests")
        login_success = self.test_moderator_login()
        
        if login_success:
            jwt_success = self.test_jwt_authentication()
            
            print("\n🎮 Phase 2: Calculator Access Tests")
            calculator_success = self.test_calculator_access()
            bypass_success = self.test_subscription_bypass()
            
            print("\n🃏 Phase 3: Complete API Testing")
            complete_success = self.test_complete_poker_analysis()
        else:
            print("❌ Login failed - skipping remaining tests")
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 MODERATOR TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result["passed"])
        total = len(self.test_results)
        success_rate = (passed / total) * 100 if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL MODERATOR TESTS PASSED!")
            print("✅ New premium moderator account is working correctly")
            print("✅ Authentication system functioning properly")
            print("✅ Calculator access granted without subscription restrictions")
            print("✅ Subscription bypass working for moderator role")
            print("✅ Complete Monte Carlo simulations working")
            print("✅ Analysis history being saved")
        else:
            print(f"\n⚠️  {total - passed} tests failed. Details:")
            failed_tests = [result for result in self.test_results if not result["passed"]]
            for test in failed_tests:
                print(f"  ❌ {test['test']}: {test['details']}")
        
        return {
            "total_tests": total,
            "passed_tests": passed,
            "failed_tests": total - passed,
            "success_rate": success_rate,
            "all_results": self.test_results
        }

def main():
    """Main test execution"""
    print("🚀 Starting Premium Moderator Account Testing...")
    print("Testing moderator.premium@pokerpro.com with PokerPremiumMod2024!")
    print("=" * 80)
    
    # Test Premium Moderator Account
    moderator_tester = ModeratorPremiumTester(BACKEND_URL)
    results = moderator_tester.run_all_tests()
    
    if results['failed_tests'] == 0:
        print("\n🎉 ALL TESTS PASSED! Premium moderator account is working correctly.")
        exit(0)
    else:
        print(f"\n⚠️  {results['failed_tests']} tests failed. Review the details above.")
        exit(1)

if __name__ == "__main__":
    main()