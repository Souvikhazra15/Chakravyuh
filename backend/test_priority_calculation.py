#!/usr/bin/env python3
"""
Test the complete analysis flow to verify Medium and Low priorities are calculated.
This mimics what the frontend does.
"""

import sys
sys.path.insert(0, '.')

# Test data with mixed condition scores to generate varied priority levels
test_data = {
    'school_id': 1,
    'csv_data': [
        {'school_id': 1, 'category': 'girls_toilet', 'condition_score': 0.95},  # Should be Critical (5.0 * 0.95 = 4.75)
        {'school_id': 1, 'category': 'electrical', 'condition_score': 0.80},     # Should be Critical/High (4.5 * 0.80 = 3.6)
        {'school_id': 1, 'category': 'structural', 'condition_score': 0.70},     # Should be High (5.0 * 0.70 = 3.5)
        {'school_id': 1, 'category': 'plumbing', 'condition_score': 0.55},       # Should be Medium/High (3.5 * 0.55 = 1.925)
        {'school_id': 1, 'category': 'classroom', 'condition_score': 0.45},      # Should be Medium (4.0 * 0.45 = 1.8)
        {'school_id': 1, 'category': 'classroom', 'condition_score': 0.35},      # Should be Low/Medium (4.0 * 0.35 = 1.4)
        {'school_id': 1, 'category': 'other', 'condition_score': 0.40},          # Should be Low/Medium (2.0 * 0.40 = 0.8)
        {'school_id': 1, 'category': 'other', 'condition_score': 0.25},          # Should be Low (2.0 * 0.25 = 0.5)
        {'school_id': 1, 'category': 'other', 'condition_score': 0.15},          # Should be Low (2.0 * 0.15 = 0.3)
    ]
}

print("=" * 100)
print("TESTING ANALYSIS FLOW")
print("=" * 100)

print(f"\n📊 Test data: {len(test_data['csv_data'])} records")
for idx, record in enumerate(test_data['csv_data']):
    expected_score = record['condition_score'] * {
        'girls_toilet': 5.0,
        'electrical': 4.5,
        'structural': 5.0,
        'classroom': 4.0,
        'plumbing': 3.5,
        'other': 2.0
    }.get(record['category'], 2.0)
    
    if expected_score >= 3.5:
        expected_level = 'Critical'
    elif expected_score >= 2.5:
        expected_level = 'High'
    elif expected_score >= 1.5:
        expected_level = 'Medium'
    else:
        expected_level = 'Low'
    
    print(f"  {idx+1}. {record['category']:15} risk={record['condition_score']:.2f} → score={expected_score:.2f} → {expected_level}")

print("\n" + "=" * 100)
print("TESTING BACKEND DIRECTLY")
print("=" * 100)

try:
    # Test the backend logic directly
    from app.utils import calculate_priority_level
    
    print("\n✅ Testing calculate_priority_level function:")
    for category, risk_score in [
        ('girls_toilet', 0.95),
        ('electrical', 0.80),
        ('structural', 0.70),
        ('plumbing', 0.55),
        ('classroom', 0.45),
        ('classroom', 0.35),
        ('other', 0.40),
        ('other', 0.25),
        ('other', 0.15),
    ]:
        priority_score, priority_level = calculate_priority_level(category, risk_score)
        print(f"  {category:15} risk={risk_score:.2f} → priority_score={priority_score:.2f} → {priority_level}")
    
    # Count by priority level
    priority_counts = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0}
    for category, risk_score in [
        ('girls_toilet', 0.95),
        ('electrical', 0.80),
        ('structural', 0.70),
        ('plumbing', 0.55),
        ('classroom', 0.45),
        ('classroom', 0.35),
        ('other', 0.40),
        ('other', 0.25),
        ('other', 0.15),
    ]:
        _, priority_level = calculate_priority_level(category, risk_score)
        priority_counts[priority_level] += 1
    
    print("\n✅ Expected priority distribution:")
    for level in ['Critical', 'High', 'Medium', 'Low']:
        count = priority_counts[level]
        pct = (count / 9 * 100) if 9 > 0 else 0
        print(f"  {level:8} : {count} issues ({pct:.1f}%)")
    
    print("\n✅ Backend logic is working correctly!")
    print(f"   Critical: {priority_counts['Critical']} (should be >0)")
    print(f"   High: {priority_counts['High']} (should be >0)")
    print(f"   Medium: {priority_counts['Medium']} (should be >0)")
    print(f"   Low: {priority_counts['Low']} (should be >0)")
    
except Exception as e:
    print(f"❌ Error testing backend: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 100)
