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
    const permissions = [FronteggPermissions.All];

    return {
      email,
      tenantId,
      permissions
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
       const permissions = [FronteggPermissions.All];
    
       return {
         email,
         tenantId,
         permissions
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


### Notifications

Allow your customers to be aware of any important business related event they need to pay attention to, both in the dashboard and even when offline.

Frontegg’s Managed Notifications feature allows a SaaS company to embed an end-to-end working feature in just 5 lines of code.


#### Sending notifications

```javascript
import { NotificationsClient } from '@frontegg/client'
const notificationsClient = new NotificationsClient();

// First initialize the module
await notificationsClient.init('YOUR-CLIENT-ID', 'YOUR-API-KEY');

// Set the notification you want to send
const notification = {
  "title": "Notification Title",
  "body": "Notification Body",
  "severity": "info",
  "url": "example.com" // url to be opened when user clicks on the notification
}

// send the notification to a specific user 
await notificationsClient.sendToUser('RECEPIENT-USER-ID', 'RECEPIENT-TENANT-ID', notification)

// send the notification to all tenant users
await notificationsClient.sendToTenantUsers('RECEPIENT-TENANT-ID', notification)

// send the notification to all users
await notificationsClient.sendToAllUsers(notification)

```

### Role Based Access Middleware
Protect your routes and controllers with a simple middleware and policy
The middleware needs to run **BEFORE** the rest of your routes and controllers and is initiated via a simple policy and context hook

```javascript
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
```