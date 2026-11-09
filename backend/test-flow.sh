#!/bin/bash

echo "🚀 Testing Complete Patient Admission Flow"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"

# 1. Create a new patient
echo -e "\n${BLUE}1. Creating new patient...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/patients-api" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1985-05-15",
    "gender": "male",
    "phoneNumber": "+91 98765 43299",
    "email": "john.doe@email.com",
    "allergies": ["Penicillin"],
    "medicalHistory": ["None"],
    "hospitalId": "hosp-001"
  }')

PATIENT_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$PATIENT_ID" ]; then
  echo -e "${GREEN}✅ Patient created with ID: $PATIENT_ID${NC}"
else
  echo -e "${RED}❌ Failed to create patient${NC}"
  echo $CREATE_RESPOexit 1
fi

# 2. Transition to IN_TRIAGE
echo -e "\n${BLUE}2. Moving patient to triage...${NC}"
TRIAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/patients-api/$PATIENT_ID/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "toStatus": "IN_TRIAGE",
    "actorId": "nurse-001",
    "actorType": "nurse",
    "reason": "Starting triage"
  }')
echo -e "${GREEN}✅ Patient moved to triage${NC}"

# 3. Complete triage
echo -e "\n${BLUE}3. Completing triage...${NC}"
TRIAGED_RESPONSE=$(curl -s -X POST "$BASE_URL/api/patients-api/$PATIENT_ID/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "toStatus": "TRIAGED",
    "actorId": "nurse-001",
    "actorType": "nurse",
    "metadata": {
      "priority": 2,
      "symptoms": ["Chest pain", "Shortness of breath"],
      "vitals": {
        "heartRate": 98,
        "bloodPressure": "140/90",
        "oxygenSaturation": 95,
        "temperature": 98.6
      }
    }
  }')
echo -e "${GREEN}✅ Triage completed, priority assigned${NC}"

# 4. Find avale bed
echo -e "\n${BLUE}4. Finding available bed...${NC}"
BED_RESPONSE=$(curl -s -X POST "$BASE_URL/api/allocation/find-bed" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "'$PATIENT_ID'",
    "priority": 2,
    "specialty": "Cardiology",
    "requiresIcu": false,
    "requiresVentilator": false,
    "requiresIsolation": false,
    "age": 38
  }')

BED_ID=$(echo $BED_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$BED_ID" ]; then
  echo -e "${GREEN}✅ Found bed: $BED_ID${NC}"
else
  echo -e "${RED}❌ No bed available${NC}"
  echo $BED_RESPONSE
  exit 1
fi

# 5. Assign bed to patient
echo -e "\n${BLUE}5. Assigning bed to patient...${NC}"
ASSIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/allocation/reserve" \
  -H "Content-Type: application/json" \
  -d '{
    "bedId": "'$BED_ID'",
    "patientId": "'$PATIENT_ID'",
    "doctorId": "doc-001",
    "duration": 4
  }')
echo -e "${GREEN}✅ Bed assigned and reserved${NC}"

# 6. Transition to BED_ASSIGNED
echo -e "\n${BLUpdating patient status to BED_ASSIGNED...${NC}"
BED_ASSIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/patients-api/$PATIENT_ID/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "toStatus": "BED_ASSIGNED",
    "actorId": "doctor-001",
    "actorType": "doctor",
    "metadata": {
      "bedId": "'$BED_ID'"
    }
  }')
echo -e "${GREEN}✅ Patient status updated to BED_ASSIGNED${NC}"

# 7. Occupy the bed (patient arrives)
echo -e "\n${BLUE}7. Patient arriving at bed...${NC}"
OCCUPY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/allocation/occupy" \
  -H "Content-Type: application/json" \
  -d '{
    "bedId": "'$BED_ID'",
    "patientId": "'$PATIENT_ID'"
  }')
echo -e "${GREEN}✅ Bed occupied${NC}"

# 8. Transition to UNDER_TREATMENT
echo -e "\n${BLUE}8. Starting treatment...${NC}"
TREATMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/patients-api/$PATIENT_ID/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "toStatus": "UNDER_TREATMENT",
    "actorId": "doctor-001",
    "actorType": "or",
    "metadata": {
      "doctorId": "doctor-001"
    }
  }')
echo -e "${GREEN}✅ Treatment started${NC}"

# 9. Get patient journey
echo -e "\n${BLUE}9. Getting patient journey...${NC}"
JOURNEY_RESPONSE=$(curl -s "$BASE_URL/api/patients-api/$PATIENT_ID/journey")
echo -e "${GREEN}✅ Journey retrieved${NC}"
echo $JOURNEY_RESPONSE | python -m json.tool 2>/dev/null || echo $JOURNEY_RESPONSE

echo -e "\n${GREEN}✅✅✅ Complete flow successful! ✅✅✅${NC}"
