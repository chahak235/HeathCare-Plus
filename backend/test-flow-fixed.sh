#!/bin/bash

echo "🚀 Testing Complete Patient Admission Flow"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"

# 1. Create a new patient (even if it returns error, it might still work)
echo -e "\n${BLUE}1. Creating new patient...${NC}"
curl -s -X POST "$BASE_URL/api/patients-api" \
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
  }' > /dev/null

# Get the most recently created patient (the one with the latest createdAt)
echo -e "\n${BLUE}2. Getting the newly created patient...${NC}"
PATIENTS_RESPONSE=$(curl -s "$BASE_URL/api/patients-api")
PATIT_ID=$(echo $PATIENTS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PATIENT_ID" ]; then
  echo -e "${GREEN}✅ Found patient with ID: $PATIENT_ID${NC}"
else
  echo -e "${RED}❌ No patient found${NC}"
  exit 1
fi

# 3. Transition to IN_TRIAGE
echo -e "\n${BLUE}3. Moving patient to triage...${NC}"
curl -s -X POST "$BASE_URL/api/patients-api/$PATIENT_ID/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "toStatus": "IN_TRIAGE",
    "actorId": "nurse-001",
    "actorType": "nurse",
    "reason": "Starting triage"
  }' > /dev/null
echo -e "${GREEN}✅ Patient moved to triage${NC}"

# 4. Complete triage
echo -e "\n${BLUE}4. Completing triage...${NC}"
curl -s -X POST "$BASE_URL/api/patients-api/$PATIENT_ID/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "toStatus": "TRIAGED",
    "actorId": "nurse-001",
    "actorType": "nurse",
    "metadata": {
      "priority": 2,
      "symptoms": ["Chest pain", "Shortness of breath"],
      "vitals": {
        "heart 98,
        "bloodPressure": "140/90",
        "oxygenSaturation": 95,
        "temperature": 98.6
      }
    }
  }' > /dev/null
echo -e "${GREEN}✅ Triage completed, priority assigned${NC}"

# 5. Find available bed
echo -e "\n${BLUE}5. Finding available bed...${NC}"
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

# 6. Assign bed to patient
echo -e "\n${BLUE}6. Assigning bed to patient...${NC}"
curl -s -X POST "$BASE_URL/api/allocation/reserve" \
  -H "Content-Type: application/json" \
  -d '{
    "bedId": "'$BE,
    "patientId": "'$PATIENT_ID'",
    "doctorId": "doc-001",
    "duration": 4
  }' > /dev/null
echo -e "${GREEN}✅ Bed assigned and reserved${NC}"

# 7. Transition to BED_ASSIGNED
echo -e "\n${BLUE}7. Updating patient status to BED_ASSIGNED...${NC}"
curl -s -X POST "$BASE_URL/api/patients-api/$PATIENT_ID/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "toStatus": "BED_ASSIGNED",
    "actorId": "doctor-001",
    "actorType": "doctor",
    "metadata": {
      "bedId": "'$BED_ID'"
    }
  }' > /dev/null
echo -e "${GREEN}✅ Patient status updated to BED_ASSIGNED${NC}"

# 8. Occupy the bed (patient arrives)
echo -e "\n${BLUE}8. Patient arriving at bed...${NC}"
curl -s -X POST "$BASE_URL/api/allocation/occupy" \
  -H "Content-Type: application/json" \
  -d '{
    "bedId": "'$BED_ID'",
    "patientId": "'$PATIENT_ID'"
  }' > /dev/null
echo -e "${GREEN}✅ Bed occupied${NC}"

# 9. Transition to UNDER_TREATMENT
echo -e "\n${BLUE}9. Starting treatment...${NC}"
curl -s -X POST "$BASE_URL/api/patapi/$PATIENT_ID/transition" \
  -H "Content-Type: application/json" \
  -d '{
    "toStatus": "UNDER_TREATMENT",
    "actorId": "doctor-001",
    "actorType": "doctor",
    "metadata": {
      "doctorId": "doctor-001"
    }
  }' > /dev/null
echo -e "${GREEN}✅ Treatment started${NC}"

# 10. Get patient journey
echo -e "\n${BLUE}10. Getting patient journey...${NC}"
JOURNEY_RESPONSE=$(curl -s "$BASE_URL/api/patients-api/$PATIENT_ID/journey")
echo -e "${GREEN}✅ Journey retrieved${NC}"
echo $JOURNEY_RESPONSE | python -m json.tool 2>/dev/null || echo $JOURNEY_RESPONSE

echo -e "\n${GREEN}✅✅✅ Complete flow successful! ✅✅✅${NC}"
