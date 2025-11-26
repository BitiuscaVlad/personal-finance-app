"""
Test script to verify Logfire integration
This script tests that Logfire is properly integrated and working
"""
import sys
import logfire
from datetime import datetime

def test_logfire_configuration():
    """Test Logfire configuration"""
    print("🔍 Testing Logfire Configuration...")
    try:
        logfire.configure(
            service_name="test-finance-api",
            send_to_logfire="if-token-present",
        )
        print("✅ Logfire configured successfully")
        return True
    except Exception as e:
        print(f"❌ Logfire configuration failed: {e}")
        return False


def test_logfire_logging():
    """Test basic logging functionality"""
    print("\n🔍 Testing Logfire Logging...")
    try:
        logfire.info("Test info message", test_type="integration_test")
        logfire.warn("Test warning message", test_type="integration_test")
        logfire.error("Test error message", test_type="integration_test")
        print("✅ Basic logging works")
        return True
    except Exception as e:
        print(f"❌ Logging failed: {e}")
        return False


def test_logfire_spans():
    """Test span functionality"""
    print("\n🔍 Testing Logfire Spans...")
    try:
        with logfire.span("test_operation", operation="integration_test"):
            logfire.info("Inside span", timestamp=datetime.now().isoformat())
        print("✅ Span tracking works")
        return True
    except Exception as e:
        print(f"❌ Span tracking failed: {e}")
        return False


def test_imports():
    """Test that all required modules can be imported"""
    print("\n🔍 Testing Module Imports...")
    modules = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "dotenv",
        "httpx",
        "openai",
        "apscheduler",
        "logfire"
    ]
    
    all_imported = True
    for module_name in modules:
        try:
            __import__(module_name.split('.')[0])
            print(f"  ✅ {module_name}")
        except ImportError as e:
            print(f"  ❌ {module_name}: {e}")
            all_imported = False
    
    return all_imported


def test_database_integration():
    """Test that database module loads with logfire"""
    print("\n🔍 Testing Database Module with Logfire...")
    try:
        from database.db import init_database, get_db
        print("✅ Database module imports successfully")
        return True
    except Exception as e:
        print(f"❌ Database module import failed: {e}")
        return False


def test_services_integration():
    """Test that service modules load with logfire"""
    print("\n🔍 Testing Service Modules with Logfire...")
    try:
        from services.currency_service import get_latest_rates
        from services.ai_categorization_service import suggest_category
        print("✅ Service modules import successfully")
        return True
    except Exception as e:
        print(f"❌ Service module import failed: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("  Logfire Integration Test Suite")
    print("=" * 60)
    print()
    
    tests = [
        ("Configuration", test_logfire_configuration),
        ("Logging", test_logfire_logging),
        ("Spans", test_logfire_spans),
        ("Module Imports", test_imports),
        ("Database Integration", test_database_integration),
        ("Services Integration", test_services_integration),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 60)
    print("  Test Results Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print()
    print(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Logfire integration is working correctly.")
        print("\n📝 Next steps:")
        print("   1. Set LOGFIRE_TOKEN in .env file (optional)")
        print("   2. Run: python main.py")
        print("   3. Visit: http://localhost:5000/docs")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
