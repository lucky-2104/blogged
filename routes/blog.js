const { Router } = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Blog = require('../models/blog');
const Comment = require('../models/comment');

const router = Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.resolve(`./public/uploads/${req.user._id}`);
        
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage });




// Route to render the blog creation form
router.get('/add-new', (req, res) => {
    return res.render('addBlog', {
        user: req.user,
    });
});


router.get('/:id', async (req, res) => {
    const blog = await Blog.findById(req.params.id).populate('createdBy');
    const comments = await Comment.find({ blogId: req.params.id }).populate('createdBy');
    return res.render('blog', {
        user: req.user,
        blog,
        comments,
    })
    
});


// Route to handle blog submission
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, body } = req.body;

        // Validation: Ensure required fields are provided
        if (!title || !body) {
            return res.status(400).send("Title and Body are required.");
        }

        if (!req.file) {
            return res.status(400).send("Image upload is required.");
        }

        // Save blog post to the database
        const blog = await Blog.create({
            title,
            body,
            createdBy: req.user._id,
            coverImageURL: `/uploads/${req.user._id}/${req.file.filename}` // ✅ Corrected path
        });

        return res.redirect(`/blog/${blog._id}`);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
});

router.post('/comment/:blogId', async (req, res) => {
    
    const comment = await Comment.create({
        content: req.body.content,
        blogId: req.params.blogId,
        createdBy: req.user._id,
    });

    return res.redirect(`/blog/${req.params.blogId}`);
    
});

module.exports = router;
