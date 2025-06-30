export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "https://hungryblogs.com/api",
  sessionTimeout: Number.parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || "120"),
  rememberMeDays: Number.parseInt(process.env.NEXT_PUBLIC_REMEMBER_ME_DAYS || "14"),
  enableSessionTimeout: process.env.NEXT_PUBLIC_ENABLE_SESSION_TIMEOUT !== "false",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Freight Calculator",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  enableLogs: process.env.NODE_ENV === "development",
} as const

export const validateConfig = () => {
  const errors: string[] = []

  if (!process.env.NEXT_PUBLIC_API_URL) {
    errors.push("NEXT_PUBLIC_API_URL is required")
  }

  if (errors.length > 0 && typeof window === "undefined") {
    console.error("❌ Environment Configuration Errors:")
    errors.forEach((error) => console.error(`  - ${error}`))
    console.error("\n📝 Please create a .env.local file with the required variables.")
    console.error("📖 See README.md for setup instructions.")
  }

  return errors.length === 0
}

export const logConfig = () => {
  if (config.enableLogs && typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("🔧 App Configuration:", {
      apiUrl: config.apiUrl,
      sessionTimeout: `${config.sessionTimeout} minutes`,
      rememberMeDays: `${config.rememberMeDays} days`,
      enableSessionTimeout: config.enableSessionTimeout,
      appName: config.appName,
      appVersion: config.appVersion,
    })
  }
}
