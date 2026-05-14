const { CreateBucketCommand } = require('@aws-sdk/client-s3')
const AppError = require('../utils/AppError');
const { r2Client } = require('../config/r2Client')

class cloudflareR2Dao {
    async createBucket(){
        if(!bucketName) {
            throw new AppError ('Bucket name is require', 400, 'MISSING_BUCKET_NAME')
        }

        try {
            const command = new CreateBucketCommand({
                Bucket: bucketName
            })

            const response = await r2Client.send(command)
            return response;

        } catch (error) {
            throw new AppError(
                error.message || 'Failed to create Cloudflare R2 Bucket ',
                500,
                'R2_BUCKET_CREATE_FAILED'
            )
        }
    }
}

module.exports = new cloudflareR2Dao();
