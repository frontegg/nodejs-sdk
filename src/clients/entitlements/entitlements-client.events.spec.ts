import { EntitlementsClientEvents } from './entitlements-client.events';

describe('EntitlementsClientEvents', () => {
  it("INITIALIZED equals 'initialized'", () => {
    expect(EntitlementsClientEvents.INITIALIZED).toBe('initialized');
  });

  it("SNAPSHOT_UPDATED equals 'snapshot-updated'", () => {
    expect(EntitlementsClientEvents.SNAPSHOT_UPDATED).toBe('snapshot-updated');
  });
});
