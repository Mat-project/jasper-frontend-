import { Department, Section, Role, DrawingCategory } from "@/types/masters";
import { Project, ProjectAssignment } from "@/types/projects";
import { AttendanceRecord, LeaveRequest } from "@/types/attendance";
import { ProductionEntry } from "@/types/production";
import { Document, VersionHistory, RevisionRecord } from "@/types/documents";
import { AuditLog, SystemSettings } from "@/types/admin";
import { User } from "@/types/user";

// Define a unified Mock Database interface
interface MockDatabase {
  departments: Department[];
  sections: Section[];
  roles: Role[];
  drawingCategories: DrawingCategory[];
  employees: User[];
  projects: Project[];
  projectAssignments: ProjectAssignment[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  productionEntries: ProductionEntry[];
  documents: Document[];
  versionHistories: VersionHistory[];
  revisions: RevisionRecord[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const STORAGE_KEY = "eoms_mock_db";

// Helper to check if running in browser
const isBrowser = typeof window !== "undefined";

// Seed Data
const initialDB: MockDatabase = {
  departments: [
    { id: "dept-1", code: "ENG", name: "Engineering", created_at: "2026-01-10T08:00:00Z" },
    { id: "dept-2", code: "PROD", name: "Production", created_at: "2026-01-11T09:30:00Z" },
    { id: "dept-3", code: "QC", name: "Quality Control", created_at: "2026-01-12T10:00:00Z" },
    { id: "dept-4", code: "HR", name: "Human Resources", created_at: "2026-01-15T11:00:00Z" },
  ],
  sections: [
    { id: "sec-1", code: "DSN", name: "Design", created_at: "2026-01-10T08:15:00Z" },
    { id: "sec-2", code: "DET", name: "Detailing", created_at: "2026-01-10T08:30:00Z" },
    { id: "sec-3", code: "WLD", name: "Welding", created_at: "2026-01-11T09:45:00Z" },
    { id: "sec-4", code: "PNT", name: "Painting", created_at: "2026-01-11T10:00:00Z" },
    { id: "sec-5", code: "ASM", name: "Assembly", created_at: "2026-01-12T10:30:00Z" },
  ],
  roles: [
    { id: "role-1", code: "SADM", name: "Super Admin", created_at: "2026-01-01T00:00:00Z" },
    { id: "role-2", code: "ADM", name: "Admin", created_at: "2026-01-01T00:00:00Z" },
    { id: "role-3", code: "MGR", name: "Manager", created_at: "2026-01-10T08:00:00Z" },
    { id: "role-4", code: "OPR", name: "Operator", created_at: "2026-01-11T09:00:00Z" },
    { id: "role-5", code: "VWR", name: "Viewer", created_at: "2026-01-12T12:00:00Z" },
  ],
  drawingCategories: [
    { id: "dc-1", code: "STR", name: "Structural", created_at: "2026-01-10T08:00:00Z" },
    { id: "dc-2", code: "PIP", name: "Piping", created_at: "2026-01-10T08:30:00Z" },
    { id: "dc-3", code: "MCH", name: "Mechanical", created_at: "2026-01-11T09:00:00Z" },
    { id: "dc-4", code: "ELC", name: "Electrical", created_at: "2026-01-11T10:00:00Z" },
    { id: "dc-5", code: "CVL", name: "Civil", created_at: "2026-01-12T11:00:00Z" },
  ],
  employees: [
    {
      id: "emp-1",
      email: "admin@eoms.local",
      first_name: "System",
      last_name: "Admin",
      full_name: "System Admin",
      phone_number: "9876543210",
      avatar: null,
      is_active: true,
      date_joined: "2026-01-01T00:00:00Z",
      last_login: "2026-06-28T02:00:00Z",
      roles: [{ id: "role-2", name: "Admin" }],
      employee_code: "EMP-001",
      department: "Engineering",
      section: "Design"
    } as any,
    {
      id: "emp-2",
      email: "john.doe@eoms.local",
      first_name: "John",
      last_name: "Doe",
      full_name: "John Doe",
      phone_number: "1234567890",
      avatar: null,
      is_active: true,
      date_joined: "2026-01-10T08:00:00Z",
      last_login: "2026-06-27T10:30:00Z",
      roles: [{ id: "role-3", name: "Manager" }],
      employee_code: "EMP-002",
      department: "Engineering",
      section: "Detailing"
    } as any,
    {
      id: "emp-3",
      email: "alice.smith@eoms.local",
      first_name: "Alice",
      last_name: "Smith",
      full_name: "Alice Smith",
      phone_number: "5551234567",
      avatar: null,
      is_active: true,
      date_joined: "2026-01-12T09:00:00Z",
      last_login: null,
      roles: [{ id: "role-4", name: "Operator" }],
      employee_code: "EMP-003",
      department: "Production",
      section: "Welding"
    } as any,
    {
      id: "emp-4",
      email: "bob.johnson@eoms.local",
      first_name: "Bob",
      last_name: "Johnson",
      full_name: "Bob Johnson",
      phone_number: "5559876543",
      avatar: null,
      is_active: false,
      date_joined: "2026-02-15T09:00:00Z",
      last_login: null,
      roles: [{ id: "role-4", name: "Operator" }],
      employee_code: "EMP-004",
      department: "Quality Control",
      section: "Painting"
    } as any
  ],
  projects: [
    {
      id: "proj-1",
      code: "PRJ-101",
      name: "Project Orion",
      client: "Tesla",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      status: "Active",
      created_at: "2026-01-01T00:00:00Z"
    },
    {
      id: "proj-2",
      code: "PRJ-102",
      name: "Project Apollo",
      client: "SpaceX",
      start_date: "2026-03-15",
      end_date: "2026-09-15",
      status: "Active",
      created_at: "2026-03-15T00:00:00Z"
    },
    {
      id: "proj-3",
      code: "PRJ-103",
      name: "Project Ares",
      client: "NASA",
      start_date: "2026-06-01",
      end_date: "2027-06-01",
      status: "Planned",
      created_at: "2026-06-01T00:00:00Z"
    }
  ] as any,
  projectAssignments: [
    { id: "assign-1", project_id: "proj-1", employee_id: "emp-2", assigned_at: "2026-01-11T09:00:00Z" },
    { id: "assign-2", project_id: "proj-1", employee_id: "emp-3", assigned_at: "2026-01-12T09:00:00Z" },
    { id: "assign-3", project_id: "proj-2", employee_id: "emp-2", assigned_at: "2026-03-16T09:00:00Z" }
  ] as any,
  attendanceRecords: [
    { id: "att-1", date: "2026-06-26", employee_id: "emp-1", status: "Present", remarks: "Regular hours" },
    { id: "att-2", date: "2026-06-26", employee_id: "emp-2", status: "Present", remarks: "Regular hours" },
    { id: "att-3", date: "2026-06-26", employee_id: "emp-3", status: "On Leave", remarks: "Sick leave approved" },
    { id: "att-4", date: "2026-06-27", employee_id: "emp-1", status: "Present", remarks: "Regular hours" },
    { id: "att-5", date: "2026-06-27", employee_id: "emp-2", status: "Half Day", remarks: "Doctor appointment" }
  ] as any,
  leaveRequests: [
    {
      id: "leave-1",
      employee_id: "emp-3",
      leave_type: "Sick",
      start_date: "2026-06-26",
      end_date: "2026-06-26",
      status: "Approved",
      reason: "High fever",
      applied_at: "2026-06-25T08:00:00Z",
      approved_by: "System Admin",
      remarks: "Feel better soon"
    },
    {
      id: "leave-2",
      employee_id: "emp-2",
      leave_type: "Casual",
      start_date: "2026-07-02",
      end_date: "2026-07-05",
      status: "Pending",
      reason: "Family gathering",
      applied_at: "2026-06-27T14:30:00Z"
    }
  ],
  productionEntries: [
    {
      id: "prod-entry-1",
      date: "2026-06-26",
      employee_id: "emp-2",
      project_id: "proj-1",
      drawing_category_id: "dc-1",
      quantity: 5,
      tonnage: 12.5,
      remarks: "Structural frames completed",
      status: "Approved",
      created_at: "2026-06-26T17:00:00Z",
      approved_by: "emp-1",
      approved_at: "2026-06-26T18:00:00Z"
    },
    {
      id: "prod-entry-2",
      date: "2026-06-27",
      employee_id: "emp-3",
      project_id: "proj-1",
      drawing_category_id: "dc-2",
      quantity: 8,
      tonnage: 4.8,
      remarks: "Piping assembly finished",
      status: "Submitted",
      created_at: "2026-06-27T16:30:00Z"
    },
    {
      id: "prod-entry-3",
      date: "2026-06-27",
      employee_id: "emp-2",
      project_id: "proj-2",
      drawing_category_id: "dc-1",
      quantity: 2,
      tonnage: 6.0,
      remarks: "Column frames",
      status: "Draft",
      created_at: "2026-06-27T15:00:00Z"
    }
  ],
  documents: [
    {
      id: "doc-1",
      project_id: "proj-1",
      document_type: "PDF Drawing",
      version: "1.0",
      file_name: "orion_foundation_rev1.pdf",
      file_size: "4.2 MB",
      remarks: "Initial foundation design",
      uploaded_by: "John Doe",
      uploaded_at: "2026-05-10T11:00:00Z",
      status: "Approved",
      approved_by: "System Admin",
      approved_at: "2026-05-12T09:00:00Z"
    },
    {
      id: "doc-2",
      project_id: "proj-1",
      document_type: "DWG Blueprint",
      version: "2.1",
      file_name: "orion_piping_layout_v2.1.dwg",
      file_size: "18.5 MB",
      remarks: "Revised piping routing",
      uploaded_by: "John Doe",
      uploaded_at: "2026-06-27T13:00:00Z",
      status: "Pending"
    }
  ],
  versionHistories: [
    {
      id: "ver-1",
      document_id: "doc-2",
      version: "1.0",
      file_name: "orion_piping_layout_v1.0.dwg",
      remarks: "First layout draft",
      uploaded_by: "John Doe",
      uploaded_at: "2026-06-20T10:00:00Z"
    },
    {
      id: "ver-2",
      document_id: "doc-2",
      version: "2.0",
      file_name: "orion_piping_layout_v2.0.dwg",
      remarks: "Updated dimensions",
      uploaded_by: "John Doe",
      uploaded_at: "2026-06-25T14:00:00Z"
    }
  ],
  revisions: [
    {
      id: "rev-rec-1",
      project_id: "proj-1",
      drawing_number: "DRW-ORION-001",
      revision_type: "Internal Revision",
      description: "Optimized steel support column layout based on load checks",
      date: "2026-06-25",
      is_billable: false,
      created_at: "2026-06-25T10:00:00Z"
    },
    {
      id: "rev-rec-2",
      project_id: "proj-1",
      drawing_number: "DRW-ORION-002",
      revision_type: "Client Revision",
      description: "Modified pump nozzle location requested by Tesla engineering",
      date: "2026-06-27",
      is_billable: true,
      created_at: "2026-06-27T15:30:00Z"
    }
  ],
  auditLogs: [
    { id: "log-1", user: "admin@eoms.local", action: "User Login", module: "Authentication", date: "2026-06-28", time: "02:00:15", details: "Successful login via web interface" },
    { id: "log-2", user: "admin@eoms.local", action: "Create Employee", module: "Masters", date: "2026-06-28", time: "02:05:40", details: "Created employee user John Doe (EMP-002)" },
    { id: "log-3", user: "john.doe@eoms.local", action: "Create Production Entry", module: "Production", date: "2026-06-27", time: "16:30:12", details: "Submitted entry for Project Orion" }
  ],
  settings: {
    general: {
      siteName: "EOMS Portal",
      contactEmail: "support@eoms.local",
      rowsPerPage: 10
    },
    user: {
      allowRegistration: false,
      requireEmailVerification: true
    },
    security: {
      passwordMinLength: 8,
      sessionTimeoutMinutes: 30,
      mfaRequired: false
    }
  }
};

// Initialize DB from LocalStorage or seed data
function getDB(): MockDatabase {
  if (!isBrowser) return initialDB;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
    return initialDB;
  }
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB));
    return initialDB;
  }
}

function saveDB(db: MockDatabase) {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Global logger helper
function logAction(user: string, action: string, module: string, details: string) {
  const db = getDB();
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0];
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user,
    action,
    module,
    date: dateStr,
    time: timeStr,
    details
  };
  db.auditLogs.unshift(newLog);
  saveDB(db);
}

// ── CRUD Helpers ─────────────────────────────────────────────────────────────
export const mockService = {
  // ── Masters: Departments ──────────────────────────────────────────────────
  getDepartments: (): Department[] => getDB().departments,
  createDepartment: (code: string, name: string): Department => {
    const db = getDB();
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      created_at: new Date().toISOString()
    };
    db.departments.push(newDept);
    saveDB(db);
    logAction("admin@eoms.local", "Create Department", "Masters", `Created department: ${name} (${code})`);
    return newDept;
  },
  updateDepartment: (id: string, code: string, name: string): Department => {
    const db = getDB();
    db.departments = db.departments.map((d) =>
      d.id === id ? { ...d, code: code.toUpperCase(), name } : d
    );
    saveDB(db);
    logAction("admin@eoms.local", "Update Department", "Masters", `Updated department ID: ${id}`);
    return db.departments.find((d) => d.id === id)!;
  },
  deleteDepartment: (id: string) => {
    const db = getDB();
    db.departments = db.departments.filter((d) => d.id !== id);
    saveDB(db);
    logAction("admin@eoms.local", "Delete Department", "Masters", `Deleted department ID: ${id}`);
  },

  // ── Masters: Sections ─────────────────────────────────────────────────────
  getSections: (): Section[] => getDB().sections,
  createSection: (code: string, name: string): Section => {
    const db = getDB();
    const newSec: Section = {
      id: `sec-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      created_at: new Date().toISOString()
    };
    db.sections.push(newSec);
    saveDB(db);
    logAction("admin@eoms.local", "Create Section", "Masters", `Created section: ${name} (${code})`);
    return newSec;
  },
  updateSection: (id: string, code: string, name: string): Section => {
    const db = getDB();
    db.sections = db.sections.map((s) =>
      s.id === id ? { ...s, code: code.toUpperCase(), name } : s
    );
    saveDB(db);
    logAction("admin@eoms.local", "Update Section", "Masters", `Updated section ID: ${id}`);
    return db.sections.find((s) => s.id === id)!;
  },
  deleteSection: (id: string) => {
    const db = getDB();
    db.sections = db.sections.filter((s) => s.id !== id);
    saveDB(db);
    logAction("admin@eoms.local", "Delete Section", "Masters", `Deleted section ID: ${id}`);
  },

  // ── Masters: Roles ────────────────────────────────────────────────────────
  getRoles: (): Role[] => getDB().roles,
  createRole: (code: string, name: string): Role => {
    const db = getDB();
    const newRole: Role = {
      id: `role-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      created_at: new Date().toISOString()
    };
    db.roles.push(newRole);
    saveDB(db);
    logAction("admin@eoms.local", "Create Role", "Masters", `Created role: ${name} (${code})`);
    return newRole;
  },
  updateRole: (id: string, code: string, name: string): Role => {
    const db = getDB();
    db.roles = db.roles.map((r) =>
      r.id === id ? { ...r, code: code.toUpperCase(), name } : r
    );
    saveDB(db);
    logAction("admin@eoms.local", "Update Role", "Masters", `Updated role ID: ${id}`);
    return db.roles.find((r) => r.id === id)!;
  },
  deleteRole: (id: string) => {
    const db = getDB();
    db.roles = db.roles.filter((r) => r.id !== id);
    saveDB(db);
    logAction("admin@eoms.local", "Delete Role", "Masters", `Deleted role ID: ${id}`);
  },

  // ── Masters: Drawing Categories ───────────────────────────────────────────
  getDrawingCategories: (): DrawingCategory[] => getDB().drawingCategories,
  createDrawingCategory: (code: string, name: string): DrawingCategory => {
    const db = getDB();
    const newCat: DrawingCategory = {
      id: `dc-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      created_at: new Date().toISOString()
    };
    db.drawingCategories.push(newCat);
    saveDB(db);
    logAction("admin@eoms.local", "Create Drawing Category", "Masters", `Created drawing category: ${name} (${code})`);
    return newCat;
  },
  updateDrawingCategory: (id: string, code: string, name: string): DrawingCategory => {
    const db = getDB();
    db.drawingCategories = db.drawingCategories.map((c) =>
      c.id === id ? { ...c, code: code.toUpperCase(), name } : c
    );
    saveDB(db);
    logAction("admin@eoms.local", "Update Drawing Category", "Masters", `Updated drawing category ID: ${id}`);
    return db.drawingCategories.find((c) => c.id === id)!;
  },
  deleteDrawingCategory: (id: string) => {
    const db = getDB();
    db.drawingCategories = db.drawingCategories.filter((c) => c.id !== id);
    saveDB(db);
    logAction("admin@eoms.local", "Delete Drawing Category", "Masters", `Deleted drawing category ID: ${id}`);
  },

  // ── Masters: Employees ─────────────────────────────────────────────────────
  getEmployees: (): User[] => getDB().employees,
  getEmployeeByEmail: (email: string): User | undefined => getDB().employees.find((e) => e.email === email),
  createEmployee: (data: {
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    department: string;
    section: string;
    role: string;
  }): User => {
    const db = getDB();
    // Validate uniqueness of employee code
    const isCodeDuplicate = db.employees.some((e) => (e as any).employee_code === data.employee_code);
    if (isCodeDuplicate) {
      throw new Error(`Employee Code '${data.employee_code}' already exists.`);
    }

    const newEmp: User = {
      id: `emp-${Date.now()}`,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: `${data.first_name} ${data.last_name}`,
      phone_number: data.phone_number,
      avatar: null,
      is_active: true,
      date_joined: new Date().toISOString(),
      last_login: null,
      roles: [{ id: `role-${Date.now()}`, name: data.role }]
    };
    // Attach custom extension parameters
    (newEmp as any).employee_code = data.employee_code;
    (newEmp as any).department = data.department;
    (newEmp as any).section = data.section;

    db.employees.push(newEmp);
    saveDB(db);
    logAction("admin@eoms.local", "Create Employee", "Masters", `Created employee: ${newEmp.full_name} (${data.employee_code})`);
    return newEmp;
  },
  updateEmployee: (id: string, data: {
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    department: string;
    section: string;
    role: string;
  }): User => {
    const db = getDB();
    
    // Check if updating to a duplicate code
    const duplicateCode = db.employees.some((e) => e.id !== id && (e as any).employee_code === data.employee_code);
    if (duplicateCode) {
      throw new Error(`Employee Code '${data.employee_code}' already exists.`);
    }

    db.employees = db.employees.map((e) => {
      if (e.id === id) {
        const updated = {
          ...e,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          full_name: `${data.first_name} ${data.last_name}`,
          phone_number: data.phone_number,
          roles: [{ id: e.roles[0]?.id || "role-v", name: data.role }]
        };
        (updated as any).employee_code = data.employee_code;
        (updated as any).department = data.department;
        (updated as any).section = data.section;
        return updated;
      }
      return e;
    });

    saveDB(db);
    logAction("admin@eoms.local", "Update Employee", "Masters", `Updated employee ID: ${id}`);
    return db.employees.find((e) => e.id === id)!;
  },
  toggleEmployeeStatus: (id: string): User => {
    const db = getDB();
    db.employees = db.employees.map((e) =>
      e.id === id ? { ...e, is_active: !e.is_active } : e
    );
    saveDB(db);
    const updated = db.employees.find((e) => e.id === id)!;
    logAction("admin@eoms.local", "Toggle Employee Status", "Masters", `Toggled status of: ${updated.full_name} to ${updated.is_active ? "Active" : "Inactive"}`);
    return updated;
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  getProjects: (): Project[] => getDB().projects,
  createProject: (data: Omit<Project, "id" | "created_at">): Project => {
    const db = getDB();
    const newProj: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    db.projects.push(newProj);
    saveDB(db);
    logAction("admin@eoms.local", "Create Project", "Projects", `Created project: ${data.name} (${data.code})`);
    return newProj;
  },
  updateProject: (id: string, data: Omit<Project, "id" | "created_at">): Project => {
    const db = getDB();
    db.projects = db.projects.map((p) =>
      p.id === id ? { ...p, ...data } : p
    );
    saveDB(db);
    logAction("admin@eoms.local", "Update Project", "Projects", `Updated project ID: ${id}`);
    return db.projects.find((p) => p.id === id)!;
  },
  getProjectAssignments: (): ProjectAssignment[] => getDB().projectAssignments,
  assignEmployeeToProject: (projectId: string, employeeId: string): ProjectAssignment => {
    const db = getDB();
    const exists = db.projectAssignments.find((a) => a.project_id === projectId && a.employee_id === employeeId);
    if (exists) return exists;

    const newAssign: ProjectAssignment = {
      id: `assign-${Date.now()}`,
      project_id: projectId,
      employee_id: employeeId,
      assigned_date: new Date().toISOString()
    };
    db.projectAssignments.push(newAssign);
    saveDB(db);
    logAction("admin@eoms.local", "Assign Project", "Projects", `Assigned employee ${employeeId} to project ${projectId}`);
    return newAssign;
  },
  unassignEmployeeFromProject: (assignmentId: string) => {
    const db = getDB();
    db.projectAssignments = db.projectAssignments.filter((a) => a.id !== assignmentId);
    saveDB(db);
    logAction("admin@eoms.local", "Unassign Project", "Projects", `Removed project assignment ID: ${assignmentId}`);
  },

  // ── Attendance ────────────────────────────────────────────────────────────
  getAttendance: (): AttendanceRecord[] => getDB().attendanceRecords,
  saveDailyAttendance: (date: string, records: { employee_id: string; status: AttendanceRecord["status"]; remarks: string }[]) => {
    const db = getDB();
    // Filter out existing records for this date
    db.attendanceRecords = db.attendanceRecords.filter((r) => r.date !== date);
    
    records.forEach((rec) => {
      db.attendanceRecords.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date,
        employee_id: rec.employee_id,
        status: rec.status,
        remarks: rec.remarks
      });
    });

    saveDB(db);
    logAction("admin@eoms.local", "Save Attendance", "Attendance", `Saved attendance for ${date} (${records.length} records)`);
  },
  getLeaveRequests: (): LeaveRequest[] => getDB().leaveRequests,
  createLeaveRequest: (data: Omit<LeaveRequest, "id" | "status" | "applied_at">): LeaveRequest => {
    const db = getDB();
    const newReq: LeaveRequest = {
      ...data,
      id: `leave-${Date.now()}`,
      status: "Pending",
      applied_at: new Date().toISOString()
    };
    db.leaveRequests.unshift(newReq);
    saveDB(db);
    logAction("admin@eoms.local", "Create Leave Request", "Attendance", `Applied for leave from ${data.start_date} to ${data.end_date}`);
    return newReq;
  },
  updateLeaveStatus: (id: string, status: LeaveRequest["status"], remarks?: string, approvedBy?: string): LeaveRequest => {
    const db = getDB();
    db.leaveRequests = db.leaveRequests.map((l) =>
      l.id === id
        ? {
            ...l,
            status,
            remarks: remarks || l.remarks,
            approved_by: approvedBy || "System Admin"
          }
        : l
    );
    saveDB(db);
    logAction("admin@eoms.local", "Update Leave Status", "Attendance", `Updated leave request ID ${id} to ${status}`);
    return db.leaveRequests.find((l) => l.id === id)!;
  },

  // ── Production ────────────────────────────────────────────────────────────
  getProductionEntries: (): ProductionEntry[] => getDB().productionEntries,
  createProductionEntry: (data: Omit<ProductionEntry, "id" | "status" | "created_at">, submit = false): ProductionEntry => {
    const db = getDB();
    
    // Prevent duplicate entries (on same date, employee, project, and category)
    const isDuplicate = db.productionEntries.some(
      (e) =>
        e.date === data.date &&
        e.employee_id === data.employee_id &&
        e.project_id === data.project_id &&
        e.drawing_category_id === data.drawing_category_id
    );

    if (isDuplicate) {
      throw new Error("A production entry already exists for this date, employee, project, and drawing category.");
    }

    const newEntry: ProductionEntry = {
      ...data,
      id: `prod-entry-${Date.now()}`,
      status: submit ? "Submitted" : "Draft",
      created_at: new Date().toISOString()
    };

    db.productionEntries.unshift(newEntry);
    saveDB(db);
    logAction("admin@eoms.local", "Create Production Entry", "Production", `${submit ? "Submitted" : "Created draft"} production entry`);
    return newEntry;
  },
  updateProductionStatus: (id: string, status: ProductionEntry["status"], reason?: string, approvedBy?: string): ProductionEntry => {
    const db = getDB();
    db.productionEntries = db.productionEntries.map((e) =>
      e.id === id
        ? {
            ...e,
            status,
            rejection_reason: reason,
            approved_by: approvedBy || "System Admin",
            approved_at: new Date().toISOString()
          }
        : e
    );
    saveDB(db);
    logAction("admin@eoms.local", "Update Production Status", "Production", `Updated entry ID ${id} to ${status}`);
    return db.productionEntries.find((e) => e.id === id)!;
  },

  // ── Documents & Revisions ─────────────────────────────────────────────────
  getDocuments: (): Document[] => getDB().documents,
  getVersionHistories: (): VersionHistory[] => getDB().versionHistories,
  uploadDocument: (data: {
    project_id: string;
    document_type: string;
    version: string;
    file_name: string;
    remarks: string;
    uploaded_by: string;
  }): Document => {
    const db = getDB();
    
    // Check if the document already exists for this project and file_name
    let doc = db.documents.find((d) => d.project_id === data.project_id && d.file_name === data.file_name);
    
    if (doc) {
      // Create version history entry for the OLD version
      const oldVer: VersionHistory = {
        id: `ver-${Date.now()}`,
        document_id: doc.id,
        version: doc.version,
        file_name: doc.file_name,
        remarks: doc.remarks,
        uploaded_by: doc.uploaded_by,
        uploaded_at: doc.uploaded_at
      };
      db.versionHistories.push(oldVer);

      // Update the document to the new version
      doc.version = data.version;
      doc.remarks = data.remarks;
      doc.uploaded_by = data.uploaded_by;
      doc.uploaded_at = new Date().toISOString();
      doc.status = "Pending";
    } else {
      // Create new document
      doc = {
        id: `doc-${Date.now()}`,
        project_id: data.project_id,
        document_type: data.document_type,
        version: data.version,
        file_name: data.file_name,
        file_size: `${(Math.random() * 10 + 1).toFixed(1)} MB`,
        remarks: data.remarks,
        uploaded_by: data.uploaded_by,
        uploaded_at: new Date().toISOString(),
        status: "Pending"
      };
      db.documents.push(doc);
    }
    
    saveDB(db);
    logAction("admin@eoms.local", "Upload Document", "Documents", `Uploaded document: ${data.file_name} (v${data.version})`);
    return doc;
  },
  updateDocumentStatus: (id: string, status: Document["status"], remarks?: string, approvedBy?: string): Document => {
    const db = getDB();
    db.documents = db.documents.map((d) =>
      d.id === id
        ? {
            ...d,
            status,
            remarks_approver: remarks,
            approved_by: approvedBy || "System Admin",
            approved_at: new Date().toISOString()
          }
        : d
    );
    saveDB(db);
    logAction("admin@eoms.local", "Update Document Status", "Documents", `Approved/Rejected document ID ${id} as ${status}`);
    return db.documents.find((d) => d.id === id)!;
  },
  getRevisions: (): RevisionRecord[] => getDB().revisions,
  createRevision: (data: Omit<RevisionRecord, "id" | "created_at">): RevisionRecord => {
    const db = getDB();
    const newRev: RevisionRecord = {
      ...data,
      id: `rev-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    db.revisions.unshift(newRev);
    saveDB(db);
    logAction("admin@eoms.local", "Create Revision", "Documents", `Created revision for drawing ${data.drawing_number} (${data.revision_type})`);
    return newRev;
  },

  // ── Administration & Settings ─────────────────────────────────────────────
  getAuditLogs: (): AuditLog[] => getDB().auditLogs,
  getSettings: (): SystemSettings => getDB().settings,
  saveSettings: (settings: SystemSettings) => {
    const db = getDB();
    db.settings = settings;
    saveDB(db);
    logAction("admin@eoms.local", "Save Settings", "Administration", "Updated system settings parameters");
  }
};
