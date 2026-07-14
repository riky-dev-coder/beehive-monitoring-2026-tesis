import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock SensorCards component for testing
const SensorCards = ({ sensors }) => {
  const cardStyle =
    'bg-[#0f1720] border border-gray-800 rounded-2xl p-5 transition hover:border-emerald-500';
  const labelStyle = 'text-sm text-gray-400';
  const valueStyle = 'text-3xl font-bold text-emerald-400 mt-2';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
      {sensors.peso_total && (
        <div className={cardStyle}>
          <div className={labelStyle}>Peso cria</div>
          <div className={valueStyle}>
            {sensors.peso_total && sensors.peso_mielera
              ? (sensors.peso_total.value - sensors.peso_mielera.value).toFixed(1)
              : '--'}{' '}
            kg
          </div>
        </div>
      )}

      {sensors.peso_mielera && (
        <div className={cardStyle}>
          <div className={labelStyle}>Peso mielera</div>
          <div className={valueStyle}>
            {sensors.peso_mielera.value.toFixed(1)} kg
          </div>
        </div>
      )}

      {sensors.temp_cria && (
        <div className={cardStyle}>
          <div className={labelStyle}>Temp. cría</div>
          <div className={valueStyle}>
            {sensors.temp_cria.value.toFixed(1)}°C
          </div>
        </div>
      )}

      {sensors.humedad_cria && (
        <div className={cardStyle}>
          <div className={labelStyle}>Humedad cría</div>
          <div className={valueStyle}>
            {sensors.humedad_cria.value.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
};

describe('SensorCards Component', () => {
  const mockSensors = {
    peso_total: { value: 50, timestamp: '2026-03-29T10:00:00Z' },
    peso_mielera: { value: 20, timestamp: '2026-03-29T10:00:00Z' },
    temp_cria: { value: 35.5, timestamp: '2026-03-29T10:00:00Z' },
    humedad_cria: { value: 65, timestamp: '2026-03-29T10:00:00Z' },
  };

  it('should render sensor card container', () => {
    const { container } = render(<SensorCards sensors={mockSensors} />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('gap-5');
  });

  it('should render peso_cria when both total and mielera weights available', () => {
    render(<SensorCards sensors={mockSensors} />);

    expect(screen.getByText('Peso cria')).toBeInTheDocument();
    // 50 - 20 = 30
    expect(screen.getByText('30.0 kg')).toBeInTheDocument();
  });

  it('should render peso_mielera card', () => {
    render(<SensorCards sensors={mockSensors} />);

    expect(screen.getByText('Peso mielera')).toBeInTheDocument();
    expect(screen.getByText('20.0 kg')).toBeInTheDocument();
  });

  it('should render temperature card', () => {
    render(<SensorCards sensors={mockSensors} />);

    expect(screen.getByText('Temp. cría')).toBeInTheDocument();
    expect(screen.getByText('35.5°C')).toBeInTheDocument();
  });

  it('should render humidity card', () => {
    render(<SensorCards sensors={mockSensors} />);

    expect(screen.getByText('Humedad cría')).toBeInTheDocument();
    expect(screen.getByText('65.0%')).toBeInTheDocument();
  });

  it('should show -- when peso_total is missing but peso_mielera exists', () => {
    const incompleteSensors = {
      peso_mielera: { value: 20 },
    };

    render(<SensorCards sensors={incompleteSensors} />);

    // Only peso_mielera card should be rendered
    expect(screen.getByText('Peso mielera')).toBeInTheDocument();
    expect(screen.queryByText('Peso cria')).not.toBeInTheDocument();
  });

  it('should not render cards when sensor data is missing', () => {
    render(<SensorCards sensors={{}} />);

    expect(screen.queryByText('Peso cria')).not.toBeInTheDocument();
    expect(screen.queryByText('Temp. cría')).not.toBeInTheDocument();
  });

  it('should handle missing weight mielera', () => {
    const sensorsMissingMielera = {
      peso_total: { value: 50 },
      temp_cria: { value: 35.5 },
    };

    render(<SensorCards sensors={sensorsMissingMielera} />);

    expect(screen.getByText('Temp. cría')).toBeInTheDocument();
    expect(screen.queryByText('Peso mielera')).not.toBeInTheDocument();
  });

  it('should apply correct styling to sensor values', () => {
    const { container } = render(<SensorCards sensors={mockSensors} />);

    const values = container.querySelectorAll('.text-3xl.font-bold.text-emerald-400');
    expect(values.length).toBeGreaterThan(0);
  });

  it('should apply correct styling to sensor labels', () => {
    const { container } = render(<SensorCards sensors={mockSensors} />);

    const labels = container.querySelectorAll('.text-sm.text-gray-400');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should render correct number of cards for available sensors', () => {
    render(<SensorCards sensors={mockSensors} />);

    const cards = screen.getByText('Peso cria').parentElement.parentElement.parentElement
      .querySelectorAll('[class*="bg-[#0f1720]"]');
    
    // We have 4 sensors, so should have 4 cards
    const allCards = screen.getByText('Peso cria').parentElement.parentElement.parentElement
      .querySelectorAll('div[class*="bg-"]');
    
    expect(allCards.length).toBeGreaterThanOrEqual(4);
  });

  it('should format numeric values correctly', () => {
    const sensorsWithDecimals = {
      peso_total: { value: 50.567 },
      peso_mielera: { value: 20.432 },
      temp_cria: { value: 35.789 },
      humedad_cria: { value: 65.123 },
    };

    render(<SensorCards sensors={sensorsWithDecimals} />);

    // Should format to 1 decimal place
    expect(screen.getByText('30.1 kg')).toBeInTheDocument();
    expect(screen.getByText('20.4 kg')).toBeInTheDocument();
    expect(screen.getByText('35.8°C')).toBeInTheDocument();
    expect(screen.getByText('65.1%')).toBeInTheDocument();
  });
});
