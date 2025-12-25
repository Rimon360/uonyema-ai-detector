const express = require("express");
const multer = require("multer");
const { execFile } = require("child_process");
const app = express();
const upload = multer({ dest: "uploads/" });
const cors = require("cors")
app.use(cors('*'))
app.post("/detect", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image provided." });

  const imagePath = req.file.path;
console.log(imagePath);

  execFile("python3", ["model.py", imagePath], (err, stdout) => {
    console.log(err);
    
    if (err) return res.status(500).json({ error: "AI detection failed." });

    try {
      const out = JSON.parse(stdout);
      res.json({
        ai_generated_score: out.ai_probability,
        real_score: out.real_probability,
        ai_likely: out.ai_probability > out.real_probability
      });
    } catch {
      res.status(500).json({ error: "Invalid model output." });
    }
  });
});

app.listen(3000, () => console.log("server running 3000"));
