import { Router } from "express";
import {
  acceptAppointment,
  cancelAppointment,
  completeAppointment,
  createAppointment,
  declineAppointment,
  listIncomingAppointments,
  listMyAppointments,
} from "../controllers/appointments";
import { requireProvider } from "../middleware/requireProvider";
import { requireUser } from "../middleware/requireUser";

export const appointmentsRouter = Router();

// Clients
appointmentsRouter.post("/api/appointments", requireUser, createAppointment);
appointmentsRouter.get(
  "/api/appointments/mine",
  requireUser,
  listMyAppointments,
);

// Providers
appointmentsRouter.get(
  "/api/appointments/incoming",
  requireUser,
  requireProvider,
  listIncomingAppointments,
);
appointmentsRouter.post(
  "/api/appointments/:id/accept",
  requireUser,
  requireProvider,
  acceptAppointment,
);
appointmentsRouter.post(
  "/api/appointments/:id/decline",
  requireUser,
  requireProvider,
  declineAppointment,
);
appointmentsRouter.post(
  "/api/appointments/:id/complete",
  requireUser,
  requireProvider,
  completeAppointment,
);

// Either side of the appointment
appointmentsRouter.post(
  "/api/appointments/:id/cancel",
  requireUser,
  cancelAppointment,
);
