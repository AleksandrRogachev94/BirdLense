import React from 'react';
import { Bird, Clock, Leaf } from 'lucide-react';
import { BirdSighting } from '../types';

interface StatsProps {
  sightings: BirdSighting[];
}

export function Stats({ sightings }: StatsProps) {
  const uniqueSpecies = new Set(sightings.map((s) => s.species)).size;
  const totalDuration = sightings.reduce((sum, s) => sum + s.duration, 0);
  const totalFeed = sightings.reduce((sum, s) => sum + (s.feedAmount || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto px-4 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3">
          <Bird className="w-6 h-6 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Species Spotted
          </h3>
        </div>
        <p className="text-3xl font-bold text-gray-900 mt-2">{uniqueSpecies}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Total Duration
          </h3>
        </div>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          {Math.round(totalDuration / 60)}m
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3">
          <Leaf className="w-6 h-6 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-800">Feed Consumed</h3>
        </div>
        <p className="text-3xl font-bold text-gray-900 mt-2">{totalFeed}g</p>
      </div>
    </div>
  );
}
