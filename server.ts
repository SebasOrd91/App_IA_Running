import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface AnalyzeRequestBody {
  fecha?: string;
  tipo?: string;
  distancia_km?: number;
  duracion_min?: number;
  ritmo?: string;
  notas?: string;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_GEMINI_API_KEY");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      const body = req.body as AnalyzeRequestBody;
      const tipo = typeof body.tipo === "string" ? body.tipo.trim() : "Correr";
      const fecha = typeof body.fecha === "string" ? body.fecha.trim() : "";
      const distancia = Number(body.distancia_km);
      const duracion = Number(body.duracion_min);
      const ritmo = typeof body.ritmo === "string" ? body.ritmo.trim() : "";
      const notas = typeof body.notas === "string" ? body.notas.trim() : "";

      if (!Number.isFinite(distancia) || distancia <= 0 || !Number.isFinite(duracion) || duracion <= 0) {
        res.status(400).json({
          error: "Ingresa una distancia y duración válidas mayores a 0 para analizar la sesión.",
        });
        return;
      }

      const ai = getGeminiClient();
      const prompt = [
        `Analiza esta sesión de entrenamiento:`,
        `- Tipo: ${tipo}`,
        fecha ? `- Fecha: ${fecha}` : null,
        `- Distancia: ${distancia.toFixed(2)} km`,
        `- Duración: ${duracion} min`,
        ritmo ? `- Ritmo calculado: ${ritmo} min/km` : null,
        notas ? `- Notas del atleta: "${notas}"` : `- Notas del atleta: Sin notas adicionales.`,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "Eres un entrenador experto de running, trail y acondicionamiento físico. Responde siempre en español natural, directo y motivador, en un máximo de 3 frases breves (sin listas con viñetas ni encabezados markdown). Evalúa el esfuerzo real según el tipo de actividad y el ritmo min/km, y entrega un consejo práctico concreto para la recuperación o la siguiente sesión.",
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const feedback = response.text?.trim();
      if (!feedback) {
        res.status(502).json({
          error: "El análisis no devolvió contenido. Intenta nuevamente.",
        });
        return;
      }

      res.json({ feedback });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "MISSING_GEMINI_API_KEY") {
        res.status(500).json({
          error: "Falta configurar GEMINI_API_KEY en Settings > Secrets para usar el análisis con IA.",
        });
        return;
      }
      console.error("Error in /api/analyze:", message);
      res.status(500).json({
        error: "No se pudo completar el análisis con Gemini en este momento. Intenta de nuevo.",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RunTracker Sheets server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
