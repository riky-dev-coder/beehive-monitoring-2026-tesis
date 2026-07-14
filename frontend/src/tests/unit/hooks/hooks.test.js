import { describe, it, expect } from 'vitest';
import { useSensorData } from '../../../hooks/useSensorData';
import { useAlerts } from '../../../hooks/useAlerts';
import { useRecommendations } from '../../../hooks/useRecommendations';
import { useHarvestPrediction } from '../../../hooks/useHarvestPrediction';

describe('Custom Hooks', () => {
  describe('Hook Imports and Exports', () => {
    it('should export useSensorData function', () => {
      expect(typeof useSensorData).toBe('function');
    });

    it('should export useAlerts function', () => {
      expect(typeof useAlerts).toBe('function');
    });

    it('should export useRecommendations function', () => {
      expect(typeof useRecommendations).toBe('function');
    });

    it('should export useHarvestPrediction function', () => {
      expect(typeof useHarvestPrediction).toBe('function');
    });
  });

  describe('Hook Signatures', () => {
    it('useSensorData should be a callable function', () => {
      expect(useSensorData).toBeDefined();
      expect(useSensorData.length >= 0).toBe(true);
    });

    it('useAlerts should be a callable function', () => {
      expect(useAlerts).toBeDefined();
      expect(useAlerts.length >= 0).toBe(true);
    });

    it('useRecommendations should be a callable function', () => {
      expect(useRecommendations).toBeDefined();
      expect(useRecommendations.length >= 0).toBe(true);
    });

    it('useHarvestPrediction should be a callable function', () => {
      expect(useHarvestPrediction).toBeDefined();
      expect(useHarvestPrediction.length >= 0).toBe(true);
    });
  });

  describe('Hook Names', () => {
    it('useSensorData function should have correct name', () => {
      expect(useSensorData.name).toBe('useSensorData');
    });

    it('useAlerts function should have correct name', () => {
      expect(useAlerts.name).toBe('useAlerts');
    });

    it('useRecommendations function should have correct name', () => {
      expect(useRecommendations.name).toBe('useRecommendations');
    });

    it('useHarvestPrediction function should have correct name', () => {
      expect(useHarvestPrediction.name).toBe('useHarvestPrediction');
    });
  });
});

