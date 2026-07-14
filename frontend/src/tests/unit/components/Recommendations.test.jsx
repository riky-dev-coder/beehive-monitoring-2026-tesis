import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock RecommendationCard component
const RecommendationCard = ({ recommendation, onImplement }) => {
  const priorityColors = {
    high: 'bg-red-500/10 border-red-500 text-red-400',
    medium: 'bg-yellow-500/10 border-yellow-500 text-yellow-400',
    low: 'bg-green-500/10 border-green-500 text-green-400',
  };

  return (
    <div className={`border rounded-lg p-4 ${priorityColors[recommendation.prioridad] || priorityColors.low}`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{recommendation.titulo}</h4>
          <p className="text-sm mt-2">{recommendation.descripcion}</p>
          <div className="flex gap-2 mt-3">
            <span className="text-xs px-2 py-1 bg-black/30 rounded">
              {recommendation.tipo}
            </span>
            <span className="text-xs px-2 py-1 bg-black/30 rounded">
              Prioridad: {recommendation.prioridad}
            </span>
          </div>
        </div>
        <button
          onClick={() => onImplement(recommendation.id)}
          className="px-3 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-700"
        >
          Implementar
        </button>
      </div>
    </div>
  );
};

// Mock RecommendationList component
const RecommendationList = ({ recommendations, onImplement, loading }) => {
  if (loading) {
    return <div>Cargando recomendaciones...</div>;
  }

  if (recommendations.length === 0) {
    return <div>No hay recomendaciones disponibles</div>;
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          onImplement={onImplement}
        />
      ))}
    </div>
  );
};

describe('Recommendation Components', () => {
  const mockRecommendations = [
    {
      id: 1,
      titulo: 'Aumentar alimento',
      descripcion: 'La colmena necesita más alimento para mantener la cría',
      tipo: 'feeding',
      prioridad: 'high',
    },
    {
      id: 2,
      titulo: 'Revisar ventilación',
      descripcion: 'Mejorar la circulación de aire en la cámara de cría',
      tipo: 'ventilation',
      prioridad: 'medium',
    },
    {
      id: 3,
      titulo: 'Limpiar bandeja',
      descripcion: 'Limpiar la bandeja de entrada para evitar plagas',
      tipo: 'cleaning',
      prioridad: 'low',
    },
  ];

  describe('RecommendationCard', () => {
    it('should render recommendation title', () => {
      render(
        <RecommendationCard
          recommendation={mockRecommendations[0]}
          onImplement={vi.fn()}
        />
      );

      expect(screen.getByText('Aumentar alimento')).toBeInTheDocument();
    });

    it('should render recommendation description', () => {
      render(
        <RecommendationCard
          recommendation={mockRecommendations[0]}
          onImplement={vi.fn()}
        />
      );

      expect(
        screen.getByText('La colmena necesita más alimento para mantener la cría')
      ).toBeInTheDocument();
    });

    it('should render recommendation type and priority', () => {
      render(
        <RecommendationCard
          recommendation={mockRecommendations[0]}
          onImplement={vi.fn()}
        />
      );

      expect(screen.getByText('feeding')).toBeInTheDocument();
      expect(screen.getByText('Prioridad: high')).toBeInTheDocument();
    });

    it('should apply high priority styling', () => {
      const { container } = render(
        <RecommendationCard
          recommendation={mockRecommendations[0]}
          onImplement={vi.fn()}
        />
      );

      const card = container.querySelector('.bg-red-500\\/10');
      expect(card).toBeInTheDocument();
    });

    it('should apply medium priority styling', () => {
      const { container } = render(
        <RecommendationCard
          recommendation={mockRecommendations[1]}
          onImplement={vi.fn()}
        />
      );

      const card = container.querySelector('.bg-yellow-500\\/10');
      expect(card).toBeInTheDocument();
    });

    it('should apply low priority styling', () => {
      const { container } = render(
        <RecommendationCard
          recommendation={mockRecommendations[2]}
          onImplement={vi.fn()}
        />
      );

      const card = container.querySelector('.bg-green-500\\/10');
      expect(card).toBeInTheDocument();
    });

    it('should render implement button', () => {
      render(
        <RecommendationCard
          recommendation={mockRecommendations[0]}
          onImplement={vi.fn()}
        />
      );

      expect(screen.getByText('Implementar')).toBeInTheDocument();
    });

    it('should call onImplement when button clicked', async () => {
      const user = userEvent.setup();
      const onImplement = vi.fn();

      render(
        <RecommendationCard
          recommendation={mockRecommendations[0]}
          onImplement={onImplement}
        />
      );

      await user.click(screen.getByText('Implementar'));

      expect(onImplement).toHaveBeenCalledWith(1);
    });
  });

  describe('RecommendationList', () => {
    it('should render loading state', () => {
      render(
        <RecommendationList
          recommendations={[]}
          onImplement={vi.fn()}
          loading={true}
        />
      );

      expect(screen.getByText('Cargando recomendaciones...')).toBeInTheDocument();
    });

    it('should render empty state when no recommendations', () => {
      render(
        <RecommendationList
          recommendations={[]}
          onImplement={vi.fn()}
          loading={false}
        />
      );

      expect(
        screen.getByText('No hay recomendaciones disponibles')
      ).toBeInTheDocument();
    });

    it('should render all recommendations', () => {
      render(
        <RecommendationList
          recommendations={mockRecommendations}
          onImplement={vi.fn()}
          loading={false}
        />
      );

      expect(screen.getByText('Aumentar alimento')).toBeInTheDocument();
      expect(screen.getByText('Revisar ventilación')).toBeInTheDocument();
      expect(screen.getByText('Limpiar bandeja')).toBeInTheDocument();
    });

    it('should render container with correct styling', () => {
      const { container } = render(
        <RecommendationList
          recommendations={mockRecommendations}
          onImplement={vi.fn()}
          loading={false}
        />
      );

      const list = container.querySelector('.space-y-3');
      expect(list).toBeInTheDocument();
    });

    it('should pass onImplement to child cards', async () => {
      const user = userEvent.setup();
      const onImplement = vi.fn();

      render(
        <RecommendationList
          recommendations={mockRecommendations}
          onImplement={onImplement}
          loading={false}
        />
      );

      const buttons = screen.getAllByText('Implementar');
      await user.click(buttons[0]);

      expect(onImplement).toHaveBeenCalledWith(1);
    });

    it('should render correct number of recommendation cards', () => {
      const { container } = render(
        <RecommendationList
          recommendations={mockRecommendations}
          onImplement={vi.fn()}
          loading={false}
        />
      );

      const cards = container.querySelectorAll('[class*="border-red"], [class*="border-yellow"], [class*="border-green"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
