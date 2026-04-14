import * as express from 'express';
import * as http from 'http';
import { FronteggAuthenticator } from '../authenticator';
import { FronteggContext } from '../components/frontegg-context';
import { withAuthentication } from '../middlewares/with-authentication';
import { E2E_CLIENT_ID, E2E_API_KEY, requireApiKey } from './setup';

describe('withAuthentication middleware E2E', () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    requireApiKey();
    FronteggContext.init({
      FRONTEGG_CLIENT_ID: E2E_CLIENT_ID,
      FRONTEGG_API_KEY: E2E_API_KEY,
    });

    const app = express();
    app.get('/protected', withAuthentication(), (req, res) => {
      res.json({ user: (req as any).frontegg?.user });
    });
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(err.statusCode || 500).json({ error: err.message });
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        port = (server.address() as any).port;
        resolve();
      });
    });
  });

  afterAll((done) => {
    server?.close(done);
  });

  it('should reject requests without auth header', async () => {
    const response = await fetch(`http://localhost:${port}/protected`);
    expect(response.status).toBe(401);
  });

  it('should reject requests with invalid token', async () => {
    const response = await fetch(`http://localhost:${port}/protected`, {
      headers: { authorization: 'Bearer invalid-token' },
    });
    expect(response.status).toBe(401);
  });
});
