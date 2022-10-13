import { IUser } from '../../middlewares';

export {};

declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
    }
  }
}
