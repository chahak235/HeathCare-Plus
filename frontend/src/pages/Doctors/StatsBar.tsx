import React from 'react';
import { Card } from '../../components/ui/Card';

interface StatsBarProps {
    doctorsCount: number;
    avgSatisfaction: number;
    specialtiesCount: number;
}

const StatsBar: React.FC<StatsBarProps> = ({ doctorsCount, avgSatisfaction, specialtiesCount }) => (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center p-6">
            <div className="text-3xl font-bold text-primary-600 mb-2">{doctorsCount}+</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Verified Doctors</div>
        </Card>
        <Card className="text-center p-6">
            <div className="text-3xl font-bold text-primary-600 mb-2">{avgSatisfaction}%</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Patient Satisfaction</div>
        </Card>
        <Card className="text-center p-6">
            <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Emergency Support</div>
        </Card>
        <Card className="text-center p-6">
            <div className="text-3xl font-bold text-primary-600 mb-2">{specialtiesCount}+</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Specialties Covered</div>
        </Card>
    </div>
);
export default StatsBar;

