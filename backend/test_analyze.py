#!/usr/bin/env python3
"""
Test the analyze endpoint with real CSV data to verify priority calculation.
Run: python test_analyze.py
"""

import asyncio
import json
from app.database import db as database
from app.routers.analyze import run_ai_analysis
from app.schemas import AnalysisRequest, DataRecord

async def test_analyze():
    """Test the analyze endpoint."""
    await database.connect()
    
    try:
        print("\n" + "="*80)
        print("TESTING ANALYZE ENDPOINT")
        print("="*80 + "\n")
        
        # Test 1: Structured data input
        print("TEST 1: Structured Data Input")
        print("-" * 80)
        
        test_records = [
            DataRecord(school_id=1, category='girls_toilet', condition_score=0.85),
            DataRecord(school_id=2, category='electrical', condition_score=0.65),
            DataRecord(school_id=3, category='classroom', condition_score=0.50),
            DataRecord(school_id=4, category='structural', condition_score=0.90),
            DataRecord(school_id=5, category='plumbing', condition_score=0.40),
        ]
        
        request = AnalysisRequest(school_id=1, data=test_records)
        response = await run_ai_analysis(request)
        
        print(f"\nSummary:")
        print(f"  Total issues: {response.summary.total_issues}")
        print(f"  Critical: {response.summary.critical}")
        print(f"  High: {response.summary.high}")
        print(f"  Medium: {response.summary.medium}")
        print(f"  Low: {response.summary.low}")
        
        print(f"\nTop 5 Predictions (by priority):")
        for idx, result in enumerate(response.data[:5], 1):
            print(f"  {idx}. {result.category} | Risk: {result.risk_score:.3f} | Priority: {result.priority_score:.2f} | {result.priority_level}")
        
        # Test 2: CSV data input (like from Principal Dashboard)
        print("\n" + "="*80)
        print("TEST 2: CSV Data Input (from Principal Dashboard)")
        print("-" * 80 + "\n")
        
        csv_data = [
            {
                'school_id': '1',
                'category': 'girls_toilet',
                'condition': 'Major Issue',
                'condition_score': '0.85'
            },
            {
                'school_id': '2',
                'category': 'electrical',
                'condition': 'Minor Issue',
                'condition_score': '0.65'
            },
            {
                'school_id': '3',
                'category': 'classroom',
                'condition': 'Good',
                'condition_score': '0.25'
            },
        ]
        
        request_csv = AnalysisRequest(school_id=1, csv_data=csv_data)
        response_csv = await run_ai_analysis(request_csv)
        
        print(f"\nSummary:")
        print(f"  Total issues: {response_csv.summary.total_issues}")
        print(f"  Critical: {response_csv.summary.critical}")
        print(f"  High: {response_csv.summary.high}")
        print(f"  Medium: {response_csv.summary.medium}")
        print(f"  Low: {response_csv.summary.low}")
        
        print(f"\nPredictions:")
        for result in response_csv.data:
            print(f"  {result.school_id} | {result.category} | Risk: {result.risk_score:.3f} | Priority: {result.priority_score:.2f} | {result.priority_level}")
            print(f"    → {result.reason}")
        
        # Test 3: Verify priority mapping
        print("\n" + "="*80)
        print("TEST 3: Priority Mapping Verification")
        print("-" * 80 + "\n")
        
        print("Testing priority calculation for different categories:")
        test_cases = [
            ('girls_toilet', 0.85),
            ('electrical', 0.65),
            ('classroom', 0.50),
            ('structural', 0.90),
            ('plumbing', 0.40),
        ]
        
        for category, risk in test_cases:
            request_single = AnalysisRequest(
                school_id=1,
                data=[DataRecord(school_id=1, category=category, condition_score=risk)]
            )
            response_single = await run_ai_analysis(request_single)
            result = response_single.data[0]
            print(f"  {category:15} | Risk: {risk:.2f} → Priority: {result.priority_score:.2f} ({result.priority_level})")
        
        print("\n✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await database.disconnect()

if __name__ == "__main__":
    asyncio.run(test_analyze())
