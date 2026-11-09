import { Router } from 'express';
import { HospitalsController } from '../controllers/hospitals.controller';

const router = Router();
const controller = new HospitalsController();

// Specific routes first
router.get('/states', controller.getStates.bind(controller));
router.get('/states/:state/cities', controller.getCitiesByState.bind(controller));
router.get('/nearby', controller.getNearby.bind(controller));
router.get('/search', controller.search.bind(controller));
router.get('/city/:city', controller.getByCity.bind(controller));
router.get('/state/:state', controller.getByState.bind(controller));

// Generic id route last
router.get('/:id', controller.getHospital.bind(controller));

export default router;
