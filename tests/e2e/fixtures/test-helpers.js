// Enhanced test helpers for comprehensive visual testing

export const mockSuccessfulWalletConnection = (page) => {
  return page.addInitScript(() => {
    window.ethereum = {
      isMetaMask: true,
      selectedAddress: '0x1234567890123456789012345678901234567890',
      chainId: '0x1',
      networkVersion: '1',
      request: async (request) => {
        switch (request.method) {
          case 'eth_requestAccounts':
            return ['0x1234567890123456789012345678901234567890'];
          case 'eth_getBalance':
            return '0x1bc16d674ec80000'; // 2 ETH in wei
          case 'eth_chainId':
            return '0x1';
          case 'eth_sendTransaction':
            return '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b';
          default:
            return null;
        }
      },
      on: () => {},
      removeListener: () => {}
    };
  });
};

export const mockFailedWalletConnection = (page, errorMessage = 'User rejected the request') => {
  return page.addInitScript((error) => {
    window.ethereum = {
      isMetaMask: true,
      request: async () => {
        throw new Error(error);
      }
    };
  }, errorMessage);
};

export const mockNetworkError = (page) => {
  return page.route('**/*', route => {
    if (route.request().method() === 'POST') {
      route.abort('connectionfailed');
    } else {
      route.continue();
    }
  });
};

export const mockServerError = (page, statusCode = 500, errorMessage = 'Internal Server Error') => {
  return page.route('**/*', route => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({ error: errorMessage })
      });
    } else {
      route.continue();
    }
  });
};

export const mockSuccessResponse = (page, responseData = { success: true, id: '12345' }) => {
  return page.route('**/*', route => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseData)
      });
    } else {
      route.continue();
    }
  });
};

export const fillFormWithTestData = async (page, data = {}) => {
  const defaults = {
    name: 'John Doe',
    email: 'john.doe@dkdev.io',
    amount: '100',
    message: 'Test contribution message'
  };
  
  const formData = { ...defaults, ...data };

  // Fill name field
  const nameInput = page.locator('input[name="name"], input[name="donorName"], [data-testid="name-input"]').first();
  if (await nameInput.isVisible()) {
    await nameInput.fill(formData.name);
  }

  // Fill email field
  const emailInput = page.locator('input[name="email"], input[type="email"], [data-testid="email-input"]').first();
  if (await emailInput.isVisible()) {
    await emailInput.fill(formData.email);
  }

  // Fill amount field
  const amountInput = page.locator('input[name="amount"], input[type="number"], [data-testid="amount-input"]').first();
  if (await amountInput.isVisible()) {
    await amountInput.fill(formData.amount);
  }

  // Fill message field
  const messageInput = page.locator('textarea[name="message"], textarea, [data-testid="message-input"]').first();
  if (await messageInput.isVisible()) {
    await messageInput.fill(formData.message);
  }
};

export const waitForStableState = async (page, timeout = 2000) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(timeout);
};

export const checkForFormElements = async (page) => {
  const results = {
    hasForm: false,
    hasInputs: false,
    hasSubmitButton: false,
    inputCount: 0,
    buttonCount: 0
  };

  const forms = page.locator('form');
  results.hasForm = await forms.count() > 0;

  const inputs = page.locator('input[type="text"], input[type="email"], input[type="number"], textarea');
  results.inputCount = await inputs.count();
  results.hasInputs = results.inputCount > 0;

  const buttons = page.locator('button[type="submit"], .submit-btn, [data-testid="submit-button"]');
  results.buttonCount = await buttons.count();
  results.hasSubmitButton = results.buttonCount > 0;

  return results;
};

export const testResponsiveBreakpoints = async (page, testCallback) => {
  const breakpoints = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 1024 },
    { name: 'wide', width: 1920, height: 1080 }
  ];

  for (const breakpoint of breakpoints) {
    await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
    await page.reload();
    await waitForStableState(page);
    
    if (testCallback) {
      await testCallback(page, breakpoint);
    }
  }
};

export const simulateSlowConnection = async (page) => {
  await page.route('**/*', route => {
    setTimeout(() => {
      route.continue();
    }, Math.random() * 2000 + 1000); // 1-3 second delay
  });
};

export const captureElementScreenshot = async (page, selector, filename) => {
  const element = page.locator(selector).first();
  if (await element.isVisible()) {
    await expect(element).toHaveScreenshot(filename);
    return true;
  }
  return false;
};

export const triggerFormValidation = async (page) => {
  const submitButton = page.locator('button[type="submit"], .submit-btn, [data-testid="submit-button"]').first();
  if (await submitButton.isVisible()) {
    await submitButton.click();
    await page.waitForTimeout(1500);
    return true;
  }
  return false;
};

// Live site specific helpers
export const analyzeLiveSiteHealth = async (page, url) => {
  await page.goto(url);
  await waitForStableState(page);

  const title = await page.title();
  const forms = await page.locator('form').count();
  const inputs = await page.locator('input[type="text"], input[type="email"], input[type="number"]').count();
  const buttons = await page.locator('button').count();
  const errors = await page.locator('.error, .alert-error, [data-testid*="error"]').count();
  const loading = await page.locator('.loading, .spinner, [data-testid*="loading"]').count();

  return {
    timestamp: new Date().toISOString(),
    url,
    title,
    formsFound: forms,
    inputsFound: inputs,
    buttonsFound: buttons,
    errorsFound: errors,
    loadingElementsFound: loading,
    isAccessible: forms > 0 || inputs > 0 || buttons > 0,
    status: errors === 0 && (forms > 0 || inputs > 0) ? 'HEALTHY' : 'NEEDS_ATTENTION'
  };
};