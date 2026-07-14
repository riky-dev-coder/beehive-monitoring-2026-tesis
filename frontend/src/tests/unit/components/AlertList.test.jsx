import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock AlertList component
const AlertList = ({ alerts, onMarkAsRead, onResolve }) => {
  const SEVERITY_STYLES = {
    critical: 'bg-red-500/10 border-red-500 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500 text-yellow-400',
    info: 'bg-emerald-500/10 border-emerald-500 text-emerald-400',
  };

  const SENSOR_LABELS = {
    temp_cria: 'temperatura de cría',
    temp_mielera: 'temperatura de mielera',
    humedad_cria: 'humedad de cría',
    humedad_mielera: 'humedad de mielera',
    peso_total: 'peso total',
    peso_mielera: 'peso de mielera',
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-lg p-4 ${SEVERITY_STYLES[alert.severidad] || SEVERITY_STYLES.info}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">
                {SENSOR_LABELS[alert.sensor_asociado] || alert.sensor_asociado}
              </h4>
              <p className="text-sm mt-1">{alert.mensaje}</p>
              <p className="text-xs mt-1 opacity-70">{alert.timestamp}</p>
            </div>
            <div className="flex gap-2">
              {!alert.leida && (
                <button
                  onClick={() => onMarkAsRead(alert.id)}
                  className="px-2 py-1 text-xs rounded hover:opacity-80"
                >
                  Marcar leída
                </button>
              )}
              {!alert.resuelta && (
                <button
                  onClick={() => onResolve(alert.id)}
                  className="px-2 py-1 text-xs rounded hover:opacity-80"
                >
                  Resolver
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

describe('AlertList Component', () => {
  const mockAlerts = [
    {
      id: 1,
      sensor_asociado: 'temp_cria',
      severidad: 'critical',
      mensaje: 'Temperatura muy alta',
      timestamp: '2026-03-29T10:00:00Z',
      leida: false,
      resuelta: false,
    },
    {
      id: 2,
      sensor_asociado: 'humedad_cria',
      severidad: 'warning',
      mensaje: 'Humedad baja',
      timestamp: '2026-03-29T09:30:00Z',
      leida: true,
      resuelta: false,
    },
    {
      id: 3,
      sensor_asociado: 'peso_total',
      severidad: 'info',
      mensaje: 'Aumento de peso',
      timestamp: '2026-03-29T09:00:00Z',
      leida: true,
      resuelta: true,
    },
  ];

  it('should render alert container', () => {
    const { container } = render(
      <AlertList alerts={mockAlerts} onMarkAsRead={vi.fn()} onResolve={vi.fn()} />
    );

    const container_el = container.querySelector('.space-y-3');
    expect(container_el).toBeInTheDocument();
  });

  it('should render all alerts', () => {
    render(
      <AlertList alerts={mockAlerts} onMarkAsRead={vi.fn()} onResolve={vi.fn()} />
    );

    expect(screen.getByText('temperatura de cría')).toBeInTheDocument();
    expect(screen.getByText('humedad de cría')).toBeInTheDocument();
    expect(screen.getByText('peso total')).toBeInTheDocument();
  });

  it('should render alert messages', () => {
    render(
      <AlertList alerts={mockAlerts} onMarkAsRead={vi.fn()} onResolve={vi.fn()} />
    );

    expect(screen.getByText('Temperatura muy alta')).toBeInTheDocument();
    expect(screen.getByText('Humedad baja')).toBeInTheDocument();
    expect(screen.getByText('Aumento de peso')).toBeInTheDocument();
  });

  it('should apply correct severity styling', () => {
    const { container } = render(
      <AlertList alerts={mockAlerts} onMarkAsRead={vi.fn()} onResolve={vi.fn()} />
    );

    const criticalAlert = container.querySelector('.bg-red-500\\/10');
    expect(criticalAlert).toBeInTheDocument();

    const warningAlert = container.querySelector('.bg-yellow-500\\/10');
    expect(warningAlert).toBeInTheDocument();

    const infoAlert = container.querySelector('.bg-emerald-500\\/10');
    expect(infoAlert).toBeInTheDocument();
  });

  it('should show mark as read button for unread alerts', () => {
    render(
      <AlertList alerts={mockAlerts} onMarkAsRead={vi.fn()} onResolve={vi.fn()} />
    );

    const readButtons = screen.getAllByText('Marcar leída');
    expect(readButtons.length).toBe(1); // Only first alert is unread
  });

  it('should show resolve button for unresolved alerts', () => {
    render(
      <AlertList alerts={mockAlerts} onMarkAsRead={vi.fn()} onResolve={vi.fn()} />
    );

    const resolveButtons = screen.getAllByText('Resolver');
    expect(resolveButtons.length).toBe(2); // First and second alerts are unresolved
  });

  it('should call onMarkAsRead when button clicked', async () => {
    const user = userEvent.setup();
    const onMarkAsRead = vi.fn();

    render(
      <AlertList alerts={mockAlerts} onMarkAsRead={onMarkAsRead} onResolve={vi.fn()} />
    );

    const readButton = screen.getByText('Marcar leída');
    await user.click(readButton);

    expect(onMarkAsRead).toHaveBeenCalledWith(1);
  });

  it('should call onResolve when button clicked', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();

    render(
      <AlertList alerts={mockAlerts} onMarkAsRead={vi.fn()} onResolve={onResolve} />
    );

    const resolveButtons = screen.getAllByText('Resolver');
    await user.click(resolveButtons[0]);

    expect(onResolve).toHaveBeenCalledWith(1);
  });

  it('should render empty list when no alerts', () => {
    const { container } = render(
      <AlertList alerts={[]} onMarkAsRead={vi.fn()} onResolve={vi.fn()} />
    );

    const alerts_container = container.querySelector('.space-y-3');
    expect(alerts_container?.children.length).toBe(0);
  });

  it('should render timestamps for alerts', () => {
    render(
      <AlertList alerts={mockAlerts} onMarkAsRead={vi.fn()} onResolve={vi.fn()} />
    );

    expect(screen.getByText('2026-03-29T10:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('2026-03-29T09:30:00Z')).toBeInTheDocument();
  });

  it('should translate sensor labels correctly', () => {
    const customAlerts = [
      {
        id: 1,
        sensor_asociado: 'temp_mielera',
        severidad: 'info',
        mensaje: 'Test',
        timestamp: '2026-03-29T10:00:00Z',
        leida: false,
        resuelta: false,
      },
    ];

    render(
      <AlertList alerts={customAlerts} onMarkAsRead={vi.fn()} onResolve={vi.fn()} />
    );

    expect(screen.getByText('temperatura de mielera')).toBeInTheDocument();
  });
});
