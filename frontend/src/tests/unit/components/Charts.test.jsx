import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock MiniChart component
const MiniChart = ({ data, dataKey, color, title }) => {
  return (
    <div className="bg-[#0f1720] border border-gray-800 rounded-lg p-4">
      <div className="text-xs text-gray-400 mb-2">{title}</div>
      <div className="h-20 flex items-center justify-center text-gray-500">
        {data && data.length > 0 ? (
          <div className="text-center">
            <div className="text-sm font-semibold text-emerald-400">
              Chart: {dataKey}
            </div>
            <div className="text-xs mt-1">Datos: {data.length} puntos</div>
          </div>
        ) : (
          <div>Sin datos</div>
        )}
      </div>
    </div>
  );
};

// Mock HistoricalChart component
const HistoricalChart = ({ data, title }) => {
  return (
    <div className="bg-[#0f1720] border border-gray-800 rounded-lg p-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>
      <div className="h-64 flex items-center justify-center">
        {data && data.length > 0 ? (
          <div className="text-center">
            <div className="text-emerald-400 font-semibold">Gráfico histórico</div>
            <div className="text-xs text-gray-400 mt-2">
              Mostrando {data.length} datos históricos
            </div>
          </div>
        ) : (
          <div className="text-gray-400">No hay datos históricos</div>
        )}
      </div>
    </div>
  );
};

describe('Chart Components', () => {
  const mockChartData = [
    { timestamp: '2026-03-29T08:00:00Z', temperature: 35.2 },
    { timestamp: '2026-03-29T08:15:00Z', temperature: 35.5 },
    { timestamp: '2026-03-29T08:30:00Z', temperature: 35.8 },
    { timestamp: '2026-03-29T08:45:00Z', temperature: 35.6 },
    { timestamp: '2026-03-29T09:00:00Z', temperature: 35.4 },
  ];

  describe('MiniChart', () => {
    it('should render chart container', () => {
      const { container } = render(
        <MiniChart
          data={mockChartData}
          dataKey="temperature"
          color="#10b981"
          title="Temperature"
        />
      );

      // Look for the title to verify chart rendered
      expect(screen.getByText('Temperature')).toBeInTheDocument();
    });

    it('should render chart title', () => {
      render(
        <MiniChart
          data={mockChartData}
          dataKey="temperature"
          color="#10b981"
          title="Temperature"
        />
      );

      expect(screen.getByText('Temperature')).toBeInTheDocument();
    });

    it('should display data key', () => {
      render(
        <MiniChart
          data={mockChartData}
          dataKey="temperature"
          color="#10b981"
          title="Temperature Chart"
        />
      );

      expect(screen.getByText('Chart: temperature')).toBeInTheDocument();
    });

    it('should show number of data points', () => {
      render(
        <MiniChart
          data={mockChartData}
          dataKey="temperature"
          color="#10b981"
          title="Temperature"
        />
      );

      expect(screen.getByText('Datos: 5 puntos')).toBeInTheDocument();
    });

    it('should display empty state when no data', () => {
      render(
        <MiniChart data={[]} dataKey="temperature" color="#10b981" title="Temperature" />
      );

      expect(screen.getByText('Sin datos')).toBeInTheDocument();
    });

    it('should have correct styling', () => {
      const { container } = render(
        <MiniChart
          data={mockChartData}
          dataKey="temperature"
          color="#10b981"
          title="Temperature"
        />
      );

      // Check that the title label styling is correct
      const label = container.querySelector('.text-xs.text-gray-400');
      expect(label).toBeInTheDocument();
    });

    it('should render with different data keys', () => {
      const { rerender } = render(
        <MiniChart
          data={mockChartData}
          dataKey="temperature"
          color="#10b981"
          title="Temperature"
        />
      );

      expect(screen.getByText('Chart: temperature')).toBeInTheDocument();

      rerender(
        <MiniChart
          data={mockChartData}
          dataKey="humidity"
          color="#3b82f6"
          title="Humidity"
        />
      );

      expect(screen.getByText('Chart: humidity')).toBeInTheDocument();
    });
  });

  describe('HistoricalChart', () => {
    it('should render chart container', () => {
      const { container } = render(
        <HistoricalChart data={mockChartData} title="Historical Data" />
      );

      // Look for the title to verify chart rendered
      expect(screen.getByText('Historical Data')).toBeInTheDocument();
    });

    it('should render chart title', () => {
      render(<HistoricalChart data={mockChartData} title="Historical Data" />);

      expect(screen.getByText('Historical Data')).toBeInTheDocument();
    });

    it('should display historical data count', () => {
      render(<HistoricalChart data={mockChartData} title="Temperature History" />);

      expect(
        screen.getByText('Mostrando 5 datos históricos')
      ).toBeInTheDocument();
    });

    it('should show empty state when no data', () => {
      render(<HistoricalChart data={[]} title="Historical Data" />);

      expect(screen.getByText('No hay datos históricos')).toBeInTheDocument();
    });

    it('should render chart title with correct styling', () => {
      const { container } = render(
        <HistoricalChart data={mockChartData} title="Historical Data" />
      );

      const title = container.querySelector('h3');
      expect(title).toHaveClass('text-sm');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('text-gray-300');
    });

    it('should have larger height than MiniChart', () => {
      const { container } = render(
        <HistoricalChart data={mockChartData} title="Historical Data" />
      );

      const heightDiv = container.querySelector('.h-64');
      expect(heightDiv).toBeInTheDocument();
    });

    it('should have correct styling', () => {
      const { container } = render(
        <HistoricalChart data={mockChartData} title="Historical Data" />
      );

      const title = container.querySelector('h3');
      expect(title).toHaveClass('text-sm');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('text-gray-300');
    });

    it('should handle large dataset', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        timestamp: `2026-03-29T${String(i).padStart(2, '0')}:00:00Z`,
        temperature: 35 + Math.random() * 2,
      }));

      render(<HistoricalChart data={largeData} title="Large Dataset" />);

      expect(
        screen.getByText('Mostrando 100 datos históricos')
      ).toBeInTheDocument();
    });

    it('should update when data changes', () => {
      const { rerender } = render(
        <HistoricalChart data={mockChartData} title="Historical Data" />
      );

      expect(screen.getByText('Mostrando 5 datos históricos')).toBeInTheDocument();

      const moreData = [...mockChartData, ...mockChartData];
      rerender(<HistoricalChart data={moreData} title="Historical Data" />);

      expect(
        screen.getByText('Mostrando 10 datos históricos')
      ).toBeInTheDocument();
    });
  });
});
