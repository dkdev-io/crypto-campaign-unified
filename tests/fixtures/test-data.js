// Test data fixtures for visual tests

export const testCampaign = {
  title: 'Save the Ocean Campaign',
  description:
    'A comprehensive campaign dedicated to ocean conservation and marine life protection.',
  goal: 50000,
  category: 'Environment',
  tags: ['ocean', 'conservation', 'marine-life'],
};

export const testContributor = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  amount: 100,
  message: 'Supporting this great cause! Keep up the excellent work.',
  anonymous: false,
};

export const testWalletData = {
  address: '0x1234567890123456789012345678901234567890',
  network: 'ethereum',
  balance: '1.5 ETH',
};

export const viewports = {
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 414, height: 896 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1024, height: 768 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 },
};

export const waitForStableState = async (page, timeout = 2000) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(timeout);
};
