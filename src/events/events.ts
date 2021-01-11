import axios from 'axios';
import { FronteggAuthenticator } from "../authenticator";
import { config } from '../config';
import { NoDataException, NoEventKeyException } from "./types/errors";
import { EventId, EventIdResponse, EventTrigger } from "./types/event-types";
import { EventStatus } from './types/status-types';

export class EventsClient {
	constructor(private readonly authenticator: FronteggAuthenticator) { }

	public async send(tenantId: string, ev: EventTrigger): Promise<EventId> {
		this.validateInput(ev);

		await this.authenticator.validateAuthentication();
		const response = await this.sendEventRequest(tenantId, ev);
		return response.eventId;
	}

	public async getStatus(eventId: EventId): Promise<EventStatus> {
		await this.authenticator.validateAuthentication();
		return this.sendEventStatusRequest(eventId);
	}

	private validateInput(ev: EventTrigger): void {
		if (!ev.eventKey) {
			throw new NoEventKeyException();
		}

		if (!(ev.data && ev.data.title && ev.data.description)) {
			throw new NoDataException();
		}
	}

	private async sendEventRequest(tenantId: string, ev: EventTrigger): Promise<EventIdResponse> {
		const response = await axios.post<EventIdResponse>(
			`${config.urls.eventService}/resources/triggers/v3`,
			ev,
			{
				headers: {
					'x-access-token': this.authenticator.accessToken,
					'frontegg-tenant-id': tenantId,
				},
			}
		);

		return response.data;
	}

	private async sendEventStatusRequest(eventId: EventId): Promise<EventStatus> {
		const response = await axios.get<EventStatus>(`${config.urls.eventService}/resources/triggers/v3/${eventId}/statuses`, {
			headers: {
				'x-access-token': this.authenticator.accessToken,
			},
		});
		return response.data;
	}
}