import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../../../components/Layout/Card';

describe('Card Component', () => {
  it('should render card container', () => {
    const { container } = render(
      <Card>
        <p>Test content</p>
      </Card>
    );

    const cardDiv = container.querySelector('div');
    expect(cardDiv).toBeTruthy();
    expect(cardDiv).toHaveClass('bg-[#0f1720]');
    expect(cardDiv).toHaveClass('border');
    expect(cardDiv).toHaveClass('border-gray-800');
  });

  it('should render children content', () => {
    render(
      <Card>
        <p>Test content</p>
      </Card>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(
      <Card title="Card Title">
        <p>Test content</p>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('should not render title when not provided', () => {
    const { container } = render(
      <Card>
        <p>Test content</p>
      </Card>
    );

    const titleElement = container.querySelector('h3');
    expect(titleElement).toBeFalsy();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <p>Test content</p>
      </Card>
    );

    const cardDiv = container.querySelector('div');
    expect(cardDiv).toHaveClass('custom-class');
  });

  it('should render bullet separator when title is present', () => {
    const { container } = render(
      <Card title="Title">
        <p>Content</p>
      </Card>
    );

    const separator = container.querySelector('.text-xs.text-gray-400');
    expect(separator?.textContent).toBe('•');
  });

  it('should have correct title styling', () => {
    const { container } = render(
      <Card title="Styled Title">
        <p>Content</p>
      </Card>
    );

    const title = container.querySelector('h3');
    expect(title).toHaveClass('text-sm');
    expect(title).toHaveClass('font-semibold');
    expect(title).toHaveClass('text-gray-300');
  });

  it('should support multiple children', () => {
    render(
      <Card title="Multi Child">
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </Card>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });
});
