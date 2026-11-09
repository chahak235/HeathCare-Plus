import React, { useState } from 'react';

interface IndianCity {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

const INDIAN_CITIES: IndianCity[] = [
  { id: '1', name: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
  { id: '2', name: 'Delhi', state: 'Delhi', latitude: 28.7041, longitude: 77.1025 },
  { id: '3', name: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { id: '4', name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { id: '5', name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { id: '6', name: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
  { id: '7', name: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
  { id: '8', name: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  { id: '9', name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
  { id: '10', name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 },
];

interface IndianCitySelectorProps {
  onCitySelect: (city: IndianCity) => void;
  selectedCity?: IndianCity;
}

const IndianCitySelector: React.FC<IndianCitySelectorProps> = ({ onCitySelect, selectedCity }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCities = INDIAN_CITIES.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4 text-center">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Select Indian City
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search city or state..."
            className="w-full pl-4 pr-10 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900 dark:text-white">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-2 custom-scrollbar">
        {filteredCities.map((city) => (
          <div
            key={city.id}
            className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 backdrop-blur-md border shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
              selectedCity?.id === city.id
                ? 'bg-primary-50/50 dark:bg-primary-900/30 border-primary-500 dark:border-primary-500 ring-1 ring-primary-500'
                : 'bg-white/40 dark:bg-slate-800/40 border-white/50 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
            onClick={() => onCitySelect(city)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-0.5">{city.name}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{city.state}</p>
              </div>
              <div className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded-md">
                {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCity && (
        <div className="mt-6 p-4 bg-emerald-50/50 dark:bg-emerald-900/20 backdrop-blur-sm rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Selected: <span className="font-bold">{selectedCity.name}, {selectedCity.state}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default IndianCitySelector;