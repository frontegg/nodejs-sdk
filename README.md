<br />
<div align="center">
<img src="https://fronteggstuff.blob.core.windows.net/frongegg-logos/logo-transparent.png" alt="Frontegg Logo" width="400" height="90">

<h3 align="center">Frontegg Node.js Client</h3>

  <p align="center">
    Frontegg is a web platform where SaaS companies can set up their fully managed, scalable and brand aware - SaaS features and integrate them into their SaaS portals in up to 5 lines of code.
    <br />
    <h3><a href="https://docs.frontegg.com/docs/using-frontegg-sdk"><strong>Explore the docs »</strong></a></h3> 
    <a href="https://github.com/frontegg-samples/nodejs-sample">Sample Project</a>
    ·
    <a href="https://github.com/frontegg/nodejs-sdk/issues">Report Bug</a>
    ·
    <a href="https://github.com/frontegg/nodejs-sdk/issues">Request Feature</a>
  </p>
</div>

<h3>Table of Contents</h3>
<ul>
    <li><a href="#breaking-changes">Breaking Changes</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#usage">Usage</a></li>
</ul>

## Breaking Changes

* ### As of version 3.0.0 and 4.0.0, we will no longer provide proxy middlewares
* ### As of version 5.0.0, node 12 is no loner supported.

To see an example implementation, head over to our
<a href="https://github.com/frontegg-samples/nodejs-proxy-sample">sample proxy project</a>

---

## Installation

Install the package using [npm](https://www.npmjs.com/)

```bash
# node 14+
npm install @frontegg/client
```

---

## Usage

Frontegg offers multiple components for integration with the Frontegg's scaleable back end and front end libraries

Initialize the frontegg context when initializing your app

```javascript
const { FronteggContext } = require('@frontegg/client');

FronteggContext.init({
  FRONTEGG_CLIENT_ID: '<YOUR_CLIENT_ID>',
  FRONTEGG_API_KEY: '<YOUR_API_KEY>',
});
```

### Middleware

Use Frontegg's "withAuthentication" auth guard to protect your routes.

A simple usage example:

```javascript
const { withAuthentication } = require('@frontegg/client');

// This route can now only be accessed by authenticated users
app.use('/protected', withAuthentication(), (req, res) => {
  // Authenticated user data will be available on the req.frontegg object
  callSomeAction(req.frontegg.user);
  res.status(200);
});
```

Head over to the <a href="https://docs.frontegg.com/docs/using-frontegg-sdk">Docs</a> to find more usage examples of the guard.

### Access tokens

When using M2M authentication, access tokens will be cached by the SDK.
By default access tokens will be cached locally, however you can use two other kinds of cache:

- ioredis
- redis

#### Use ioredis as your cache
When initializing your context, pass an access tokens options object with your ioredis parameters

```javascript
const { FronteggContext } = require('@frontegg/client');

const accessTokensOptions = {
  cache: {
    type: 'ioredis',
    options: {
      host: 'localhost',
      port: 6379,
      password: '',
      db: 10,
    },
  },
};

FronteggContext.init(
  {
    FRONTEGG_CLIENT_ID: '<YOUR_CLIENT_ID>',
    FRONTEGG_API_KEY: '<YOUR_API_KEY>',
  },
  {
    accessTokensOptions,
  },
);
```

#### Use redis as your cache
When initializing your context, pass an access tokens options object with your redis parameters

```javascript
const { FronteggContext } = require('@frontegg/client');

const accessTokensOptions = {
  cache: {
    type: 'redis',
    options: {
      url: 'redis[s]://[[username][:password]@][host][:port][/db-number]',
    },
  },
};

FronteggContext.init(
  {
    FRONTEGG_CLIENT_ID: '<YOUR_CLIENT_ID>',
    FRONTEGG_API_KEY: '<YOUR_API_KEY>',
  },
  {
    accessTokensOptions,
  },
);
```

### Clients

Frontegg provides various clients for seamless integration with the Frontegg API.

For example, Frontegg’s Managed Audit Logs feature allows a SaaS company to embed an end-to-end working feature in just 5 lines of code

#### Create a new Audits client

```javascript
const { AuditsClient } = require('@frontegg/client');
const audits = new AuditsClient();

// initialize the module
await audits.init('MY-CLIENT-ID', 'MY-AUDITS-KEY');
```

#### Sending audits

```javascript
await audits.sendAudit({
  tenantId: 'my-tenant-id',
  time: Date(),
  user: 'info@frontegg.com',
  resource: 'Portal',
  action: 'Login',
  severity: 'Medium',
  ip: '1.2.3.4',
});
```

#### Fetching audits

```javascript
const { data, total } = await audits.getAudits({
  tenantId: 'my-tenant-id',
  filter: 'any-text-filter',
  sortBy: 'my-sort-field',
  sortDirection: 'asc | desc',
  offset: 0, // Offset for starting the page
  count: 50, // Number of desired items
});
```

### Entitlements Client

#### Initializing the client
```javascript

const { EntitlementsClient } = require('@frontegg/client');

// initialize the FronteggContext
FronteggContext.init(
  {
    FRONTEGG_CLIENT_ID: '<YOUR_CLIENT_ID>',
    FRONTEGG_API_KEY: '<YOUR_API_KEY>',
  },
  {
    accessTokensOptions,
  },
);

// initialize entitlements client
const client = await EntitlementsClient.init(/* */);
await client.ready();
```

#### Using the client
The client can be used to determine if authorized user or tenant is entitled to particular feature or permission.

First, we need to validate its token, using the `IdentityClient`:
```javascript
// validate token and decode its properties
const userOrTenantEntity = await identityClient.validateToken(token, { withRolesAndPermissions: true });
```
> Note, that some JWT tokens might not contain permissions stored in their payloads. Permissions are essential for
> entitlement decision-making, so remember to add option flag: `withRolesAndPermissions: true`. 

(see <a href="#validating-jwt-manually">Validating JWT manually</a> section for more details).
 
When the user/tenant entity is resolved, you can start querying the entitlements engine:
```javascript
const userEntitlementsClient = client.forUser(userOrTenantEntity);

let result;

// asking for feature entitlement
result = await userEntitlementsClient.isEntitledToFeature('foo');
// or
result = await userEntitlementsClient.isEntitledTo({
  featureKey: 'foo'
});

// asking for permission entitlement
result = await userEntitlementsClient.isEntitledToPermission('foo.read');
// or
result = await userEntitlementsClient.isEntitledTo({
  permissionKey: 'foo'
});
```

The result of those queries has the following structure:
```typescript
type IsEntitledResult = {
  result: boolean,
  reason?: string
}
```
When `result: true`, then `reason` is not given.

#### Closing the client
To gracefully close the client:
```javascript
client.destroy();
```

### Working with the REST API

Frontegg provides a comprehensive REST API for your application.
In order to use the API from your backend it is required to initialize the client and the
authenticator which maintains the backend to backend session

```javascript
const authenticator = new FronteggAuthenticator();
await authenticator.init('<YOUR_CLIENT_ID>', '<YOUR_API_KEY>');

// You can optionally set the base url from the HttpClient
const httpClient = new HttpClient(authenticator, { baseURL: 'https://api.frontegg.com' });

await httpClient.post(
  'identity/resources/auth/v1/user',
  {
    email: 'johndoe@acme.com',
    password: 'my-super-duper-password',
  },
  {
    // When providing vendor-host, it will replace(<...>) https://<api>.frontegg.com with vendor host
    'frontegg-vendor-host': 'acme.frontegg',
  },
);
```

### <a name="validating-jwt-manually"></a>Validating JWT manually

If required you can implement your own middleware which will validate the Frontegg JWT using the `IdentityClient`

First, let's import the `IdentityClient`

```javascript
const { IdentityClient } = require('@frontegg/client');
```

Then, initialize the client

```javascript
const identityClient = new IdentityClient({ FRONTEGG_CLIENT_ID: 'your-client-id', FRONTEGG_API_KEY: 'your-api-key' });
```

And use this client to validate

```javascript
app.use('/protected', (req, res, next) => {
  const token = req.headers.authorization;
  let user: IUser;
  try {
    user = identityClient.validateIdentityOnToken(token, { roles: ['admin'], permissions: ['read'] });
    req.user = user;
  } catch (e) {
    console.error(e);
    next(e);
    return;
  }

  next();
});
```
