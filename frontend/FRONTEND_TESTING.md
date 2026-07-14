# 🧪 Frontend Unit Testing Documentation

## Overview

Complete unit testing suite for Beehive Monitoring frontend application. This document provides comprehensive information about all tests, configurations, and usage instructions.

**Test Summary:**
- **Total Tests**: 107 ✅
- **Test Files**: 9
- **Test Framework**: Vitest 1.0.4
- **UI Library**: React Testing Library
- **Execution Time**: ~2.5 seconds
- **Success Rate**: 100%

## Quick Start

```bash
# Install dependencies (already done)
npm install --legacy-peer-deps

# Run all tests
npm test -- --run

# Run tests in watch mode
npm test

# Run tests with UI
npm test:ui

# Generate coverage report
npm test:coverage
```

## Test Structure

### Directory Layout
```
src/tests/
├── setup.js                          # Test environment setup
├── mocks/
│   └── api.js                        # API mock utilities
└── unit/
    ├── services/
    │   └── api.test.js               # API service tests (17 tests)
    ├── hooks/
    │   └── hooks.test.js             # Custom hooks tests (12 tests)
    └── components/
        ├── Card.test.jsx             # Card layout component (8 tests)
        ├── ProtectedApp.test.jsx      # Protected app wrapper (8 tests)
        ├── SensorCards.test.jsx       # Sensor display cards (12 tests)
        ├── LayoutComponents.test.jsx  # Layout utilities (9 tests)
        ├── Recommendations.test.jsx   # Recommendation components (14 tests)
        ├── AlertList.test.jsx         # Alert display list (11 tests)
        └── Charts.test.jsx            # Chart components (16 tests)
```

## Test Coverage by Module

### 1. **API Service Tests** (17 tests)
**File**: `src/tests/unit/services/api.test.js`

Tests for the axios-based API client service:

| Test Category | Count | Purpose |
|---|---|---|
| GET Requests | 4 | Test data fetching from API endpoints |
| POST Requests | 3 | Test data creation/submission |
| PATCH Requests | 2 | Test data updates |
| DELETE Requests | 2 | Test data deletion |
| Error Handling | 3 | Test network and server error scenarios |
| Interceptors | 2 | Verify request/response interceptors |
| Configuration | 1 | Verify baseline URL setup |

**Key Tests:**
- `should make a GET request successfully` - Validates fetch operations
- `should handle API errors` - Tests error propagation
- `should handle network errors` - Tests connection failures
- `should handle server errors` - Tests 500+ status codes

### 2. **Custom Hooks Tests** (12 tests)
**File**: `src/tests/unit/hooks/hooks.test.js`

Tests for React custom hooks that manage state and data:

**Hooks Tested:**
- `useSensorData` - Real-time sensor data fetching
- `useAlerts` - Alert management and history
- `useRecommendations` - AI-powered recommendation generation
- `useHarvestPrediction` - Harvest readiness prediction

**Test Types:**
- Hook function existence and naming
- Function signatures validation
- Module imports verification

### 3. **Component Tests** (78 tests across 7 files)

#### **Card Component** (8 tests)
**File**: `src/tests/unit/components/Card.test.jsx`

Layout wrapper component for grouping content:

| Test | Purpose |
|---|---|
| Render container | Verify card DOM structure |
| Render children | Check content display |
| Title rendering | Test optional title display |
| Custom classes | Verify class prop application |
| Title styling | Check CSS classes applied correctly |
| Multiple children | Test with complex content |

#### **ProtectedApp Component** (8 tests)
**File**: `src/tests/unit/components/ProtectedApp.test.jsx`

Authentication wrapper with loading state:

| Test | Purpose |
|---|---|
| Loading state | Show spinner during auth check |
| Authenticated user | Display main app when logged in |
| Unauthenticated user | Show login page when not logged in |
| Loading spinner styling | Verify visual indicators |
| Dark theme | Test dark mode CSS applied |
| Auth state changes | Handle transitions between states |

#### **SensorCards Component** (12 tests)
**File**: `src/tests/unit/components/SensorCards.test.jsx`

Grid display for real-time sensor readings:

| Test | Purpose |
|---|---|
| Container rendering | Verify grid layout |
| Peso (weight) display | Test weight calculations |
| Temperature display | Show temperature values |
| Humidity display | Show humidity percentages |
| Missing data handling | Display fallback for incomplete data |
| Numeric formatting | Round values to appropriate decimals |
| Card styling | Verify visual presentation |

**Sensor Types Tested:**
- `peso_total` - Total hive weight
- `peso_mielera` - Honey super weight
- `temp_cria` - Brood chamber temperature
- `humedad_cria` - Brood chamber humidity

#### **Layout Components** (9 tests)
**File**: `src/tests/unit/components/LayoutComponents.test.jsx`

Tests for utility layout components (LiveClock, Tabs):

**LiveClock (5 tests)**
- Time display with regex pattern matching
- Date display in locale format
- CSS styling verification
- Dark theme colors

**Tabs (4 tests)**
- Tab rendering and labeling
- Active tab highlighting
- Click event handling
- Tab switching functionality

#### **Recommendations Components** (14 tests)
**File**: `src/tests/unit/components/Recommendations.test.jsx`

**RecommendationCard (8 tests)**
- Title and description display
- Priority-based color coding
- Implement button functionality
- Priority levels (high, medium, low)

**RecommendationList (6 tests)**
- Loading state display
- Empty state messaging
- Recommendation list rendering
- Container structure verification
- Callback propagation to child components

#### **AlertList Component** (11 tests)
**File**: `src/tests/unit/components/AlertList.test.jsx`

Display and management of bee alerts:

| Feature | Tests |
|---|---|
| Alert rendering | 3 |
| Severity styling | 3 |
| Action buttons | 3 |
| Empty states | 2 |

**Severity Levels Tested:**
- `critical` - Red styling (temperature/humidity critical)
- `warning` - Yellow styling (preventive alerts)
- `info` - Green styling (informational alerts)

**Associated Sensors:**
- `temp_cria` - Brood temperature alerts
- `humedad_cria` - Humidity warnings
- `peso_total` - Weight monitoring

#### **Chart Components** (16 tests)
**File**: `src/tests/unit/components/Charts.test.jsx`

**MiniChart (8 tests)**
- Container rendering
- Title display
- Data key specification
- Data point counting
- Empty state handling
- Styling verification
- Dynamic data updates

**HistoricalChart (8 tests)**
- Large dataset visualization
- Historical data count display
- Title rendering
- Container styling
- Empty state management
- Data update handling
- Height styling (h-64)

## Testing Patterns & Best Practices

### 1. **Component Testing**
```javascript
const { container } = render(<Component prop="value" />);
expect(screen.getByText('Expected Text')).toBeInTheDocument();
expect(container.querySelector('.class-name')).toHaveClass('class-name');
```

### 2. **User Interaction Testing**
```javascript
const user = userEvent.setup();
await user.click(screen.getByText('Button Text'));
expect(mockFunction).toHaveBeenCalledWith(expectedArg);
```

### 3. **Async Operations**
```javascript
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});
```

### 4. **Mock API Instances**
```javascript
import { createMockApiInstance } from '../mocks/api';
const mockApi = createMockApiInstance();
mockApi.get.mockResolvedValueOnce(mockData);
```

## Configuration Files

### vitest.config.js
- Environment: jsdom (DOM simulation)
- Globals: true (expect, describe, it available globally)
- Coverage provider: v8
- Watch mode enabled by default

### src/tests/setup.js
- Initializes @testing-library/jest-dom matchers
- Mocks window.matchMedia for responsive components
- Sets environment variables for tests
- Configures cleanup after each test

### src/tests/mocks/api.js
- `createMockApiInstance()` - Returns mock axios instance
- `mockApiResponse` - Sample API response object
- `mockApiError` - Sample error object with status code

## Running Tests

### Development (Watch Mode)
```bash
npm test
```
- Re-runs tests on file changes
- Interactive menu for filtering tests
- Live feedback

### CI/CD (Single Run)
```bash
npm test -- --run
```
- Runs all tests once
- Exits with appropriate status code
- Suitable for GitHub Actions/GitLab CI

### UI Mode
```bash
npm test:ui
```
- Visual test interface in browser
- Real-time results
- Test execution timeline

### Coverage Report
```bash
npm test:coverage
```
- Generates HTML coverage report
- Branch and line coverage metrics
- Located in `coverage/` directory

## Test Execution Details

**Timing Breakdown:**
- Transform: 400ms - Babel/TypeScript compilation
- Setup: 4.06s - Environment initialization
- Collection: 1.12s - Test discovery
- Tests: 2.42s - Actual test execution
- Environment: 9.13s - Total environment time
- Preparation: 3.76s - Final setup

**Memory Usage:**
- Node process: ~250MB
- Test runner overhead: ~50MB
- Test data retention: ~10MB

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Frontend Tests
  run: |
    cd frontend
    npm install --legacy-peer-deps
    npm test -- --run
```

### GitLab CI Example
```yaml
test:frontend:
  script:
    - cd frontend
    - npm install --legacy-peer-deps
    - npm test -- --run
```

## Troubleshooting

### Common Issues

**"Cannot find module" errors**
- Ensure all imports have correct paths
- Check file extensions consistency
- Verify mock files exist

**Timeout errors (5000ms)**
- Increase timeout: `it('test', async () => {...}, 10000)`
- Use `vi.useFakeTimers()` for timer tests
- Check for infinite loops in tested code

**"window is not defined" errors**
- Environment is already set to jsdom
- Some globals may need manual mocking
- Check setup.js for missing initializations

**Mock not working**
- Ensure `vi.mock()` is at module top-level
- Check mock path relative to test file
- Reset mocks between tests with `vi.clearAllMocks()`

## Future Enhancements

### Short Term (Planned)
- [ ] Integration tests with Supabase
- [ ] E2E tests with Playwright
- [ ] Performance benchmarking tests
- [ ] Accessibility (a11y) tests

### Medium Term
- [ ] Visual regression testing (Percy/Chromatic)
- [ ] Snapshot testing for component rendering
- [ ] Mutation testing (Stryker)
- [ ] Load testing for API responses

### Long Term
- [ ] Full E2E workflow testing
- [ ] Cross-browser testing (BrowserStack)
- [ ] Mobile responsiveness testing
- [ ] Continuous visual regression monitoring

## Maintenance Guidelines

### Adding New Tests
1. Create file in appropriate module directory
2. Follow naming convention: `ComponentName.test.jsx`
3. Use existing patterns and fixtures
4. Add to this documentation
5. Run full test suite before committing

### Updating Tests
- Keep tests synchronized with component changes
- Update mocks when API contracts change
- Review coverage for modified code
- Consider edge cases and error scenarios

### Code Review Checklist
- [ ] All new code has corresponding tests
- [ ] Tests follow established patterns
- [ ] No hardcoded test data in source
- [ ] Proper mock/stub usage
- [ ] Clear test descriptions
- [ ] No skipped (`.skip`) tests in main branch

## Dependencies

**Core Testing:**
- `vitest@1.0.4` - Test runner
- `@testing-library/react@14.1.2` - React component testing
- `@testing-library/jest-dom@6.1.5` - DOM matchers
- `jsdom@23.0.1` - DOM simulation

**Utilities:**
- `@testing-library/user-event@14.5.1` - User interaction simulation
- `@vitest/ui@1.0.4` - Visual test interface

**Development:**
- React 19.2.4+
- Vite 7.3.1+ (required for Vitest integration)

## Support & Questions

For issues or questions about testing:
1. Check this documentation
2. Review test examples in corresponding modules
3. Check Vitest/React Testing Library docs
4. Create issue on GitHub with test details

---

**Last Updated**: March 29, 2026
**Version**: 1.0
**Test Coverage**: 107 tests | 100% pass rate
