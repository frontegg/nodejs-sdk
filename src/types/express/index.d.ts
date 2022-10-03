import { IUser } from '../../middleware';

export {};

declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
    }
  }
}
