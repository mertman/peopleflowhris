-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "role" TEXT NOT NULL DEFAULT 'Employee',
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PersonalInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "preferredName" TEXT,
    "dateOfBirth" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    CONSTRAINT "PersonalInfo_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "legalEntity" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "payGrade" TEXT NOT NULL,
    "fte" REAL NOT NULL DEFAULT 1.0,
    "employeeClass" TEXT NOT NULL DEFAULT 'Regular',
    "managerId" TEXT,
    "hireDate" DATETIME NOT NULL,
    "probationEnd" DATETIME,
    "salary" REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "JobInfo_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "effectiveDate" DATETIME NOT NULL,
    "event" TEXT NOT NULL,
    "eventReason" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "legalEntity" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "payGrade" TEXT NOT NULL,
    "fte" REAL NOT NULL,
    "employeeClass" TEXT NOT NULL,
    "managerId" TEXT,
    "salary" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeNumber_key" ON "Employee"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalInfo_employeeId_key" ON "PersonalInfo"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalInfo_email_key" ON "PersonalInfo"("email");

-- CreateIndex
CREATE UNIQUE INDEX "JobInfo_employeeId_key" ON "JobInfo"("employeeId");
