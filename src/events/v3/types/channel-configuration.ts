export interface EmailConfig {
	from?: string,
	html?: string,
	subject?: string,
}

export interface SlackConfig {
	/**
	 * Convenience api
	 * Use this list of emails to convert them to slack-user channel id and add 
	 */
	emails?: string[],

	/**
	 * https://api.slack.com/methods/chat.postMessage
	 */
	slackMessageConfig?: Record<string, any>
}

export interface ChannelConfiguration {
	email?: EmailConfig,
	slack?: SlackConfig
}