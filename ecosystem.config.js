module.exports = {
    apps : [{
      name: "openaccessartbotjr",
      script: "./bot.js",
      instances: "1",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }]
  }