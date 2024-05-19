jest.mock('../../src/middlewares/auth/authentication');
jest.mock('../../src/libraries/util/githubUtils');

const request = require('supertest');
const { createExpressApp } = require('../../src/server');

const Repository = require('../../src/domains/repository/schema');
const { getOrCreateUserFromGitHubProfile } = require('../../src/auth/index');

let app = null;
let agent = null;

beforeAll(async () => {
  app = createExpressApp();
  const profile = {
    id: 'fakeGithubId',
    nodeId: 'fakeNodeId',
    displayName: 'Fake User',
    username: 'fakeuser',
    profileUrl: 'https://github.com/fakeuser',

    _json: {
      avatar_url: 'https://github.com/images/fake-avatar-url',
      url: 'https://api.github.com/users/fakeuser',
      company: 'Fake Company',
      blog: 'https://fakeuser.github.io',
      location: 'Fake City, Fake Country',
      email: 'fakeuser@fakeemail.com',
      hireable: false,
      bio: 'This is a fake user profile.',
      public_repos: 10,
      public_gists: 5,
      followers: 100,
      following: 50,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2021-01-01T00:00:00Z',
    },

    isDemo: false,
    isVerified: true,
    isAdmin: false,
  };
  const trimmedPayloadForSession = await getOrCreateUserFromGitHubProfile({
    profile: profile,
    accessToken: 'fake-access-token',
  });

  agent = request
    .agent(app)
    .set('x-mock-user', JSON.stringify(trimmedPayloadForSession));
});
afterAll(async () => {
  app = null;
});

const URLS = {
  BASE: '/api/v1/repositories',
  SEARCH: '/api/v1/repositories/search',
  FETCH_FROM_GITHUB: '/api/v1/repositories/fetch-from-github',
};

describe('Domains.Repositories', () => {
  describe('API', () => {
    // clean up
    afterAll(async () => {
      // delete all repositories
      await Repository.deleteMany({});
    });

    // GET /api/v1/repositories/search
    describe('GET /api/v1/repositories/search', () => {
      it('should return status 200 and a JSON response', async () => {
        const response = await agent.get(URLS.SEARCH);
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
      });
    });

    // POST /api/v1/repositories/fetch-from-github
    describe('POST /api/v1/repositories/fetch-from-github', () => {
      it('should return status 200 and a JSON response', async () => {
        const response = await agent.post(URLS.FETCH_FROM_GITHUB).send({
          username: 'octokit',
          repository: 'rest.js',
        });

        expect(response.status).toBe(200);
        expect(response.body._id).not.toBeNull();

        // fetch repository from database
        const repositoryResponse = await agent.get(
          `/api/v1/repositories/${response.body._id}`
        );
        expect(repositoryResponse.status).toBe(200);
        expect(repositoryResponse.body).toEqual(response.body);
      });

      it('should return status 400 if the request body is invalid', async () => {
        const response = await agent.post(URLS.FETCH_FROM_GITHUB).send({
          name: 'Repository',
        });
        expect(response.status).toBe(400);
      });
    });

    // GET /api/v1/repositories/:id
    describe('GET /api/v1/repositories/:id', () => {
      it('should return status 400 when id is not valid', async () => {
        const response = await agent.get(`${URLS.BASE}/123`);
        expect(response.status).toBe(400);
      });

      it('should return status 400 if the request params is invalid', async () => {
        const response = await agent.get(`${URLS.BASE}/invalid-id`);
        expect(response.status).toBe(400);
      });
      //id = 66123283c07ca0e7dcc37990
      it('should return status 404 if the repository is not found', async () => {
        const response = await agent.get(
          `${URLS.BASE}/66123283c07ca0e7dcc37990`
        );
        expect(response.status).toBe(404);
      });
    });
  });
});
