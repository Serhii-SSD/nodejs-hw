
import 'dotenv/config';
import express from "express";
import cors from 'cors';
import pinoHttp from 'pino-http';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(pinoHttp({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
}));

app.use(cors());
app.use(express.json());


app.get("/notes", (req, res) => {
  res.status(200).json({
    message: "Retrieved all notes"
  });
});

app.get("/notes/:noteId", (req, res) => {
  const id_param = req.params.noteId;
  res.status(200).json({
    message: `Retrieved note with ID: ${id_param}`
  });
});

app.get('/test-error', () => {
  throw new Error('Simulated server error');
});

app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found"
  });
});
app.use((err, req, res, next) => {
  res.status(500).json({
    message: err.message || "Internal Server Error"
  });
});

app.listen(PORT, () => {
  console.log("Server running on port ${PORT}")
});
