export interface RequestAuthorize {
  /**
   * Optional state which will be returned from hosted login once the user authenticated.
   * In case it was provided, it should be provided on the code exchange method as well.
   * */
  state?: string
}
