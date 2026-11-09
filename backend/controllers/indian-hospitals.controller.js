const IndianHospital = require('./models/IndianHospital');

class IndianHospitalsController {
  // Get hospitals by city
  static async getByCity(req, res) {
    try {
      const { city } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      
      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'City parameter is required'
        });
      }

      const hospitals = await IndianHospital.findByCity(city, limit);
      
      res.json({
        success: true,
        count: hospitals.length,
        data: hospitals
      });
    } catch (error) {
      console.error('Get hospitals by city error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get hospitals by state
  static async getByState(req, res) {
    try {
      const { state } = req.params;
      const limit = parseInt(req.query.limit) || 30;
      
      if (!state) {
        return res.status(400).json({
          success: false,
          message: 'State parameter is required'
        });
      }

      const hospitals = await IndianHospital.findByState(state, limit);
      
      res.json({
        success: true,
        count: hospitals.length,
        data: hospitals
      });
    } catch (error) {
      console.error('Get hospitals by state error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get hospitals near location
  static async getNearby(req, res) {
    try {
      const { lat, lng } = req.query;
      const radius = parseInt(req.query.radius) || 50;
      const limit = parseInt(req.query.limit) || 20;
      
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude parameters are required'
        });
      }

      const hospitals = await IndianHospital.findNearby(
        parseFloat(lat),
        parseFloat(lng),
        radius,
        limit
      );
      
      res.json({
        success: true,
        count: hospitals.length,
        data: hospitals
      });
    } catch (error) {
      console.error('Get nearby hospitals error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Search hospitals
  static async search(req, res) {
    try {
      const { q } = req.query;
      const limit = parseInt(req.query.limit) || 20;
      
      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }

      const hospitals = await IndianHospital.search(q, limit);
      
      res.json({
        success: true,
        count: hospitals.length,
        data: hospitals
      });
    } catch (error) {
      console.error('Search hospitals error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get all states
  static async getStates(req, res) {
    try {
      const states = await IndianHospital.getStates();
      
      res.json({
        success: true,
        count: states.length,
        data: states
      });
    } catch (error) {
      console.error('Get states error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get cities by state
  static async getCitiesByState(req, res) {
    try {
      const { state } = req.params;
      
      if (!state) {
        return res.status(400).json({
          success: false,
          message: 'State parameter is required'
        });
      }

      const cities = await IndianHospital.getCitiesByState(state);
      
      res.json({
        success: true,
        count: cities.length,
        data: cities
      });
    } catch (error) {
      console.error('Get cities by state error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get hospital details
  static async getHospital(req, res) {
    try {
      const { id } = req.params;
      
      const hospital = await IndianHospital.findById(parseInt(id));
      
      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: 'Hospital not found'
        });
      }
      
      res.json({
        success: true,
        data: hospital
      });
    } catch (error) {
      console.error('Get hospital error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = IndianHospitalsController;