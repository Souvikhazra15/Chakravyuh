"""
API Testing Script
Test all endpoints with sample data
Run: python api_test.py
"""

import httpx
import json
import asyncio

BASE_URL = "http://localhost:8000"


async def test_api():
    """Test all API endpoints."""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        print("=" * 60)
        print("Chakravyuh API Test Suite")
        print("=" * 60)

        # Health Check
        print("\n1️⃣  Health Check")
        response = await client.get("/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        # Submit Report
        print("\n2️⃣  Submit Weekly Report")
        report_data = {
            "school_id": 101,
            "category": "plumbing",
            "condition": "Major",
            "photo_url": "https://example.com/photo.jpg",
        }
        response = await client.post("/api/v1/report/", json=report_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        # Get Reports
        print("\n3️⃣  Get School Reports")
        response = await client.get("/api/v1/report/101")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        # Get Risk
        print("\n4️⃣  Get Risk Assessment")
        response = await client.get("/api/v1/risk/101")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        # Get Prediction
        print("\n5️⃣  Get Failure Prediction")
        response = await client.get("/api/v1/prediction/101")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        # Get Explanation
        print("\n6️⃣  Get AI Explanation")
        response = await client.get("/api/v1/explain/101")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        # Get DEO Queue
        print("\n7️⃣  Get DEO Priority Queue")
        response = await client.get("/api/v1/deo/queue")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        # Create Work Order
        print("\n8️⃣  Create Work Order")
        work_data = {
            "school_id": 101,
            "category": "plumbing",
            "assigned_to": "John Contractor",
        }
        response = await client.post("/api/v1/work/order", json=work_data)
        print(f"Status: {response.status_code}")
        work_response = response.json()
        print(f"Response: {json.dumps(work_response, indent=2)}")
        work_id = work_response.get("id")

        # Get Pending Work Orders
        print("\n9️⃣  Get Pending Work Orders")
        response = await client.get("/api/v1/work/pending")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        # Complete Work
        if work_id:
            print("\n🔟 Complete Work Order")
            completion_data = {
                "work_id": work_id,
                "photo_url": "https://example.com/completion.jpg",
                "gps_location": "20.5937,78.9629",
                "notes": "Plumbing repair completed successfully",
            }
            response = await client.post("/api/v1/work/complete", json=completion_data)
            print(f"Status: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")

        # Get History
        print("\n1️⃣1️⃣ Get Repair History")
        response = await client.get("/api/v1/history/101")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        # Get Stats
        print("\n1️⃣2️⃣ Get System Statistics")
        response = await client.get("/api/v1/history/")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        print("\n" + "=" * 60)
        print("✅ API Testing Complete!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_api())
