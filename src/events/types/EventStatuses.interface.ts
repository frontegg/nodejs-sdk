export type eventChannelStatus = 'PENDING' | 'FAILED' | 'SUCCEEDED'



export interface IEventStatuses {
  eventKey: string,
  eventId: string,
  channels: {
    slack: {
      status: eventChannelStatus,
      errorMetadata: {
        errorsByChannel?: {
          channelId?: string,
          error: string
        }[]
      }
    },
    email: {
      status: eventChannelStatus,
      errorMetadata: {
        error?: string
      }
    },
    sms: {
      status: eventChannelStatus,
      errorMetadata: {
        error?: string
      }
    }
  }
}
