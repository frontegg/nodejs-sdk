export interface CodeExchangeRequest {
  /**
   * The code provided by Frontegg once the user is authenticated to validate the user authentication
   */
  code: string;
  /**
   * Required only if the state was provided in the request authentication method
   */
  state?: string;
}
