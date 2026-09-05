interface ViteTypeOptions {}

interface ImportMetaEnv {
  readonly VITE_BETTER_AUTH_URL: string
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
