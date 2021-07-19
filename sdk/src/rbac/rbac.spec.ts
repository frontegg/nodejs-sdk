import axios from 'axios';
import * as express from 'express';
import { Server } from 'http';

import { RbacMiddleware } from './index';

jest.setTimeout(60000);
describe('rbac.middleware', () => {
  let server: Server;
  let app: express.Express;
  beforeEach(() => {
    app = express();
  });

  afterEach(() => {
    server.close();
  });

  it('should allow to pass when defined to any any', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { roles: ['admin'] } },
      policy: {
        default: 'allow',
        rules: []
      }
    }));

    app.post('/api/policy', (req, res) => {
      res.status(200).send();
    });
    server = app.listen(3456);
    const response = await axios.post('http://localhost:3456/api/policy');
    expect(response.status).toEqual(200);
  });

  it('should allow to pass when the actual route is defined', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { roles: ['admin'] } },
      policy: {
        default: 'deny',
        rules: [{
          url: '/api/policy',
          method: '*',
          requiredRoles: ['admin']
        }]
      }
    }));

    app.post('/api/policy', (req, res) => {
      res.status(200).send();
    });
    server = app.listen(3456);
    const response = await axios.post('http://localhost:3456/api/policy');
    expect(response.status).toEqual(200);
  });

  it('should allow to pass when the actual route and method are defined', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { roles: ['admin'] } },
      policy: {
        default: 'deny',
        rules: [{
          url: '/api/policy',
          method: 'POST',
          requiredRoles: ['admin']
        }]
      }
    }));

    app.post('/api/policy', (req, res) => {
      res.status(200).send();
    });
    server = app.listen(3456);
    const response = await axios.post('http://localhost:3456/api/policy');
    expect(response.status).toEqual(200);
  });

  it('should not allow to pass when the actual route is defined but the method is wrong', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { roles: ['admin'] } },
      policy: {
        default: 'deny',
        rules: [{
          url: '/api/policy',
          method: 'GET',
          requiredRoles: ['admin']
        }]
      }
    }));

    app.post('/api/policy', (req, res) => {
      res.status(200).send();
    });
    server = app.listen(3456);
    try {
      await axios.post('http://localhost:3456/api/policy');
    } catch (e) {
      expect(e.response.status).toEqual(403);
      return;
    }

    throw new Error('Should have thrown');
  });

  it('should not allow to pass when the actual method is defined but the route is wrong', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { roles: ['admin'] } },
      policy: {
        default: 'deny',
        rules: [{
          url: '/api/team',
          method: 'POST',
          requiredRoles: ['admin']
        }]
      }
    }));

    app.post('/api/policy', (req, res) => {
      res.status(200).send();
    });
    server = app.listen(3456);
    try {
      await axios.post('http://localhost:3456/api/policy');
    } catch (e) {
      expect(e.response.status).toEqual(403);
      return;
    }

    throw new Error('Should have thrown');
  });

  it('should allow when regex match', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { roles: ['admin'] } },
      policy: {
        default: 'deny',
        rules: [{
          url: '/api/policy/*',
          method: 'POST',
          requiredRoles: ['admin']
        }]
      }
    }));

    app.post('/api/policy/v1/actions', (req, res) => {
      res.status(200).send();
    });
    server = app.listen(3456);
    await axios.post('http://localhost:3456/api/policy/v1/actions');
  });

  it('should allow when defining a policy based on permissions', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { roles: ['admin'], permissions: ['policy.read', 'policy.create'] } },
      policy: {
        default: 'deny',
        rules: [{
          url: '/api/policy/*',
          method: 'GET',
          requiredPermissions: ['policy.read']
        }, {
          url: '/api/policy/*',
          method: 'POST',
          requiredPermissions: ['policy.create']
        }]
      }
    }));

    app.get('/api/policy/v1/actions', (req, res) => {
      res.status(200).send();
    });

    app.post('/api/policy/v1/actions', (req, res) => {
      res.status(200).send();
    });

    server = app.listen(3456);
    await axios.get('http://localhost:3456/api/policy/v1/actions');
    await axios.post('http://localhost:3456/api/policy/v1/actions');

  })

  it('should block when defining a policy based on permissions and accessing a forbidden route', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { roles: ['admin'], permissions: ['policy.read', 'policy.create'] } },
      policy: {
        default: 'deny',
        rules: [{
          url: '/api/policy/*',
          method: 'GET',
          requiredPermissions: ['policy.read']
        }, {
          url: '/api/policy/*',
          method: 'POST',
          requiredPermissions: ['policy.create']
        }]
      }
    }));

    app.get('/api/policy/v1/actions', (req, res) => {
      res.status(200).send();
    });

    app.post('/api/policy/v1/actions', (req, res) => {
      res.status(200).send();
    });

    server = app.listen(3456);
    try {
      await axios.delete('http://localhost:3456/api/policy/v1/actions');
    } catch (e) {
      expect(e.response.status).toEqual(403);
      return;
    }

    throw new Error('Should have thrown');
  })

  it('should not allow when regex match but method is wrong', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { roles: ['admin'] } },
      policy: {
        default: 'deny',
        rules: [{
          url: '/api/policy/*',
          method: 'GET',
          requiredRoles: ['admin']
        }]
      }
    }));

    app.post('/api/policy/v1/actions', (req, res) => {
      res.status(200).send();
    });

    server = app.listen(3456);
    try {
      await axios.post('http://localhost:3456/api/policy/v1/actions');
    } catch (e) {
      expect(e.response.status).toEqual(403);
      return;
    }

    throw new Error('Should have thrown');
  });

  it('should not allow when regex match but higher policy is defined', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { permissions: ['read'] } },
      policy: {
        default: 'deny',
        rules: [{
          url: '/api/admin/*',
          method: '*',
          requiredPermissions: ['write']
        }, {
          url: '/api/*',
          method: '*',
          requiredPermissions: ['read']
        }]
      }
    }));

    app.post('/api/admin/policy/v1/actions', (req, res) => {
      res.status(200).send();
    });

    server = app.listen(3456);
    try {
      await axios.post('http://localhost:3456/api/admin/policy/v1/actions');
    } catch (e) {
      expect(e.response.status).toEqual(403);
      return;
    }

    throw new Error('Should have thrown');
  });

  it('should allow when regex match and meets higher policy', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { permissions: ['write'] } },
      policy: {
        default: 'deny',
        rules: [{
          url: '/api/admin/*',
          method: '*',
          requiredPermissions: ['write']
        }, {
          url: '/api/*',
          method: '*',
          requiredPermissions: ['read']
        }]
      }
    }));

    app.post('/api/admin/policy/v1/actions', (req, res) => {
      res.status(200).send();
    });

    server = app.listen(3456);
    await axios.post('http://localhost:3456/api/admin/policy/v1/actions');
  });

  it('should allow when regex match and meets both policies', async () => {
    app.use(RbacMiddleware({
      contextResolver: async (req) => { return { permissions: ['read', 'write'] } },
      policy: {
        default: 'deny',
        rules: [{
          url: '/api/admin/*',
          method: '*',
          requiredPermissions: ['write']
        }, {
          url: '/api/*',
          method: '*',
          requiredPermissions: ['read']
        }]
      }
    }));

    app.post('/api/all', (req, res) => {
      res.status(200).send();
    });

    server = app.listen(3456);
    await axios.post('http://localhost:3456/api/all');
  });

  it('should allow to pass to other routes which are defined on the policy', async () => {
    app.use(RbacMiddleware({
      // Hook to the role in the context of the request (each request can contain several roles / permissions)
      contextResolver: async (req) => { return { roles: ['admin'], permissions: ['rule.delete'] } },
      // Define the policy
      policy: {
        default: 'deny', // Can be 'allow' as default as well
        rules: [{
          url: '/api/admin/*',
          method: '*',
          requiredPermissions: ['write'] // For each of the admin routes require 'write' permissions
        }, {
          url: '/api/*',
          method: '*',
          requiredPermissions: ['read']  // For all the /api require 'read' permissions
        }, {
          url: '*',
          method: '*',
          requiredRoles: [],
          requiredPermissions: []  // For all the other APIs allow without any required permissions / roles
        }]
      }
    }));

    app.post('/moshe', (req, res) => {
      res.status(200).send();
    });

    server = app.listen(3456);
    await axios.post('http://localhost:3456/moshe');
  })
});
