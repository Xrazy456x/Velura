import { Router } from "express";
import {
  bookingIdSchema,
  createBooking,
  createBookingSchema,
  deleteBooking,
  listDeletedBookings,
  listBookings,
  markBookingPhoneConfirmed,
  markPhoneConfirmationSchema,
  restoreBooking,
  sendBookingCleanerBriefEmail,
  sendBookingEmailConfirmation,
  updateBooking,
  updateBookingOwnership,
  updateBookingOwnershipSchema,
  updateBookingSchema,
  updateBookingStatus,
  updateBookingStatusSchema
} from "../controllers/bookingController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/", listBookings);
router.get("/deleted", listDeletedBookings);
router.post("/", validate(createBookingSchema), createBooking);
router.patch("/:id", validate(updateBookingSchema), updateBooking);
router.delete("/:id", validate(bookingIdSchema), deleteBooking);
router.post("/:id/restore", validate(bookingIdSchema), restoreBooking);
router.post("/:id/email-confirmation", validate(bookingIdSchema), sendBookingEmailConfirmation);
router.post("/:id/cleaner-brief", validate(bookingIdSchema), sendBookingCleanerBriefEmail);
router.post("/:id/phone-confirmation", validate(markPhoneConfirmationSchema), markBookingPhoneConfirmed);
router.patch("/:id/status", validate(updateBookingStatusSchema), updateBookingStatus);
router.patch("/:id/ownership", validate(updateBookingOwnershipSchema), updateBookingOwnership);

export default router;
