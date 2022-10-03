<br />
<div align="center">
<img src="https://fronteggstuff.blob.core.windows.net/frongegg-logos/logo-transparent.png" alt="Frontegg Logo" width="400" height="90">

<h3 align="center">Frontegg Node.js client</h3>

  <p align="center">
    Frontegg is a web platform where SaaS companies can set up their fully managed, scalable and brand aware - SaaS features and integrate them into their SaaS portals in up to 5 lines of code.
    <br />
    <a href="https://docs.frontegg.com/docs/using-frontegg-sdk"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/frontegg-samples/nodejs-sample">Sample Project</a>
    ·
    <a href="https://github.com/frontegg/nodejs-sdk/issues">Report Bug</a>
    ·
    <a href="https://github.com/frontegg/nodejs-sdk/issues">Request Feature</a>
  </p>
</div>

<h3>Table of Contents</h3>
<ul>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#breaking-changes">Events Client upgrade notice</a></li>
</ul>

## Installation

Install the package using [npm](https://www.npmjs.com/).

```bash
npm install @frontegg/client
```

---
## Usage

Frontegg offers multiple components for integration with the Frontegg's scaleable back end and front end libraries

### Middleware

Use Frontegg's "withAuthentication" auth guard to protect your routes.

Head over to the <a href="https://docs.frontegg.com/docs/using-frontegg-sdk">Docs</a> to find more usage examples of the guard.

```javascript
const { withAuthentication, ContextHolder } = require('@frontegg/client');

ContextHolder.setContext({
   FRONTEGG_CLIENT_ID: '<YOUR_CLIENT_ID>',
   FRONTEGG_API_KEY: '<YOUR_API_KEY>',
});

// This route can now only be accessed by authenticated users
app.use('/protected', withAuthentication(), (req, res) => {
    res.status(200);
});
```

### Clients

Frontegg provides various clients for seamless integration with the Frontegg API.

For example, Frontegg’s Managed Audit Logs feature allows a SaaS company to embed an end-to-end working feature in just 5 lines of code.

#### Create a new Audits client

```javascript
const { AuditsClient } = require('@frontegg/client');
const audits = new AuditsClient()

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
    ip: '1.2.3.4'
});
```

#### Fetching audits

```javascript
const { data, total } = await audits.getAudits({
    tenantId: 'my-tenant-id',
    filter: 'any-text-filter',
    sortBy: 'my-sort-field',
    sortDirection: 'asc | desc',
    offset: 0,  // Offset for starting the page
    count: 50   // Number of desired items
});
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
    // When providing vendor-host, it will replace(<...>) https://<api>.frontegg.com with vendor host
   'frontegg-vendor-host': 'acme.frontegg'
});
```

---

## Event Client upgrade notice

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