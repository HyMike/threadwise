# Tests

## API Tests

API integration tests that verify the workspace analyzer endpoints work correctly.

### Prerequisites

**Important**: The API server must be running before you run these tests!

```bash
# Terminal 1: Start the API server
npm run dev

# Terminal 2: Run the tests
npm test
```

**Note**: Tests use mocks for external dependencies (Slack API, LLM API) to avoid rate limits and ensure fast, reliable tests. The mocks are automatically loaded by Jest.

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test workspaceAnalyzer.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode (for development)
npm test -- --watch

# Run with verbose output
npm test -- --verbose
```

### Environment Variables

You can customize the test configuration:

```bash
# Test against a different API URL
API_URL=http://localhost:4000 npm test

# Test a specific workspace
TEST_WORKSPACE_ID=my-workspace npm test

# Both
API_URL=http://staging.example.com TEST_WORKSPACE_ID=staging-ws npm test
```

### What's Being Tested

1. **Health Check** - Verifies the API is running and responsive
2. **Single Workspace Analysis** - Tests analyzing a specific workspace
3. **Bulk Analysis** - Tests analyzing all workspaces at once
4. **Workspace Status** - Tests retrieving workspace information
5. **Error Handling** - Tests invalid requests and edge cases
6. **Concurrent Requests** - Tests handling multiple simultaneous requests

### Test Structure

```
tests/
└── api/
    └── workspaceAnalyzer.test.ts  # API endpoint tests
```

### Mocks

Tests use mocks for external dependencies located in `tests/__mocks__/`:

- **slackClient.mock.ts** - Mocks Slack API calls (users, threads, messages)
- **llm.mock.ts** - Mocks LLM API calls (OpenAI, etc.)

This allows tests to run fast and reliably without:

- Hitting Slack API rate limits
- Requiring valid API credentials
- Depending on external service availability
- Processing actual threads

### Notes

- Tests are integration tests that hit your actual API endpoints
- External dependencies (Slack, LLM) are mocked
- Default timeout is 30 seconds
- Tests should complete in seconds, not minutes
- No API credentials required for tests

### Troubleshooting

**Tests timing out:**

- Increase the timeout: `jest.setTimeout(300000)` in the test
- Check if the API server is running
- Verify your LLM API key is valid

**Connection refused:**

- Make sure the API server is running on the correct port
- Check API_URL environment variable

**Tests failing:**

- Check the API server logs for errors
- Verify your .env configuration
- Make sure you have threads in the configured Slack channel
