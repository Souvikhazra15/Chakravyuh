"""
API Test Suite for SchoolAI ML Pipeline

Test all endpoints with sample requests and responses.
"""

import httpx
import json
from typing import List, Dict

BASE_URL = "http://localhost:8000/api/v1"


async def test_all_endpoints():
    """Run complete API test suite."""

    async with httpx.AsyncClient() as client:
        print("\n" + "=" * 80)
        print("SCHOOLAI ML PIPELINE - API TEST SUITE")
        print("=" * 80)

        # ============================================================================
        # 1. POST /report - Create new report
        # ============================================================================
        print("\n1️⃣  POST /api/v1/report - Create New Report")
        print("-" * 80)

        new_report = {
            "school_id": 101,
            "category": "girls_toilet",
            "condition": "major",
            "photo_url": "https://example.com/photo1.jpg",
        }

        response = await client.post(
            f"{BASE_URL}/report",
            json=new_report,
            headers={"Content-Type": "application/json"},
        )

        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error: {response.text}")

        # ============================================================================
        # 2. GET /pipeline/{school_id}/{category} - Single Category Pipeline
        # ============================================================================
        print("\n2️⃣  GET /api/v1/pipeline/101/girls_toilet - ML Pipeline for Category")
        print("-" * 80)

        response = await client.get(f"{BASE_URL}/pipeline/101/girls_toilet")

        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"\n📊 Pipeline Result:")
            print(f"   School: {data.get('school_id')}")
            print(f"   Category: {data.get('category')}")
            print(f"   Risk Score: {data.get('risk_score')}")
            print(f"   Status: {data.get('status')}")
            print(f"   Prediction: {data.get('prediction')}")
            print(f"   Days Until Failure: {data.get('days_until_failure')}")
            print(f"   Trend: {data.get('trend')}")
            print(f"   Confidence: {data.get('confidence')}")
            print(f"   Reason: {data.get('reason')}")
            print(f"\n🔍 Anomaly Detection:")
            anomaly = data.get("anomaly_detection", {})
            print(f"   Z-Score Prediction: {anomaly.get('z_pred')}")
            print(f"   IF Prediction: {anomaly.get('if_pred')}")
            print(f"   Hybrid Prediction: {anomaly.get('hybrid_pred')}")
            print(f"   Hybrid Probability: {anomaly.get('hybrid_proba')}")
            print(f"   Anomaly Flag: {anomaly.get('anomaly_flag')}")
        else:
            print(f"Error: {response.text}")

        # ============================================================================
        # 3. GET /pipeline/{school_id} - All Categories for School
        # ============================================================================
        print("\n3️⃣  GET /api/v1/pipeline/101 - Complete School Pipeline")
        print("-" * 80)

        response = await client.get(f"{BASE_URL}/pipeline/101")

        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"\nSchool {data.get('school_id')} Summary:")
            print(f"   Total Categories: {len(data.get('results', []))}")
            print(f"   Critical: {data.get('summary', {}).get('Critical', 0)}")
            print(f"   Warning: {data.get('summary', {}).get('Warning', 0)}")
            print(f"   Safe: {data.get('summary', {}).get('Safe', 0)}")

            print(f"\n📋 Category Breakdown:")
            for result in data.get("results", [])[:3]:
                print(f"\n   • {result.get('category').upper()}")
                print(f"     Risk Score: {result.get('risk_score')}")
                print(f"     Status: {result.get('status')}")
                print(f"     Prediction: {result.get('prediction')}")
                print(f"     Reason: {result.get('reason')}")
        else:
            print(f"Error: {response.text}")

        # ============================================================================
        # 4. GET /deo/queue - Priority Queue for DEO (MAIN DASHBOARD)
        # ============================================================================
        print("\n4️⃣  GET /api/v1/deo/queue - DEO Priority Maintenance Queue")
        print("-" * 80)

        response = await client.get(f"{BASE_URL}/deo/queue")

        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"\n🚨 Total Critical Items: {len([x for x in data if x.get('status') == 'Critical'])}")
            print(f"⚠️  Total Warning Items: {len([x for x in data if x.get('status') == 'Warning'])}")
            print(f"✅ Total Safe Items: {len([x for x in data if x.get('status') == 'Safe'])}")

            print(f"\n📌 Top 5 Priority Items (Highest Risk First):")
            for i, item in enumerate(data[:5], 1):
                print(f"\n   {i}. School {item.get('school_id')} - {item.get('category').upper()}")
                print(f"      Status: {item.get('status')}")
                print(f"      Priority Score: {item.get('priority_score')}")
                print(f"      Risk Score: {item.get('risk_score')}")
                print(f"      Prediction: {item.get('prediction')}")
                print(f"      Anomaly Detected: {item.get('anomaly_flag')}")
                print(f"      Confidence: {item.get('confidence')}")
                print(f"      Reason: {item.get('reason')}")
        else:
            print(f"Error: {response.text}")

        # ============================================================================
        # 5. GET /deo/queue/{school_id} - School-specific Queue
        # ============================================================================
        print("\n5️⃣  GET /api/v1/deo/queue/101 - Queue for Specific School")
        print("-" * 80)

        response = await client.get(f"{BASE_URL}/deo/queue/101")

        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"\nSchool 101 Priority Items:")
            for item in data[:3]:
                print(f"\n   • {item.get('category').upper()}")
                print(f"     Status: {item.get('status')}")
                print(f"     Priority: {item.get('priority_score')}")
                print(f"     Reason: {item.get('reason')}")
        else:
            print(f"Error: {response.text}")

        # ============================================================================
        # 6. GET /pipeline/queue/priority - ML Priority Queue
        # ============================================================================
        print("\n6️⃣  GET /api/v1/pipeline/queue/priority - ML-Enhanced Priority Queue")
        print("-" * 80)

        response = await client.get(f"{BASE_URL}/pipeline/queue/priority")

        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"\nTotal Items: {len(data)}")

            print(f"\n🏆 Top 3 Critical Items (ML-Ranked):")
            for i, item in enumerate(data[:3], 1):
                print(f"\n   {i}. School {item.get('school_id')} - {item.get('category').upper()}")
                print(f"      Status: {item.get('status')}")
                print(f"      ML Risk Score: {item.get('risk_score')}")
                print(f"      Priority Score: {item.get('priority_score')}")
                print(f"      Prediction: {item.get('prediction')}")
                print(f"      ML Confidence: {item.get('confidence')}")
                print(f"      Anomaly Detected: {item.get('anomaly_flag')}")
        else:
            print(f"Error: {response.text}")

        print("\n" + "=" * 80)
        print("✅ API TEST SUITE COMPLETED")
        print("=" * 80)


if __name__ == "__main__":
    import asyncio

    print("""
    🚀 SCHOOLAI ML PIPELINE - QUICK START GUIDE
    
    Before running tests:
    1. Start the backend: python -m uvicorn app.main:app --reload
    2. Load sample data: python load_sample_data.py
    3. Run this test: python test_api.py
    
    Frontend Integration:
    - Fetch from: GET /api/v1/deo/queue
    - Parse school_id, category, prediction, priority_score, reason
    - Display as dashboard with sorting by priority_score DESC
    """)

    asyncio.run(test_all_endpoints())
