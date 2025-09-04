# Visual Testing Guide

## Overview

This project uses Playwright for visual regression testing of the contribution form, campaign setup form, and landing page. The tests capture screenshots and compare them against baseline images to detect visual changes.

## Setup Complete ✅

### Installed Dependencies

- `@playwright/test`: Main testing framework
- `playwright`: Browser automation library
- Browser binaries: Chromium, Firefox, WebKit

### Test Structure

```
tests/
├── visual/
│   ├── contribution-form.spec.js    # Donor form visual tests
│   ├── campaign-setup.spec.js       # Campaign wizard visual tests
│   └── landing-page.spec.js         # Landing page visual tests
├── e2e/
│   └── campaign-flow.spec.js        # End-to-end functionality tests
└── fixtures/
    └── test-data.js                 # Test data and utilities
```

### Configuration Files

- `playwright.config.js`: Main configuration with multi-browser support
- Test scripts added to `package.json`
- `.gitignore` updated for test artifacts

## Available Test Commands

### Basic Testing

```bash
npm test                    # Run all tests
npm run test:visual         # Run only visual tests
npm run test:e2e           # Run only e2e tests
```

### Development & Debugging

```bash
npm run test:headed        # Run tests in headed browser
npm run test:ui           # Run tests with Playwright UI
npm run test:debug        # Debug tests step by step
```

### Screenshot Management

```bash
npm run test:update-snapshots  # Update baseline screenshots
npm run test:report           # View test results report
```

## Test Coverage

### Landing Page Tests (16 scenarios)

- Full page layout capture
- Header and navigation components
- Hero section and call-to-action areas
- Mobile/tablet responsiveness
- Dark mode and accessibility features
- Interactive element hover states
- Wide screen layout testing

### Contribution Form Tests (8 scenarios)

- Initial form state
- Validation error states
- Filled form with test data
- Mobile responsive view
- Web3 wallet integration
- Payment method selection
- Accessibility features
- Interactive hover states

### Campaign Setup Tests (11 scenarios)

- Setup wizard step progression
- Campaign information form
- Compliance and legal settings
- Form customization options
- Embed configuration
- Launch confirmation screen
- Step indicator/progress bar
- Mobile and tablet views
- Form validation states
- Success confirmation

## Browser Coverage

Tests run on:

- ✅ Desktop Chrome (Chromium)
- ✅ Desktop Firefox
- ✅ Desktop Safari (WebKit)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## Visual Testing Features

### Responsive Testing

- Mobile: 375x667 (iPhone SE)
- Tablet: 768x1024 (iPad)
- Desktop: 1280x720
- Wide: 1920x1080

### Accessibility Testing

- Dark mode support
- High contrast mode
- Reduced motion preferences
- Color scheme variations

### Interactive State Testing

- Hover states on buttons/links
- Form validation states
- Loading states
- Error states
- Success states

## Current Status

✅ **Setup Complete**: All tests configured and baseline screenshots generated
✅ **Multi-Browser Support**: Chrome, Firefox, Safari, Mobile browsers
✅ **Responsive Testing**: Mobile, tablet, desktop viewports
✅ **Accessibility**: Dark mode, contrast, reduced motion
✅ **CI Ready**: Configuration supports CI/CD environments

## Next Steps

1. **Run Full Test Suite**: `npm test` to verify all components
2. **Review Screenshots**: Check `tests/visual/*-snapshots/` for baseline images
3. **CI Integration**: Add to GitHub Actions or CI pipeline
4. **Team Training**: Share commands with development team

## Troubleshooting

### Common Issues

- **Port conflicts**: Dev server runs on 5174 (updated from 5173)
- **Timeout errors**: Tests wait 5-10 seconds for elements to stabilize
- **Missing screenshots**: Use `--update-snapshots` to regenerate baselines

### Debug Commands

```bash
# Debug specific test
npx playwright test landing-page --debug

# Run single test file
npx playwright test tests/visual/contribution-form.spec.js

# View test report
npx playwright show-report
```

Visual testing is now fully configured and ready for continuous integration! 🎉
