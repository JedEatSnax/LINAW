// Minimal stub for R2 storage so backend can load during local development/tests.
// Real implementation (Cloudflare R2) is out-of-scope for Phase 3.

class R2StorageDao {
  async upload({ key, buffer, contentType, metadata }) {
    // noop: return a basic object key to satisfy callers
    return { objectKey: key };
  }

  async delete(objectKey) {
    // noop: pretend deletion succeeded
    return true;
  }
}

// When running under Jest, expose mockable functions so tests can spy/mock reliably.
if (typeof jest !== 'undefined') {
  module.exports = {
    upload: jest.fn(async ({ key, buffer, contentType, metadata }) => ({ objectKey: key })),
    delete: jest.fn(async (objectKey) => true),
  };
} else {
  module.exports = new R2StorageDao();
}
