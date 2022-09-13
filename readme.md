# Frontegg Client

![alt text](https://fronteggstuff.blob.core.windows.net/frongegg-logos/logo-transparent.png)

Frontegg is a web platform where SaaS companies can set up their fully managed, scalable and brand aware - SaaS features and integrate them into their SaaS portals in up to 5 lines of code.


## Installation

Use the package manager [npm](https://www.npmjs.com/) to install frontegg client.

```bash
npm install @frontegg/client
```

## Breaking changes

### v2.0 Events client upgraded to use the v3 Events API

As we grow as a company we also provide new and improved APIs such as the new v3 Events API.
This will allow your to configure more and worry less about channels. It is still not perfect, but we're getting there.
With the new v3 api you'll be able to use the frontegg portal to map events to channels in order to allow your customers to configure their own channels.
The new client will no longer send the channels you wish to trigger, and just use the event's payload.

Please note that email & slack may still require further data (like the email template or slack message format).

Unlike previous clients, the new client requires that you pass a separate authenticator.

Example:
```javascript
	const authenticator = new FronteggAuthenticator();
	await authenticator.init('<YOUR_CLIENT_ID>', '<YOUR_API_KEY>')
	const eventsClient = new EventsClient(authenticator);
	const id = await eventsClient.send(
		'my-tenant-id',
		{
			eventKey: 'my.event',
			data: {
				description: 'my description',
				title: 'my title'
			},
			channelConfiguration: {
				email: {
					from: 'email@email.com',
					html: '<div>{{title}}</div>', // data interpolation using the event data
					subject: 'subject'
				},
				slack: {
					emails: ['email@email.com'],
					slackMessageConfig: {
						// use https://api.slack.com/methods/chat.postMessage data format to fill this configuration
					}
				}
			}
		})
```

---
## Usage

Frontegg offers multiple components for integration with the Frontegg's scaleable back end and front end libraries

### Middleware

When using Frontegg's managed UI features and UI libraries, Frontegg allow simple integration via middleware usage

To use the Frontegg's middleware import the ***frontegg*** middleware from the ***@frontegg/client*** library

```javascript
const { frontegg, FronteggPermissions } = require('@frontegg/client');
```

And use the following lines ***after the authentication verification***

```javascript
app.use('/frontegg', frontegg({
  clientId: 'my-client-id',
  apiKey: 'my-api-key',
  contextResolver: (req) => {
    const email = req.context.user; // The user context (after JWT verification)
    const tenantId = req.context.tenantId; // The tenantId context (after JWT verification)
    const authenticatedEntityType = req.context.authenticatedEntityType; // The authenticated entity type (user/user api token/tenant api token) context (after JWT verification)
    const authenticatedEntityId = req.context.authenticatedEntityId; // The authenticated entity id context (after JWT verification)
    const permissions = [FronteggPermissions.All];

    return {
      email,
      tenantId,
      permissions,
      authenticatedEntityType,
      authenticatedEntityId
    };
  }
}))
```

#### NextJS Middleware

To use the Frontegg's middleware inside NextJS project:
 - Add a new route to your project `/pages/api/frontegg/[...param].ts`
 - Import ***fronteggNextJs***  from the ***@frontegg/client*** library

    ```javascript
    const { fronteggNextJs, FronteggPermissions } = require('@frontegg/client');
    ```

 - And export the middleware from **`/pages/api/frontegg/[...param].ts`**

    ```javascript
    export default fronteggNextJs({
     clientId: 'my-client-id',
     apiKey: 'my-api-key',
     contextResolver: (req) => {
       const email = req.context.user; // The user context (after JWT verification)
       const tenantId = req.context.tenantId; // The tenantId context (after JWT verification)
       const authenticatedEntityType = req.context.authenticatedEntityType; // The authenticated entity type (user/user api token/tenant api token) context (after JWT verification)
       const authenticatedEntityId = req.context.authenticatedEntityId; // The authenticated entity id context (after JWT verification)

       const permissions = [FronteggPermissions.All];

       return {
         email,
         tenantId,
         permissions,
         authenticatedEntityType,
         authenticatedEntityId
       };
     }
    })
    ```


#### Frontegg permissions

When using the Frontegg middleware library, you can choose which functionality is enabled for your user based on his role or based on any other business logic your application holds.

##### Controlling Frontegg permissions

Controlling the permissions is done via the Frontegg middleware by injecting the permissions array

```javascript
/// Allow the user to do everything on all enabled Frontegg modules
const permissions = [FronteggPermissions.All];
```

```javascript
/// Allow the user to do everything on Frontegg audits module
const permissions = [FronteggPermissions.Audit];
```

```javascript
/// Allow the user to read audits and audits stats but not exporting it
const permissions = [FronteggPermissions.Audit.Read, FronteggPermissions.Audit.Stats];
```
### Audits

Let your customers record the events, activities and changes made to their tenant.

Frontegg’s Managed Audit Logs feature allows a SaaS company to embed an end-to-end working feature in just 5 lines of code.


#### Sending audits

```javascript
const { AuditsClient } = require('@frontegg/client')
const audits = new AuditsClient()

// First initialize the module
await audits.init('MY-CLIENT-ID', 'MY-AUDITS-KEY')

// And add audits
await audits.sendAudit({
    tenantId: 'my-tenant-id',
    time: Date(),
    user: 'info@frontegg.com',
    resource: 'Portal',
    action: 'Login',
    severity: 'Medium',
    ip: '1.2.3.4'
})

```

#### Fetching audits

```javascript
const { AuditsClient } = require('@frontegg/client')
const audits = new AuditsClient()

// First initialize the module
await audits.init('MY-CLIENT-ID', 'MY-AUDITS-KEY')

// And add audits
const { data, total } = await audits.getAudits({
    tenantId: 'my-tenant-id',
    filter: 'any-text-filter',
    sortBy: 'my-sort-field',
    sortDirection: 'asc | desc'
    offset: 0,  // Offset for starting the page
    count: 50   // Number of desired items

})

```

### Working with the REST API

Frontegg provides a comprehensive REST API for your application.
In order to use the API from your backend it is required to initialize the client and the
authenticator which maintains the backend to backend session.

```javascript
const authenticator = new FronteggAuthenticator();
await authenticator.init('<YOUR_CLIENT_ID>', '<YOUR_API_KEY>')

// You can optionally set the base url from the HttpClient
const httpClient = new HttpClient(authenticator, { baseURL: 'https://api.frontegg.com' });

await httpClient.post('identity/resources/auth/v1/user', {
    email: 'johndoe@acme.com',
    password: 'my-super-duper-password'
}, {
   'frontegg-vendor-host': 'https://acme.frontegg.com'
});

