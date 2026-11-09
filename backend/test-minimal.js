const axios = require('axios');

async function test() {
  try {
    const response = await axios.post('http://localhost:3001/api/patients-api', {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1985-05-15',
      gender: 'male',
      phoneNumber: '+91 98765 43299',
      hospitalId: 'hosp-001'
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

test();
