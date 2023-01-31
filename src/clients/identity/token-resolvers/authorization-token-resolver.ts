import { AuthHeaderType, IEntityWithRoles, IValidateTokenOptions, tokenTypes } from '../types';
import { TokenResolver } from './token-resolver';

export class AuthorizationJWTResolver extends TokenResolver<IEntityWithRoles> {
  constructor() {
    super([tokenTypes.TenantApiToken, tokenTypes.UserApiToken, tokenTypes.UserToken], AuthHeaderType.JWT);
  }

  public async validateToken(
    token: string,
    publicKey: string,
    options?: IValidateTokenOptions,
  ): Promise<IEntityWithRoles> {
    const entity = await super.verifyToken(token, publicKey);

    if (options?.permissions?.length || options?.roles?.length) {
      await this.validateRolesAndPermissions(entity, options);
    }

    return entity;
  }

  protected async getEntity(entity: IEntityWithRoles): Promise<IEntityWithRoles> {
    return entity;
  }
}
