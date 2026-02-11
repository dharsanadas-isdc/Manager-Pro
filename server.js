
const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(express.json());

// Initialize Database if not exists
if (!fs.existsSync(DB_PATH)) {
  const initialData = {
    projects: [
      { id: 'p1', name: 'Alpha Redesign' },
      { id: 'p2', name: 'Stripe Integration' },
      { id: 'p3', name: 'Mobile App V2' }
    ],
    users: [
      { id: 'u1', name: 'Alex Rivera', email: 'alex@taskfirst.com', avatar: 'https://picsum.photos/seed/u1/40', team: 'Design' },
      { id: 'u2', name: 'Jordan Smith', email: 'jordan@taskfirst.com', avatar: 'https://picsum.photos/seed/u2/40', team: 'Coding' },
      { id: 'u3', name: 'Casey Jones', email: 'casey@taskfirst.com', avatar: 'https://picsum.photos/seed/u3/40', team: 'Testing' },
      { id: 'u4', name: 'Sam Taylor', email: 'sam@taskfirst.com', avatar: 'https://picsum.photos/seed/u4/40', team: 'Content' },
    ],
    departments: ['Design', 'Coding', 'Testing', 'Content', 'Digital Marketing', 'Leadership', 'Delivery'],
    taskTypes: ['UI Design', 'Backend Dev', 'Frontend Dev', 'UX Research', 'Unit Testing', 'QA Review', 'Copywriting', 'SEO Optimization', 'Stakeholder Review', 'Deployment'],
    tasks: []
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
}

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// API Routes
app.get('/api/data', (req, res) => {
  res.json(readDB());
});

app.post('/api/sync', (req, res) => {
  writeDB(req.body);
  res.json({ success: true });
});

// Gemini AI Proxy
app.post('/api/ai/report', async (req, res) => {
  try {
    const { data, timeframe, role } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = role === 'manager' 
      ? 'You are a senior project manager. Analyze this performance data for bottlenecks and efficiency.'
      : 'You are an encouraging team lead. Provide a 2-sentence motivational summary based on this data.';
    
    const prompt = `${context}\n\nData: ${JSON.stringify(data)}\nTimeframe: ${timeframe}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    res.json({ text: response.text });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ text: "Analysis currently unavailable." });
  }
});

// Serve static frontend files (assuming build output is here or using dev server)
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
