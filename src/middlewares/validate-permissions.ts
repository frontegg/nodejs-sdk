import {IdentityClient} from "../clients";
import {withAuthentication} from "./with-authentication";

const policyFromFile = require('/Users/amirjaron/source/frontegg/nodejs-sdk/src/middlewares/policy.json');

async function getApiSecurityPolicy() {
    return await IdentityClient.getInstance().getApiSecurityPolicy()
    //return policyFromFile;
}

// Custom middleware function for permission validation
export async function validatePermissions(req, res, next) {

    const policy = await getApiSecurityPolicy();
    const { path, method } = req;

    const routePolicy = policy.find(
        (route) => route.resourceName === path && route.method === method
    );

    console.log("Policy found:",routePolicy);

    if (!routePolicy || !routePolicy.permissions) {
       return next();
    }

    const requiredPermissionKeys = routePolicy.permissions.map(permission => permission.key);
    console.log("REquired permissions", requiredPermissionKeys);
    return withAuthentication({permissions: requiredPermissionKeys}) (req,res, next);
}
