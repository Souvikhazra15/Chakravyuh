
def calculate_priority_level(category, risk_score):
    """
    Ranks maintenance issues by priority.
    
    Input:
      - category: str (type of issue)
      - risk_score: float (0-1, higher = more risky)
    
    Output:
      - priority_score: float (0-5, higher = more urgent)
      - priority_level: str ("Critical", "High", "Medium", "Low")
    """
    
    # Define how important each category is
    impact_weights = {
        'girls_toilet': 5.0,
        'structural': 5.0,
        'electrical': 4.5,
        'classroom': 4.0,
        'plumbing': 3.5,
        'other': 2.0
    }
    
    # Find the right weight for this category
    category_lower = str(category).lower().strip()
    
    if 'girl' in category_lower or 'toilet' in category_lower:
        weight = impact_weights['girls_toilet']
    elif 'class' in category_lower:
        weight = impact_weights['classroom']
    elif 'electrical' in category_lower:
        weight = impact_weights['electrical']
    elif 'plumbing' in category_lower:
        weight = impact_weights['plumbing']
    elif 'structural' in category_lower:
        weight = impact_weights['structural']
    else:
        weight = impact_weights['other']
    
    # Calculate priority
    priority_score = risk_score * weight
    
    # Assign level
    if priority_score >= 3.5:
        priority_level = 'Critical'
    elif priority_score >= 2.5:
        priority_level = 'High'
    elif priority_score >= 1.5:
        priority_level = 'Medium'
    else:
        priority_level = 'Low'
    
    return priority_score, priority_level
