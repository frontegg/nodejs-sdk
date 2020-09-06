import { ChatPostMessageArguments } from '@slack/web-api';
import { IAuditProperties, IBellProperties, IWebpushProperties, WebhookBody } from './';

export interface IChannelsConfiguration {
  // True to use default properties or set properties for this channel.
  slack?: true | Partial<ChatPostMessageArguments>;

  // True to send default properties in the body or add additional properties.
  webhook?: true | WebhookBody;

  // True to use default properties or set properties for this channel.
  webpush?: true | IWebpushProperties;

  // True to use default properties or set properties for this channel.
  audit?: true | IAuditProperties;

  // True to use default properties or set properties for this channel.
  bell?: true | IBellProperties;
}
