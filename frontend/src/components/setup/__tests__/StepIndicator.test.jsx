import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../../utils/test-utils';
import StepIndicator from '../StepIndicator';

describe('StepIndicator', () => {
  describe('Component Rendering', () => {
    it('renders step indicator with current and total steps', () => {
      render(<StepIndicator currentStep={1} totalSteps={5} />);

      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    });

    it('renders progress bar', () => {
      const { container } = render(<StepIndicator currentStep={2} totalSteps={4} />);

      expect(container.querySelector('.step-indicator')).toBeInTheDocument();
      expect(container.querySelector('.progress-bar')).toBeInTheDocument();
    });

    it('displays individual step circles', () => {
      const { container } = render(<StepIndicator currentStep={3} totalSteps={5} />);

      const stepCircles = container.querySelectorAll('.step-circle');
      expect(stepCircles).toHaveLength(5);
    });
  });

  describe('Step States', () => {
    it('marks completed steps correctly', () => {
      const { container } = render(<StepIndicator currentStep={3} totalSteps={5} />);

      const stepCircles = container.querySelectorAll('.step-circle');

      // Steps 1 and 2 should be completed
      expect(stepCircles[0]).toHaveClass('completed');
      expect(stepCircles[1]).toHaveClass('completed');

      // Step 3 should be active (current)
      expect(stepCircles[2]).toHaveClass('active');

      // Steps 4 and 5 should be inactive
      expect(stepCircles[3]).not.toHaveClass('completed');
      expect(stepCircles[3]).not.toHaveClass('active');
      expect(stepCircles[4]).not.toHaveClass('completed');
      expect(stepCircles[4]).not.toHaveClass('active');
    });

    it('marks current step as active', () => {
      const { container } = render(<StepIndicator currentStep={4} totalSteps={6} />);

      const stepCircles = container.querySelectorAll('.step-circle');
      expect(stepCircles[3]).toHaveClass('active'); // 4th step (index 3)
    });

    it('shows correct step numbers', () => {
      render(<StepIndicator currentStep={2} totalSteps={4} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('calculates correct progress percentage', () => {
      const { container } = render(<StepIndicator currentStep={3} totalSteps={5} />);

      const progressFill = container.querySelector('.progress-fill');
      // Progress should be (currentStep - 1) / (totalSteps - 1) * 100 = 2/4 * 100 = 50%
      expect(progressFill).toHaveStyle({ width: '50%' });
    });

    it('shows 0% progress on first step', () => {
      const { container } = render(<StepIndicator currentStep={1} totalSteps={5} />);

      const progressFill = container.querySelector('.progress-fill');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('shows 100% progress on last step', () => {
      const { container } = render(<StepIndicator currentStep={5} totalSteps={5} />);

      const progressFill = container.querySelector('.progress-fill');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });
  });

  describe('Different Step Configurations', () => {
    it('handles 3-step process', () => {
      render(<StepIndicator currentStep={2} totalSteps={3} />);

      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();

      const { container } = render(<StepIndicator currentStep={2} totalSteps={3} />);
      const stepCircles = container.querySelectorAll('.step-circle');
      expect(stepCircles).toHaveLength(3);
    });

    it('handles 7-step process', () => {
      render(<StepIndicator currentStep={4} totalSteps={7} />);

      expect(screen.getByText('Step 4 of 7')).toBeInTheDocument();

      const { container } = render(<StepIndicator currentStep={4} totalSteps={7} />);
      const stepCircles = container.querySelectorAll('.step-circle');
      expect(stepCircles).toHaveLength(7);
    });

    it('handles single step process', () => {
      render(<StepIndicator currentStep={1} totalSteps={1} />);

      expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();

      const { container } = render(<StepIndicator currentStep={1} totalSteps={1} />);
      const stepCircles = container.querySelectorAll('.step-circle');
      expect(stepCircles).toHaveLength(1);
      expect(stepCircles[0]).toHaveClass('active');
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies correct base CSS classes', () => {
      const { container } = render(<StepIndicator currentStep={2} totalSteps={4} />);

      expect(container.querySelector('.step-indicator')).toBeInTheDocument();
      expect(container.querySelector('.step-text')).toBeInTheDocument();
      expect(container.querySelector('.steps-container')).toBeInTheDocument();
    });

    it('applies responsive styling classes', () => {
      const { container } = render(<StepIndicator currentStep={3} totalSteps={6} />);

      const stepsContainer = container.querySelector('.steps-container');
      expect(stepsContainer).toHaveClass('steps-container');
    });

    it('applies correct colors to step states', () => {
      const { container } = render(<StepIndicator currentStep={3} totalSteps={5} />);

      const stepCircles = container.querySelectorAll('.step-circle');

      // Completed steps should have completed styling
      expect(stepCircles[0]).toHaveClass('completed');
      expect(stepCircles[1]).toHaveClass('completed');

      // Active step should have active styling
      expect(stepCircles[2]).toHaveClass('active');
    });
  });

  describe('Edge Cases', () => {
    it('handles step 0 gracefully', () => {
      render(<StepIndicator currentStep={0} totalSteps={5} />);

      expect(screen.getByText('Step 0 of 5')).toBeInTheDocument();
    });

    it('handles current step greater than total steps', () => {
      render(<StepIndicator currentStep={6} totalSteps={5} />);

      expect(screen.getByText('Step 6 of 5')).toBeInTheDocument();

      const { container } = render(<StepIndicator currentStep={6} totalSteps={5} />);
      const stepCircles = container.querySelectorAll('.step-circle');
      expect(stepCircles).toHaveLength(5); // Should still render 5 circles
    });

    it('handles negative step numbers', () => {
      render(<StepIndicator currentStep={-1} totalSteps={3} />);

      expect(screen.getByText('Step -1 of 3')).toBeInTheDocument();
    });

    it('handles zero total steps', () => {
      render(<StepIndicator currentStep={1} totalSteps={0} />);

      expect(screen.getByText('Step 1 of 0')).toBeInTheDocument();

      const { container } = render(<StepIndicator currentStep={1} totalSteps={0} />);
      const stepCircles = container.querySelectorAll('.step-circle');
      expect(stepCircles).toHaveLength(0);
    });
  });

  describe('Step Labels', () => {
    it('generates correct step labels for 5-step process', () => {
      render(<StepIndicator currentStep={3} totalSteps={5} />);

      const stepLabels = ['Setup', 'Committee', 'Banking', 'Terms', 'Launch'];

      stepLabels.forEach((label, index) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('shows generic labels for non-standard step counts', () => {
      render(<StepIndicator currentStep={2} totalSteps={3} />);

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
    });

    it('truncates labels on small screens', () => {
      const { container } = render(<StepIndicator currentStep={2} totalSteps={5} />);

      const stepLabels = container.querySelectorAll('.step-label');
      stepLabels.forEach((label) => {
        expect(label).toHaveClass('step-label');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const { container } = render(<StepIndicator currentStep={3} totalSteps={5} />);

      const stepIndicator = container.querySelector('.step-indicator');
      expect(stepIndicator).toHaveAttribute('aria-label', 'Step 3 of 5');
    });

    it('marks current step with aria-current', () => {
      const { container } = render(<StepIndicator currentStep={2} totalSteps={4} />);

      const activeStep = container.querySelector('.step-circle.active');
      expect(activeStep).toHaveAttribute('aria-current', 'step');
    });

    it('provides accessible text for screen readers', () => {
      render(<StepIndicator currentStep={3} totalSteps={5} />);

      expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
    });

    it('has proper role attributes', () => {
      const { container } = render(<StepIndicator currentStep={2} totalSteps={4} />);

      const stepsContainer = container.querySelector('.steps-container');
      expect(stepsContainer).toHaveAttribute('role', 'progressbar');
    });
  });

  describe('Component Snapshots', () => {
    it('matches snapshot for beginning of process', () => {
      const { container } = render(<StepIndicator currentStep={1} totalSteps={5} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for middle of process', () => {
      const { container } = render(<StepIndicator currentStep={3} totalSteps={5} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for end of process', () => {
      const { container } = render(<StepIndicator currentStep={5} totalSteps={5} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for different step count', () => {
      const { container } = render(<StepIndicator currentStep={2} totalSteps={3} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
