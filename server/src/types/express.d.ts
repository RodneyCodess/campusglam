import type { User } from "../db/users";

// Adds `req.user` to Express's Request type so editors autocomplete it.
// It is only set on routes that use the requireUser middleware.
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
