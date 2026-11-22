export type WorkoutType = "Correr" | "Caminata" | "Trail";

export type WorkoutFilter = "Todos" | WorkoutType;

export interface WorkoutPayload {
  fecha: string;
  tipo: WorkoutType;
  distancia_km: number;
  duracion_min: number;
  notas: string;
}

export interface WorkoutEntry extends WorkoutPayload {
  id: string;
  ritmo: string;
  createdAt: string;
  syncStatus: "sheets" | "demo";
  aiFeedback?: string;
}

export type MobileTab = "registrar" | "historial" | "conexion";
