import { IAuditProperties, IBellProperties, IWebpushProperties, WebhookBody, ISlackProperties } from './';

export interface IChannelsConfiguration {
  /**
   * True to use default properties or set properties for this channel.
   */
  slack?: true | ISlackProperties;

  /**
   * True to send default properties in the body or add additional properties.
   */
  webhook?: true | WebhookBody;

  /**
   * True to use default properties or set properties for this channel.
   */
  webpush?: true | IWebpushProperties;

  /**
   * True to use default properties or set properties for this channel.
   */
  audit?: true | IAuditProperties;

  /**
   * True to use default properties or set properties for this channel.
   */
  bell?: true | IBellProperties;
}
