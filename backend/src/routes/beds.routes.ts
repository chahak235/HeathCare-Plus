import { Router } from 'express';
import { BedsController } from '../controllers/beds.controller';

const router = Router();
const controller = new BedsController();

// Get all beds (with optional filters)
router.get('/', controller.getAllBeds.bind(controller));

// Get bed statistics
router.get('/stats', controller.getBedStats.bind(controller));

// Create a bed (hospital adding to its inventory)
router.post('/', controller.createBed.bind(controller));

// Get bed by ID
router.get('/:id', controller.getBedById.bind(controller));

// Update a bed (status, ward, equipment, etc.)
router.patch('/:id', controller.updateBed.bind(controller));

// Delete a bed
router.delete('/:id', controller.deleteBed.bind(controller));

export default router;
