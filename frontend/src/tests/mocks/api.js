import { vi } from 'vitest';

export const mockApiResponse = {
  data: {
    sensors: [
      {
        id: 1,
        temperatura: 35.5,
        humedad: 60,
        peso: 45000,
        timestamp: '2026-03-29T10:00:00Z',
      },
      {
        id: 2,
        temperatura: 36.0,
        humedad: 65,
        peso: 46000,
        timestamp: '2026-03-29T10:15:00Z',
      },
    ],
    alerts: [
      {
        id: 1,
        tipo: 'temperature',
        severity: 'high',
        mensaje: 'Temperatura muy alta',
        leida: false,
        resuelta: false,
        timestamp: '2026-03-29T10:00:00Z',
      },
    ],
    recommendations: [
      {
        id: 1,
        tipo: 'feeding',
        descripcion: 'Aumentar cantidad de alimento',
        prioridad: 'high',
        timestamp: '2026-03-29T10:00:00Z',
      },
    ],
  },
  status: 200,
  statusText: 'OK',
};

export const createMockApiInstance = () => ({
  get: vi.fn().mockResolvedValue(mockApiResponse),
  post: vi.fn().mockResolvedValue(mockApiResponse),
  patch: vi.fn().mockResolvedValue(mockApiResponse),
  delete: vi.fn().mockResolvedValue({ data: { success: true } }),
  request: vi.fn().mockResolvedValue(mockApiResponse),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
});

export const mockApiError = new Error('API Request failed');
mockApiError.response = {
  status: 500,
  data: { error: 'Internal Server Error' },
};
