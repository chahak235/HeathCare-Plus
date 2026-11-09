import { AnalysisResult } from './medical.types';

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ErrorResponse {
    error: string;
    code: string;
    details?: Record<string, unknown>;
}

// Mock API response types for development
export interface MockAnalysisRequest {
    image: File;
    patientInfo?: {
        age?: number;
        gender?: string;
        notes?: string;
    };
}

export interface MockAnalysisResponse {
    analysisId: string;
    status: 'processing' | 'completed' | 'failed';
    results?: AnalysisResult;
    estimatedTime?: number;
}