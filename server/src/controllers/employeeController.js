import { z } from "zod";
import { useFileDatabase } from "../config/database.js";
import Employee from "../models/Employee.js";
import { recordAuditEvent } from "../services/auditService.js";
import * as fileStore from "../services/fileStore.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function emptyStringToBlank(value) {
  return typeof value === "string" && value.trim() === "" ? "" : value;
}

function normalizeSkills(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
}

const employeeBodySchema = z.object({
  name: z.string().trim().min(2, "Cleaner name must be at least 2 characters.").max(100),
  email: z.preprocess(
    emptyStringToBlank,
    z.string().trim().email("Please provide a valid cleaner email, or leave it blank.").toLowerCase().optional().or(z.literal(""))
  ),
  phone: z.preprocess(emptyStringToBlank, z.string().trim().max(40).optional().or(z.literal(""))),
  role: z.preprocess(emptyStringToBlank, z.string().trim().max(80).optional().or(z.literal(""))),
  status: z.enum(["active", "inactive"]).default("active"),
  skills: z.preprocess(normalizeSkills, z.array(z.string().trim().min(1).max(80)).default([])),
  availabilityNotes: z.preprocess(emptyStringToBlank, z.string().trim().max(1200).optional().or(z.literal("")))
});

export const createEmployeeSchema = z.object({
  body: employeeBodySchema
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: employeeBodySchema
});

export const employeeIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const listEmployees = asyncHandler(async (req, res) => {
  if (useFileDatabase()) {
    const employees = await fileStore.listEmployees();
    return res.json({ employees });
  }

  const employees = await Employee.find().sort({ status: 1, name: 1 }).populate("createdBy", "name email");
  return res.json({ employees });
});

export const createEmployee = asyncHandler(async (req, res) => {
  const payload = {
    ...req.validated.body,
    role: req.validated.body.role || "Cleaner",
    createdBy: req.user?._id
  };
  const employee = useFileDatabase() ? await fileStore.createEmployee(payload) : await Employee.create(payload);

  await recordAuditEvent(req, {
    action: "employee.created",
    resource: "employee",
    resourceId: employee._id,
    summary: `Cleaner profile created for ${employee.name}.`,
    metadata: { employee }
  });

  return res.status(201).json({ employee });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const before = useFileDatabase() ? await fileStore.findEmployeeById(id) : await Employee.findById(id).lean();

  if (!before) {
    return res.status(404).json({ message: "Cleaner not found." });
  }

  const employee = useFileDatabase()
    ? await fileStore.updateEmployee(id, {
        ...req.validated.body,
        role: req.validated.body.role || "Cleaner"
      })
    : await Employee.findByIdAndUpdate(
        id,
        {
          ...req.validated.body,
          role: req.validated.body.role || "Cleaner"
        },
        { new: true, runValidators: true }
      );

  await recordAuditEvent(req, {
    action: "employee.updated",
    resource: "employee",
    resourceId: employee._id,
    summary: `Cleaner profile updated for ${employee.name}.`,
    metadata: { before, after: employee }
  });

  return res.json({ employee });
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const employee = useFileDatabase() ? await fileStore.deleteEmployee(id) : await Employee.findByIdAndDelete(id);

  if (!employee) {
    return res.status(404).json({ message: "Cleaner not found." });
  }

  await recordAuditEvent(req, {
    action: "employee.deleted",
    resource: "employee",
    resourceId: employee._id,
    summary: `Cleaner profile deleted for ${employee.name}.`,
    metadata: { employee }
  });

  return res.json({ employee });
});
