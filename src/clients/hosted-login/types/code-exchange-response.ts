import { IUser } from "../../identity/types";

export interface CodeExchangeResponse {
  /**
   * The user profile information
   */
  user: IUser;
  /**
   * Access token to authenticate as the user in Frontegg APIS
   */
  accessToken: string;
  /**
   * Refresh token to generate new access token
   */
  refreshToken: string;
}
