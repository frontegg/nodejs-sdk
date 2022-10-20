import { IUser } from '../../middlewares';

export {};

declare global {
  namespace Express {
    interface Request {
      frontegg?: {
        user: IUser
      };
    }
  }
}
