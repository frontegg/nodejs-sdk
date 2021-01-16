import { IChannelsConfiguration } from './';

export interface ITriggerOptions {
  /**
   * Event key to trigger channel configuration by.
   */
  eventKey: string;

  /**
   * Default properties for all the channels - can be override in the channel configuration.
   */
  properties: {
    title: string;
    description: string;
    [x: string]: any
  };

  /**
   * trigger the event for a specific tenantId.
   */
  tenantId?: string;

  /**
   * configuration of the channels the event will be sent to.
   */
  channels: IChannelsConfiguration;
}
