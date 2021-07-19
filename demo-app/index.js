const express = require('express');
const { FronteggPermissions, frontegg } = require('@frontegg/client')

const app = express();

const clientId = process.env.CLIENT_ID
const apiKey = process.env.API_KEY
const port = process.env.PORT || 8080

app.use('/frontegg', frontegg({
    clientId,
    apiKey,
    contextResolver: async (req) => {
        const permissions = [FronteggPermissions.All];

        return {
            userId: req.user ? req.user.sub : 'my-user-id',
            tenantId: req.user ? req.user.tenantId : 'my-tenant-id',
            permissions,
        };
    },
}));

app.listen(port)