export interface ChannelStatus {
  status: string;
  errorMetadata: Record<string, any>;
}

export interface EventStatus {
  eventKey: string;
  eventId: string;
  channels: Record<string, ChannelStatus>;
}
