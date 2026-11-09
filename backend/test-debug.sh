#!/bin/bash

echo "🔍 Testing Patient Creation API"
echo "================================"

# Make the POST request and capture both response and status code
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/patients-api \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1985-05-15",
    "gender": "male",
    "phoneNumber": "+91 98765 43299",
    "hospitalId": "hosp-001"
  }')

# Extract status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract response body (everything except last line)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 HTTP Status Code: $HTTP_CODE"
echo "📦 Response Body: $BODY"
echo ""

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Patient created successfully!"
  
  # Try to extract ID from response
  PATIENT_ID=$(echo $BODY | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$PATIENTthen
    echo "🆔 Patient ID: $PATIENT_ID"
  else
    echo "⚠️ Could not extract patient ID from response"
  fi
else
  echo "❌ Failed to create patient (HTTP $HTTP_CODE)"
fi

echo ""
echo "📋 Checking all patients:"
curl -s http://localhost:3001/api/patients-api | python -m json.tool 2>/dev/null || echo "Failed to get patients list"
