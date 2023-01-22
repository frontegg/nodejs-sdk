import { verify } from 'jsonwebtoken';
import Logger from '../../../components/logger';
import {
  FailedToAuthenticateException,
  InsufficientPermissionException,
  InsufficientRoleException,
  InvalidTokenTypeException,
} from '../exceptions';
import {
  IEntity,
  tokenTypes,
  AuthHeaderType,
  IValidateTokenOptions,
  IEntityWithRoles,
  TEntityWithRoles,
} from '../types';

export abstract class TokenResolver<T extends IEntity> {
  constructor(protected allowedTokenTypes: tokenTypes[], private readonly type: AuthHeaderType) {}

  public abstract validateToken(
    token: string,
    publicKey: string,
    options?: IValidateTokenOptions,
  ): Promise<T | TEntityWithRoles<T>>;

  protected async verifyToken(token: string, publicKey: string): Promise<T> {
    const entity = await this.verifyAsync<T>(token, publicKey);
    this.validateTokenType(entity.type);

    return entity;
  }

  public validateTokenType(tokenType: tokenTypes): void {
    if (!this.allowedTokenTypes.some((type) => type === tokenType)) {
      Logger.info('Invalid token type');
      throw new InvalidTokenTypeException();
    }
  }

  public async validateRolesAndPermissions(
    { roles: entityRoles, permissions: entityPermissions }: IEntityWithRoles,
    options: Pick<IValidateTokenOptions, 'permissions' | 'roles'>,
  ): Promise<void> {
    if (options) {
      const { roles, permissions } = options;
      if (roles && roles.length > 0) {
        let haveAtLeastOneRole = false;
        for (const requestedRole of roles) {
          if (entityRoles && entityRoles.includes(requestedRole)) {
            haveAtLeastOneRole = true;
            break;
          }

          if (!haveAtLeastOneRole) {
            Logger.info('Insufficient role');
            throw new InsufficientRoleException();
          }
        }
      }

      if (permissions && permissions.length > 0) {
        let haveAtLeastOnePermission = false;
        for (const requestedPermission of permissions) {
          if (entityPermissions && entityPermissions.includes(requestedPermission)) {
            haveAtLeastOnePermission = true;
            break;
          }
        }

        if (!haveAtLeastOnePermission) {
          Logger.info('Insufficient permission');
          throw new InsufficientPermissionException();
        }
      }
    }
  }

  protected abstract getEntity(entity: T): Promise<IEntityWithRoles>;

  public shouldHandle(type: AuthHeaderType): boolean {
    return this.type === type;
  }

  private verifyAsync<T>(token: string, publicKey: string): Promise<T> {
    return new Promise((resolve, reject) => {
      verify(token, publicKey, { algorithms: ['RS256'] }, (err, decoded: any) => {
        const data: T = decoded;
        if (err) {
          Logger.error('Failed to verify jwt - ', err);
          reject(new FailedToAuthenticateException());
          return;
        }

        resolve(data);
        return;
      });
    });
  }
}
