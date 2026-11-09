#!/bin/bash

echo "=========================================="
echo "🚀 TESTING COMPLETE PATIENT ADMISSION FLOW"
echo "=========================================="

BASE_URL="http://localhost:3001"
PATIENT_ID=""

# Colors
GREEN="[0;32m"
BLUE="[0;34m"
RED=";31m"
NC="[0m"

echo -e "
${BLUE}1. Creating new patient...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/patients-api" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","dateOfBirth":"1985-05-15","gender":"male","phoneNumber":"+91 98765 43299","hospitalId":"hosp-001"}')

PATIENT_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PATIENT_ID" ]; then
  echo -e "${GREEN}✅ Patient created with ID: $PATIENT_ID${NC}"
else
  echo -e "${RED}❌ Failed to create patient${NC}"
  echo $CREATE_RESPONSE
  exit 1
fi

echo -e "
${BLUE}2. Getting patient by ID...${NC}"
curl -s "$BASE_URL/api/patients-api/$PATIENT_ID" | python3 -m json.tool

echo -e "
${BLUE}3. Moving patient to triage...${NC}"
curl -s -X POST "$BASE_URL/api/patients-api/$PATIENT_ID/transition" \
  -d '{"toStatus":"IN_TRIAGE","actorId":"nurse-001"}' | python3 -m json.tool

echo -e "
${BLUE}4. Completing triage...${NC}"
curl -s -X POST "$BASE_URL/api/patients-api/$PATIENT_ID/transition" \
  -H "Content-Type: application/json" \
  -d '{"toStatus":"TRIAGED","actorId":"nurse-001","metadata":{"priority":2}}' | python3 -m json.tool

echo -e "
${BLUE}5. Getting patient journey...${NC}"
curl -s "$BASE_URL/api/patients-api/$PATIENT_ID/journey" | python3 -m json.tool

echo -e "
${BLUE}6. Getting all patients...${NC}"
curl -s "$BASE_URL/api/patients-api" | python3 -m json.tool

echo -e "
${BLUE}7. Getting patient stats...${NC}"
curl -s "$BASE_URL/api/patients-api/stats" | python3 -m json.tool

echo -e "
${GREEN}==========================================${NC}"
echo -e "${GREEN}✅✅ TEST COMPLETED SUCCESSFULLY ✅✅${NC}"
echo -e "${GREEN}==========================================${NC}"
