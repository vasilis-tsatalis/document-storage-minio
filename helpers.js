const docFilter = function(req, file, cb) {
    // Accept word documents only
    if (!file.originalname.match(/\.(docx|DOCX)$/)) {
        req.fileValidationError = 'Only docx files are allowed!';
        return cb(new Error('Only docx files are allowed!'), false);
    }
    cb(null, true);
};

exports.docFilter = docFilter;
