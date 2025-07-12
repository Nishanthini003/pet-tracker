import got from 'got';

// Imagga OCR API Credentials
const imaggaApiKey = 'acc_33069d6e7b6aaab';
const imaggaApiSecret = '83780fba6428b8137a1031e01cf84253';

// OpenRouter API Key (Replace with your actual key)
const openRouterApiKey = "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";

// Function to extract text from image using Imagga
const extractTextFromImage = async (imageUrl) => {
    try {
        const url = `https://api.imagga.com/v2/text?image_url=${encodeURIComponent(imageUrl)}`;
        const response = await got(url, {
            username: imaggaApiKey,
            password: imaggaApiSecret,
            responseType: 'json'
        });

        console.log("Imagga API Response:", response.body);

        if (!response.body.result || !response.body.result.text) {
            throw new Error("No text detected in the image.");
        }

        return response.body.result.text;
    } catch (error) {
        console.error("OCR Error:", error.message);
        throw new Error('OCR Error: ' + (error.response ? JSON.stringify(error.response.body) : error.message));
    }
};


// Express Controller for OCR and AI Processing
export const processImageText = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ error: "Image URL is required" });
        }

        // Step 1: Extract Text from Image
        const extractedText = await extractTextFromImage(imageUrl);
        if (!extractedText) {
            return res.status(400).json({ error: "No text found in the image" });
        }

        // Step 2: Process Text with DeepSeek R1

        res.status(200).json({
            message: "Processed image text successfully",
            extractedText
        });

    } catch (error) {
        console.error("Error Processing Image:", error.message);
        res.status(500).json({ error: error.message });
    }
};
