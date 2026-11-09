import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Hospital } from '../entities/Hospital.entity';

export class HospitalController {
  private hospitalRepository = AppDataSource.getRepository(Hospital);

  async findNearby(req: Request, res: Response) {
    try {
      const { lat, lng, radius = 10 } = req.body;

      // Using PostGIS for spatial queries
      const hospitals = await this.hospitalRepository
        .createQueryBuilder('hospital')
        .where(
          `ST_DWithin(
            ST_MakePoint(hospital.longitude, hospital.latitude)::geography,
            ST_MakePoint(:lng, :lat)::geography,
            :radius * 1000
          )`,
          { lat, lng, radius }
        )
        .addSelect(
          `ST_Distance(
            ST_MakePoint(hospital.longitude, hospital.latitude)::geography,
            ST_MakePoint(:lng, :lat)::geography
          )`,
          'distance'
        )
        .orderBy('distance', 'ASC')
        .getMany();

      return res.json({
        success: true,
        data: hospitals
      });
    } catch (error) {
      console.error('Find nearby hospitals error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
