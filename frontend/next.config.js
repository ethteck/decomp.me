const { execSync } = require("child_process")

const { config } = require("dotenv")

for (const envFile of [".env.local", ".env"]) {
    config({ path: `../${envFile}` })
}

const getEnvBool = (key, fallback=false) => {
    const value = process.env[key]
    if (value === "false" || value === "0" || value === "off") {
        return false
    }
    if (value === "true" || value === "1" || value === "on") {
        return true
    }
    return fallback
}

process.env.NEXT_PUBLIC_API_BASE = process.env.API_BASE
process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
let git_hash
try {
    git_hash = execSync("git rev-parse HEAD").toString().trim()
} catch (error) {
    console.log("Unable to get git hash, assume running inside Docker")
    git_hash = "abc123"
}
process.env.NEXT_PUBLIC_COMMIT_HASH = git_hash

const { withPlausibleProxy } = require("next-plausible")

const withPWA = require("next-pwa")({
    dest: "public",
    disable: !getEnvBool("FRONTEND_PWA"),
})
const removeImports = require("next-remove-imports")({
    //test: /node_modules([\s\S]*?)\.(tsx|ts|js|mjs|jsx)$/,
    //matchImports: "\\.(less|css|scss|sass|styl)$"
})
const { WebWorkerPlugin } = require("@shopify/web-worker/webpack")

const mediaUrl = new URL(process.env.MEDIA_URL ?? "http://localhost")

let app = withPlausibleProxy({
    customDomain: "https://stats.decomp.me",
})(removeImports(withPWA({
    async redirects() {
        return [
            {
                source: "/scratch",
                destination: "/",
                permanent: true,
            },
            {
                source: "/scratch/new",
                destination: "/new",
                permanent: true,
            },
            {
                source: "/settings",
                destination: "/settings/account",
                permanent: false,
            },
        ]
    },
    async rewrites() {
        return []
    },
    async headers() {
        return [
            {
                source: "/(.*)", // all routes
                headers: [
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "on",
                    },

                ],
            },
        ]
    },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ["@svgr/webpack"],
        })

        config.plugins.push(new WebWorkerPlugin())
        config.output.globalObject = "self"

        return config
    },
    images: {
        domains: [mediaUrl.hostname, "avatars.githubusercontent.com"],
        unoptimized: !getEnvBool("FRONTEND_USE_IMAGE_PROXY"),
    },
    swcMinify: true,
    experimental: {
        appDir: true,
    },
})))

if (process.env.ANALYZE == "true") {
    app = require("@next/bundle-analyzer")(app)
}

module.exports = app
