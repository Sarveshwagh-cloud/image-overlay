const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve the HTML file from the public directory
app.use(express.static('public'));

// Route for handling the image upload
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        // Define template and output paths
        const templatePath = path.join(__dirname, 'public', 'template.png');
        const outputImagePath = path.join(__dirname, 'uploads', `${Date.now()}-output.png`);

        // Resize and crop the uploaded image to fit the template
        const squareImageBuffer = await sharp(req.file.path)
            .resize({ width: 321, height: 390, fit: sharp.fit.cover })
            .toBuffer();

        // Load and process the template image
        const templateImage = sharp(templatePath);

        // Composite the user image onto the template
        await templateImage
            .composite([{ input: squareImageBuffer, top: 285, left: 591 }])
            .toFile(outputImagePath);

        // Send the resulting image to the client
        res.sendFile(outputImagePath, async (err) => {
            if (err) {
                console.error('Error sending the file:', err);
            }

            // Clean up files after sending response
            try {
                await fs.unlink(req.file.path);  // Delete uploaded user image
                setTimeout(async () => {
                    await fs.unlink(outputImagePath);  // Delete the generated image with a delay
                }, 500);
            } catch (cleanupError) {
                console.error('Error cleaning up files:', cleanupError);
            }
        });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('Error processing image.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
