import { IBellAction } from './';


export interface IBellProperties {
  /**
   * Send the bell notification to specific user, by his ID.
   */
  userId?: string;

  /**
   * Notification title.
   */
  title?: string;

  /**
   * Notification body.
   */
  body?: string;

  /**
   * Notification severity, default will be Info.
   */
  severity?: string;

  /**
   * Notification expiration Date, by default the notification won't have expiration date.
   */
  expiryDate?: Date;

  /**
   * The url that will be opened on a new window on click.
   */
  url?: string;

  /**
   * Actions array that will be shown in the notification.
   */
  actions?: IBellAction[];
}
