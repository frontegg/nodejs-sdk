import * as path from 'path';

export class PackageUtils {
  public static loadPackage(name: string): unknown {
    const packagePath = path.resolve(process.cwd() + '/node_modules/' + name);

    try {
      return require(packagePath);
    } catch (e) {
      throw new Error(`${name} is not installed. Please run "npm i ${name} --save`);
    }
  }
}
