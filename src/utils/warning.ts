import processWarning = require('process-warning');

export enum FronteggWarningCodes {
  CONFIG_KEY_MOVED_DEPRECATION = 'CONFIG_KEY_MOVED_DEPRECATION',
}

export const warning = processWarning();

warning.create(
  'FronteggWarning',
  FronteggWarningCodes.CONFIG_KEY_MOVED_DEPRECATION,
  "Config key '%s' is deprecated. Put the configuration in '%s'.",
);
