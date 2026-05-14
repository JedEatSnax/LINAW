const { S3Client } = require('@aws-sdk/client-s3');

const requiredEnv = {
    'R2_ACCOUNT_ID': process.env.R2_ACCOUNT_ID,
    'R2_ACCESS_KEY_ID': process.env.R2_ACCESS_KEY_ID,
    'R2_SECRET_ACCESS_KEY': process.env.R2_SECRET_ACCESS_KEY
}

for ( const key of Object.keys(requiredEnv) ) {
    if(!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
})

module.exports = {
    r2Client,
}