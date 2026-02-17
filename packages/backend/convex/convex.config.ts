import betterAuth from "@convex-dev/better-auth/convex.config"
import migrations from "@convex-dev/migrations/convex.config"
import r2 from "@convex-dev/r2/convex.config"
import resend from "@convex-dev/resend/convex.config"
import { defineApp } from "convex/server"

const app = defineApp()
app.use(betterAuth)
app.use(resend)
app.use(migrations)
app.use(r2)

export default app
