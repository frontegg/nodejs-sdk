export interface IBellAction {
  // Display name of the action.
  name: string;

  // Url that the request will be sent to when clicking on the action.
  url: string;

  // Request method.
  method: string;

  // Determent how to render the action.
  visualization: 'Button' | 'Link';
}
