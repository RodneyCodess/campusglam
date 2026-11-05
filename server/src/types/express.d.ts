import type { ProviderProfile } from "../db/providers";
import type { User } from "../db/users";

// Adds `req.user` and `req.provider` to Express's Request type so editors
// autocomplete them. They are only set on routes that use the requireUser
// and requireProvider middleware.
declare global {
  namespace Express {
    interface Request {
      user?: User;
      provider?: ProviderProfile;
    }
  }
}

export {};
