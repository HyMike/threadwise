/**
 * Mock Slack client for testing
 */

export const mockSlackClient = {
  getAllUsersInWorkSpace: jest.fn().mockResolvedValue(
    new Map([
      ['U12345', 'John Doe'],
      ['U67890', 'Jane Smith']
    ])
  ),

  getThreadRoots: jest.fn().mockResolvedValue([
    {
      ts: '1234567890.123456',
      thread_ts: '1234567890.123456',
      reply_count: 5,
      text: 'Test thread message',
      user: 'U12345',
      reply_users_count: 2,
      reply_users: ['U12345', 'U67890'],
      reactions: [],
      is_locked: false
    }
  ]),

  getThreadMessages: jest.fn().mockResolvedValue([
    {
      ts: '1234567890.123456',
      text: 'First message',
      user: 'U12345'
    },
    {
      ts: '1234567890.123457',
      text: 'Reply message',
      user: 'U67890'
    }
  ]),

  getUserName: jest.fn().mockResolvedValue('Test User'),

  postStatusUpdate: jest.fn().mockResolvedValue(undefined),

  addCheckmark: jest.fn().mockResolvedValue(undefined)
};

// Mock the entire slack client module
jest.mock('../../src/clients/slack', () => ({
  slackClient: mockSlackClient,
  SlackClientManager: jest.fn(),
  ThreadMessage: {}
}));
