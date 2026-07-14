import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock LiveClock component for testing
const LiveClock = () => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-emerald-400">
        {time.toLocaleTimeString()}
      </div>
      <div className="text-xs text-gray-400">
        {time.toLocaleDateString()}
      </div>
    </div>
  );
};

// Simple Tab component for testing
const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex border-b border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 ${
            activeTab === tab.id
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-gray-400'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

describe('Layout Components', () => {
  describe('LiveClock', () => {
    it('should display current time', () => {
      render(<LiveClock />);

      const timeElement = screen.getByText(/\d{1,2}:\d{2}:\d{2}/);
      expect(timeElement).toBeInTheDocument();
    });

    it('should display date', () => {
      render(<LiveClock />);

      const dateElement = screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(dateElement).toBeInTheDocument();
    });

    it('should have correct styling', () => {
      const { container } = render(<LiveClock />);

      const mainDiv = container.querySelector('.text-center');
      expect(mainDiv).toBeInTheDocument();

      const timeDiv = container.querySelector('.text-2xl.font-bold.text-emerald-400');
      expect(timeDiv).toBeInTheDocument();

      const dateDiv = container.querySelector('.text-xs.text-gray-400');
      expect(dateDiv).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    const mockTabs = [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' },
      { id: 'tab3', label: 'Tab 3' },
    ];

    it('should render all tabs', () => {
      const mockOnChange = vi.fn();

      render(
        <Tabs
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnChange}
        />
      );

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('should highlight active tab', () => {
      const mockOnChange = vi.fn();
      const { container } = render(
        <Tabs
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnChange}
        />
      );

      const activeButton = container.querySelector(
        'button.border-b-2.border-emerald-500'
      );
      expect(activeButton?.textContent).toBe('Tab 1');
    });

    it('should call onTabChange when tab is clicked', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <Tabs
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnChange}
        />
      );

      await user.click(screen.getByText('Tab 2'));

      expect(mockOnChange).toHaveBeenCalledWith('tab2');
    });

    it('should have correct styling for inactive tabs', () => {
      const mockOnChange = vi.fn();
      const { container } = render(
        <Tabs
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnChange}
        />
      );

      const inactiveButtons = container.querySelectorAll('button.text-gray-400');
      expect(inactiveButtons.length).toBeGreaterThan(0);
    });

    it('should have flex container with border', () => {
      const mockOnChange = vi.fn();
      const { container } = render(
        <Tabs
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnChange}
        />
      );

      const flexDiv = container.querySelector('.flex.border-b.border-gray-700');
      expect(flexDiv).toBeInTheDocument();
    });

    it('should render tab buttons', () => {
      const mockOnChange = vi.fn();
      const { container } = render(
        <Tabs
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={mockOnChange}
        />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(3);
    });
  });
});
