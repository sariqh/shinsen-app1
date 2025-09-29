{
  "functions": {
    "source": "packages/functions",
    "runtime": "nodejs20"
  },
  "emulators": {
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true
    }
  },
  "hosting": {
    "public": "packages/web/out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/v1/**",
        "function": "api"
      }
    ]
  }
}