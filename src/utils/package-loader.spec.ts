import * as path from 'path';
import { PackageUtils } from './package-loader';

describe('PackageUtils', () => {
  describe('loadPackage', () => {
    it('should attempt require from cwd/node_modules/', () => {
      const spy = jest.spyOn(path, 'resolve');
      try {
        PackageUtils.loadPackage('some-package');
      } catch {
        // expected
      }
      expect(spy).toHaveBeenCalledWith(process.cwd() + '/node_modules/some-package');
      spy.mockRestore();
    });

    it('should return the module when package exists', () => {
      const result = PackageUtils.loadPackage('axios-mock-adapter');
      expect(result).toBeDefined();
      expect(typeof result).toBe('function');
    });

    it('should throw Error with helpful message when package not found', () => {
      try {
        PackageUtils.loadPackage('non-existent-package-xyz');
        fail('should throw');
      } catch (e: any) {
        expect(e.message).toContain('non-existent-package-xyz is not installed');
        expect(e.message).toContain('npm i non-existent-package-xyz --save');
      }
    });
  });
});
