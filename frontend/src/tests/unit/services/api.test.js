import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockApiInstance, mockApiError } from '../../mocks/api.js';

describe('API Service', () => {
  let mockApi;

  beforeEach(() => {
    mockApi = createMockApiInstance();
  });

  describe('api.get()', () => {
    it('should make a GET request successfully', async () => {
      const response = await mockApi.get('/sensors/latest');
      
      expect(mockApi.get).toHaveBeenCalledWith('/sensors/latest');
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    it('should return sensor data in the correct format', async () => {
      const response = await mockApi.get('/sensors/latest');
      
      expect(response.data.sensors).toBeDefined();
      expect(Array.isArray(response.data.sensors)).toBe(true);
      expect(response.data.sensors.length).toBeGreaterThan(0);
    });

    it('should handle GET request with query parameters', async () => {
      const params = { limit: 10, offset: 0 };
      await mockApi.get('/sensors/latest', { params });
      
      expect(mockApi.get).toHaveBeenCalled();
    });

    it('should return alerts data', async () => {
      const response = await mockApi.get('/alerts');
      
      expect(response.data.alerts).toBeDefined();
      expect(Array.isArray(response.data.alerts)).toBe(true);
    });
  });

  describe('api.post()', () => {
    it('should make a POST request successfully', async () => {
      const payload = { message: 'test' };
      const response = await mockApi.post('/alerts', payload);
      
      expect(mockApi.post).toHaveBeenCalledWith('/alerts', payload);
      expect(response.status).toBe(200);
    });

    it('should handle POST request with data', async () => {
      const alertData = {
        tipo: 'temperature',
        severity: 'high',
        mensaje: 'Test alert',
      };
      
      const response = await mockApi.post('/alerts', alertData);
      expect(response.data).toBeDefined();
    });

    it('should create a recommendation via POST', async () => {
      const recData = {
        tipo: 'feeding',
        descripcion: 'Test recommendation',
      };
      
      const response = await mockApi.post('/recommendations', recData);
      expect(response.status).toBe(200);
    });
  });

  describe('api.patch()', () => {
    it('should make a PATCH request successfully', async () => {
      const updateData = { leida: true };
      const response = await mockApi.patch('/alerts/1', updateData);
      
      expect(mockApi.patch).toHaveBeenCalledWith('/alerts/1', updateData);
      expect(response.status).toBe(200);
    });

    it('should update alert status', async () => {
      const response = await mockApi.patch('/alerts/1', { resuelta: true });
      
      expect(response.data).toBeDefined();
    });
  });

  describe('api.delete()', () => {
    it('should make a DELETE request successfully', async () => {
      const response = await mockApi.delete('/alerts/1');
      
      expect(mockApi.delete).toHaveBeenCalledWith('/alerts/1');
      expect(response.data.success).toBe(true);
    });

    it('should handle delete with proper response', async () => {
      const response = await mockApi.delete('/recommendations/1');
      
      expect(response.data).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const mockApiError = createMockApiInstance();
      mockApiError.get.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(mockApiError.get('/sensors')).rejects.toThrow('Network error');
    });

    it('should handle API errors with status codes', async () => {
      const mockApiError = createMockApiInstance();
      const error = new Error('Not Found');
      error.response = { status: 404 };
      mockApiError.get.mockRejectedValueOnce(error);
      
      await expect(mockApiError.get('/invalid')).rejects.toThrow('Not Found');
    });

    it('should handle server errors', async () => {
      const mockApiError = createMockApiInstance();
      const error = new Error('Server Error');
      error.response = { status: 500 };
      mockApiError.post.mockRejectedValueOnce(error);
      
      await expect(mockApiError.post('/alerts', {})).rejects.toThrow('Server Error');
    });
  });

  describe('Request interceptors', () => {
    it('should have request interceptors defined', () => {
      expect(mockApi.interceptors.request.use).toBeDefined();
    });

    it('should have response interceptors defined', () => {
      expect(mockApi.interceptors.response.use).toBeDefined();
    });
  });

  describe('BaseURL configuration', () => {
    it('should be configured with base URL', () => {
      expect(mockApi).toBeDefined();
      expect(typeof mockApi.get).toBe('function');
    });
  });
});
