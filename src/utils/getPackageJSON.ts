import { Package } from 'normalize-package-data';

export const getPackageJson = (): Package | void => {
  try {
    let pjson: Package;
    try {
      pjson = require('../../../package.json');
    } catch (e) {
      pjson = require('../../package.json');
    }
    return pjson;
  } catch (e) {
    /* eslint-disable no-empty */
  }
};
