const { Router } = require('express');
const IndianHospitalsController = require('../controllers/indian-hospitals.controller');

const router = Router();

console.log('📍 Registering Indian hospitals routes...');

// Get hospitals by city
router.get('/city/:city', IndianHospitalsController.getByCity);

// Get hospitals by state
router.get('/state/:state', IndianHospitalsController.getByState);

// Get hospitals near location
router.get('/nearby', IndianHospitalsController.getNearby);

// Search hospitals
router.get('/search', IndianHospitalsController.search);

// Get all states
router.get('/states', IndianHospitalsController.getStates);

// Get cities by state
router.get('/states/:state/cities', IndianHospitalsController.getCitiesByState);

// Get hospital details
router.get('/:id', IndianHospitalsController.getHospital);

console.log('✅ Indian hospitals routes registered:');
console.log('   GET /api/india/hospitals/city/:city');
console.log('   GET /api/india/hospitals/state/:state');
console.log('   GET /api/india/hospitals/nearby?lat=&lng=');
console.log('   GET /api/india/hospitals/search?q=');
console.log('   GET /api/india/hospitals/states');
console.log('   GET /api/india/hospitals/states/:state/cities');
console.log('   GET /api/india/hospitals/:id');

module.exports = router;