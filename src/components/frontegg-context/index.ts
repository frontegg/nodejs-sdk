export interface IFronteggContext {
  FRONTEGG_CLIENT_ID: string;
  FRONTEGG_API_KEY: string;
}

export class FronteggContext {
  public static getInstance(): FronteggContext {
    if (!FronteggContext.instance) {
      FronteggContext.instance = new FronteggContext();
    }

    return FronteggContext.instance;
  }

  public static init(context: IFronteggContext) {
    FronteggContext.getInstance().context = context;
  }

  public static getContext(): IFronteggContext {
    return (
      FronteggContext.getInstance().context || {
        FRONTEGG_CLIENT_ID: '',
        FRONTEGG_API_KEY: '',
      }
    );
  }

  private static instance: FronteggContext;
  private context: IFronteggContext | null = null;

  private constructor() {}
}
