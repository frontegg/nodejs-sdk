import { ChatPostMessageArguments } from '@slack/web-api';

export interface ISlackProperties extends Partial<ChatPostMessageArguments>{
  /**
   * Send direct message to user by its email.
   */
  emails?: string[]
}
