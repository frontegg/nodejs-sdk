import { ChannelConfiguration } from "./channel-configuration";

export type EventId = string

export type EventIdResponse = { eventId: EventId }

export interface EventProperties {
	title: string;
	description: string;
	[key: string]: any
}

export interface EventTrigger {
	eventKey: string;
	data: EventProperties;
	channelConfiguration?: ChannelConfiguration;
}