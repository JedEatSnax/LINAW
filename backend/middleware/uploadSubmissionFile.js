const multer = require('multer');
const AppError = require('../utils/AppError');

const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new AppError('Only PDF and DOCX files are allowed', 400, 'INVALID_FILE_TYPE'));
        }

        cb(null, true);
    }
});

module.exports = upload;