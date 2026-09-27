declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_PIN?: string;
    SESSION_SECRET?: string;
  }
}
