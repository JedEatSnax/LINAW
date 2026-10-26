// shared/types/hono.ts

import type { AppEnv } from "../../config/env.js";
import type { AccessTokenPayload } from "../../modules/authentication/authJWT.js";

export type AppContext = {
  Bindings: AppEnv;
  Variables: {
    user: AccessTokenPayload;
  };
};
