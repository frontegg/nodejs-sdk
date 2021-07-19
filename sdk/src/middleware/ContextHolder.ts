interface IContextOptions {
  FRONTEGG_CLIENT_ID: string;
  FRONTEGG_API_KEY: string;
}

export class ContextHolder {
  public static getInstance(): ContextHolder {
    if (!ContextHolder.instance) {
      ContextHolder.instance = new ContextHolder();
    }

    return ContextHolder.instance;
  }

  public static setContext(context: IContextOptions) {
    ContextHolder.getInstance().context = context;
  }

  public static getContext(): IContextOptions {
    return ContextHolder.getInstance().context || {
      FRONTEGG_CLIENT_ID: '',
      FRONTEGG_API_KEY: '',
    };
  }

  private static instance: ContextHolder;
  private context: IContextOptions | null = null;

  private constructor() {}

}
