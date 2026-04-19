#!/bin/bash

# ShalaRakshak ML Pipeline - cURL API Examples
# Quick testing of all endpoints without running Python code

BASE_URL="http://localhost:8000/api/v1"

echo "=========================================="
echo "ShalaRakshak ML Pipeline - API Examples"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Create a new report${NC}"
echo "POST /api/v1/report"
echo "---"
curl -X POST "$BASE_URL/report" \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": 101,
    "category": "girls_toilet",
    "condition": "major",
    "photo_url": "https://example.com/photo.jpg"
  }' | jq .

echo -e "\n${BLUE}2. Get ML pipeline for specific category${NC}"
echo "GET /api/v1/pipeline/101/girls_toilet"
echo "---"
curl -X GET "$BASE_URL/pipeline/101/girls_toilet" | jq .

echo -e "\n${BLUE}3. Get all pipeline results for a school${NC}"
echo "GET /api/v1/pipeline/101"
echo "---"
curl -X GET "$BASE_URL/pipeline/101" | jq .

echo -e "\n${BLUE}4. Get DEO priority queue (MAIN DASHBOARD)${NC}"
echo "GET /api/v1/deo/queue"
echo "---"
curl -X GET "$BASE_URL/deo/queue" | jq .

echo -e "\n${BLUE}5. Get queue for specific school${NC}"
echo "GET /api/v1/deo/queue/101"
echo "---"
curl -X GET "$BASE_URL/deo/queue/101" | jq .

echo -e "\n${BLUE}6. Get ML-enhanced priority queue${NC}"
echo "GET /api/v1/pipeline/queue/priority"
echo "---"
curl -X GET "$BASE_URL/pipeline/queue/priority" | jq .

echo -e "\n${GREEN}✅ Done!${NC}"
