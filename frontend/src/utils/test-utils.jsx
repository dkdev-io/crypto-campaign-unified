import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Test data factories
export const createMockCampaign = (overrides = {}) => ({
  id: 'test-campaign-1',
  campaign_name: 'Test Campaign',
  email: 'test@example.com',
  candidate_name: 'John Doe',
  theme_color: '#2a2a72',
  suggested_amounts: [25, 50, 100, 250],
  max_donation_limit: 3300,
  website: 'https://test.com',
  wallet_address: '0x123...',
  created_at: '2024-01-01T00:00:00.000Z',
  ...overrides
});

export const createMockDonorData = (overrides = {}) => ({
  fullName: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-123-4567',
  street: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  employer: 'Test Corp',
  occupation: 'Engineer',
  amount: '100',
  ...overrides
});

export const createMockWalletInfo = (overrides = {}) => ({
  isConnected: true,
  account: '0x742d35Cc6C4C5e5D0E9dF5F9B6A5e8a2c1B9D8e7',
  balance: '1.5678',
  network: {
    name: 'Ethereum Mainnet',
    chainId: '0x1'
  },
  contributorInfo: {
    isKYCVerified: true,
    cumulativeAmount: 0.5,
    remainingCapacity: 1.0
  },
  ...overrides
});

export const createMockFormSubmission = (overrides = {}) => ({
  id: 'submission-1',
  campaign_id: 'test-campaign-1',
  donor_full_name: 'Jane Smith',
  donor_email: 'jane@example.com',
  amount_usd: 100,
  transaction_hash: '0xabc123...',
  status: 'confirmed',
  created_at: '2024-01-01T12:00:00.000Z',
  ...overrides
});

// Custom render function with providers
export const render = (ui, {
  route = '/',
  ...renderOptions
} = {}) => {
  // Set initial URL for router
  window.history.pushState({}, 'Test page', route);
  
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

// Utility to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock event creators
export const createMockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: {
    value: 'test-value',
    name: 'test-input',
    checked: false,
    ...overrides.target
  },
  currentTarget: {
    value: 'test-value',
    ...overrides.currentTarget
  },
  ...overrides
});

export const createChangeEvent = (value, name = 'test-input') => 
  createMockEvent({
    target: { value, name },
    currentTarget: { value }
  });

export const createClickEvent = (overrides = {}) =>
  createMockEvent({
    type: 'click',
    ...overrides
  });

export const createSubmitEvent = (overrides = {}) =>
  createMockEvent({
    type: 'submit',
    ...overrides
  });

// Form validation helpers
export const fillFormFields = async (user, formData) => {
  const fields = Object.entries(formData);
  
  for (const [fieldName, value] of fields) {
    const input = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`);
    if (input) {
      if (input.type === 'checkbox' || input.type === 'radio') {
        if (value) {
          await user.click(input);
        }
      } else {
        await user.type(input, String(value));
      }
    }
  }
};

// Assertion helpers
export const expectFormField = (container, fieldName, expectedValue = null) => {
  const field = container.querySelector(`[name="${fieldName}"]`);
  expect(field).toBeInTheDocument();
  
  if (expectedValue !== null) {
    if (field.type === 'checkbox' || field.type === 'radio') {
      expect(field.checked).toBe(Boolean(expectedValue));
    } else {
      expect(field.value).toBe(String(expectedValue));
    }
  }
  
  return field;
};

export const expectErrorMessage = (container, message) => {
  const errorElement = container.querySelector('[style*="background: #f8d7da"], [style*="color: #721c24"], .error-message');
  expect(errorElement).toBeInTheDocument();
  if (message) {
    expect(errorElement).toHaveTextContent(message);
  }
};

export const expectSuccessMessage = (container, message) => {
  const successElement = container.querySelector('[style*="background: #d4edda"], [style*="color: #155724"], .success-message');
  expect(successElement).toBeInTheDocument();
  if (message) {
    expect(successElement).toHaveTextContent(message);
  }
};

// Mock HTTP responses
export const mockApiResponse = (data, options = {}) => {
  const {
    status = 200,
    ok = true,
    delay = 0
  } = options;
  
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        ok,
        status,
        statusText: ok ? 'OK' : 'Error',
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data))
      });
    }, delay);
  });
};

// Component test helpers
export const getByDataTestId = (container, testId) => {
  return container.querySelector(`[data-testid="${testId}"]`);
};

export const getAllByDataTestId = (container, testId) => {
  return container.querySelectorAll(`[data-testid="${testId}"]`);
};

// Form interaction patterns
export const submitForm = async (user, form) => {
  const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
  if (submitButton) {
    await user.click(submitButton);
  } else {
    // Submit via form if no submit button found
    await user.submit(form);
  }
};

export const selectSuggestedAmount = async (user, container, amount) => {
  const amountButton = container.querySelector(`button[type="button"]:has-text("$${amount}")`);
  if (amountButton) {
    await user.click(amountButton);
  }
  return amountButton;
};

// Wallet interaction helpers
export const connectWallet = async (user, container) => {
  const connectButton = container.querySelector('button:has-text("Connect"), button:has-text("MetaMask")');
  if (connectButton) {
    await user.click(connectButton);
  }
  return connectButton;
};

export const disconnectWallet = async (user, container) => {
  const disconnectButton = container.querySelector('button:has-text("Disconnect")');
  if (disconnectButton) {
    await user.click(disconnectButton);
  }
  return disconnectButton;
};

// Time utilities for testing
export const mockDateNow = (timestamp) => {
  const dateSpy = vi.spyOn(Date, 'now');
  dateSpy.mockReturnValue(timestamp);
  return dateSpy;
};

export const mockDate = (dateString) => {
  const mockDate = new Date(dateString);
  const dateSpy = vi.spyOn(global, 'Date');
  dateSpy.mockImplementation(() => mockDate);
  return dateSpy;
};

// Export everything for easy importing
export * from '@testing-library/react';
export * from '@testing-library/user-event';
export { vi } from 'vitest';