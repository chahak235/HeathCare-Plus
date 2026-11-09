import React from 'react';
import { render, screen } from '@testing-library/react';
import MapPrediction from '../pages/MapPrediction';

// Mock the IndianHealthAPI
jest.mock('../services/indian-health-api', () => ({
  __esModule: true,
  default: {
    getHospitalsByCity: jest.fn(() => Promise.resolve([
      {
        id: '1',
        name: 'Apollo Hospital Delhi',
        address: 'Mathura Road, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        latitude: 28.5562,
        longitude: 77.1000,
        type: 'Private',
        beds: 700,
        availableBeds: 150,
        phone: '+91-11-71717171',
        ayushmanBharat: true,
        emergencyServices: true,
      },
    ])),
  },
}));

describe('MapPrediction', () => {
  it('shows Indian city selector', () => {
    render(<MapPrediction />);
    expect(screen.getByText('Select Indian City')).toBeInTheDocument();
    expect(screen.getByText('Delhi')).toBeInTheDocument();
    expect(screen.getByText('Mumbai')).toBeInTheDocument();
  });

  it('displays hospitals for selected city', async () => {
    render(<MapPrediction />);
    
    // Wait for hospitals to load
    await screen.findByText('Apollo Hospital Delhi');
    expect(screen.getByText('Beds: 150 available')).toBeInTheDocument();
  });
});