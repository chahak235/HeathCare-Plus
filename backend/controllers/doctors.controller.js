// Point to the actual Doctor model location under controllers/models
const Doctor = require("./models/Doctor");

exports.getAllDoctors = async (req, res) => {
  try {
    const {
      specialty,
      city,
      minExperience,
      maxFee,
      limit = 20,
      offset = 0
    } = req.query;
    
    const filters = {};
    if (specialty) filters.specialty = specialty;
    if (city) filters.city = city;
    if (minExperience) filters.minExperience = parseInt(minExperience);
    if (maxFee) filters.maxFee = parseFloat(maxFee);
    filters.limit = parseInt(limit);
    filters.offset = parseInt(offset);
    
    const doctors = await Doctor.findAll(filters);
    const total = await Doctor.count(filters);
    
    res.json({
      success: true,
      data: doctors,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset + doctors.length) < total
      }
    });
  } catch (error) {
    console.error('Error in getAllDoctors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctors'
    });
  }
};

exports.searchDoctors = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters'
      });
    }
    
    const doctors = await Doctor.search(q.trim());
    
    res.json({
      success: true,
      data: doctors,
      count: doctors.length
    });
  } catch (error) {
    console.error('Error in searchDoctors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching doctors'
    });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }
    
    const doctor = await Doctor.findById(id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error in getDoctorById:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctor details'
    });
  }
};

exports.getSpecialties = async (req, res) => {
  try {
    const specialties = await Doctor.getSpecialties();
    
    res.json({
      success: true,
      data: specialties
    });
  } catch (error) {
    console.error('Error in getSpecialties:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching specialties'
    });
  }
};

exports.getTopRatedDoctors = async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const doctors = await Doctor.getTopRated(parseInt(limit));
    
    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error('Error in getTopRatedDoctors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top rated doctors'
    });
  }
};

exports.getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.params;
    
    if (!specialty) {
      return res.status(400).json({
        success: false,
        message: 'Specialty is required'
      });
    }
    
    const doctors = await Doctor.findBySpecialty(specialty);
    
    res.json({
      success: true,
      data: doctors,
      count: doctors.length
    });
  } catch (error) {
    console.error('Error in getDoctorsBySpecialty:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctors by specialty'
    });
  }
};