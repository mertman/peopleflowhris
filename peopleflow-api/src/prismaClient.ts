import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "async_hooks";

export const prismaStorage = new AsyncLocalStorage<{ tenantId: string }>();
const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    employee: {
      async $allOperations({ operation, args, query }) {
        const store = prismaStorage.getStore();
        if (store && store.tenantId) {
          const qArgs = args as any;
          if (operation === "create") {
            qArgs.data = qArgs.data || {};
            qArgs.data.tenantId = store.tenantId;
          } else {
            if (operation === "findUnique") {
              return (basePrisma.employee.findFirst as any)({
                ...qArgs,
                where: { ...qArgs.where, tenantId: store.tenantId }
              });
            }
            qArgs.where = qArgs.where || {};
            qArgs.where.tenantId = store.tenantId;
          }
        }
        return query(args);
      }
    },
    position: {
      async $allOperations({ operation, args, query }) {
        const store = prismaStorage.getStore();
        if (store && store.tenantId) {
          const qArgs = args as any;
          if (operation === "create") {
            qArgs.data = qArgs.data || {};
            qArgs.data.tenantId = store.tenantId;
          } else {
            if (operation === "findUnique") {
              return (basePrisma.position.findFirst as any)({
                ...qArgs,
                where: { ...qArgs.where, tenantId: store.tenantId }
              });
            }
            qArgs.where = qArgs.where || {};
            qArgs.where.tenantId = store.tenantId;
          }
        }
        return query(args);
      }
    },
    workflowRequest: {
      async $allOperations({ operation, args, query }) {
        const store = prismaStorage.getStore();
        if (store && store.tenantId) {
          const qArgs = args as any;
          if (operation === "create") {
            qArgs.data = qArgs.data || {};
            qArgs.data.tenantId = store.tenantId;
          } else {
            if (operation === "findUnique") {
              return (basePrisma.workflowRequest.findFirst as any)({
                ...qArgs,
                where: { ...qArgs.where, tenantId: store.tenantId }
              });
            }
            qArgs.where = qArgs.where || {};
            qArgs.where.tenantId = store.tenantId;
          }
        }
        return query(args);
      }
    },
    automationLog: {
      async $allOperations({ operation, args, query }) {
        const store = prismaStorage.getStore();
        if (store && store.tenantId) {
          const qArgs = args as any;
          if (operation === "create") {
            qArgs.data = qArgs.data || {};
            qArgs.data.tenantId = store.tenantId;
          } else {
            if (operation === "findUnique") {
              return (basePrisma.automationLog.findFirst as any)({
                ...qArgs,
                where: { ...qArgs.where, tenantId: store.tenantId }
              });
            }
            qArgs.where = qArgs.where || {};
            qArgs.where.tenantId = store.tenantId;
          }
        }
        return query(args);
      }
    },
    jobHistory: {
      async $allOperations({ operation, args, query }) {
        const store = prismaStorage.getStore();
        if (store && store.tenantId) {
          const qArgs = args as any;
          if (operation !== "create" && operation !== "createMany") {
            qArgs.where = qArgs.where || {};
            qArgs.where.employee = qArgs.where.employee || {};
            qArgs.where.employee.tenantId = store.tenantId;
          }
        }
        return query(args);
      }
    },
    jobInfo: {
      async $allOperations({ operation, args, query }) {
        const store = prismaStorage.getStore();
        if (store && store.tenantId) {
          const qArgs = args as any;
          if (operation !== "create" && operation !== "createMany") {
            qArgs.where = qArgs.where || {};
            qArgs.where.employee = qArgs.where.employee || {};
            qArgs.where.employee.tenantId = store.tenantId;
          }
        }
        return query(args);
      }
    },
    personalInfo: {
      async $allOperations({ operation, args, query }) {
        const store = prismaStorage.getStore();
        if (store && store.tenantId) {
          const qArgs = args as any;
          if (operation !== "create" && operation !== "createMany") {
            qArgs.where = qArgs.where || {};
            qArgs.where.employee = qArgs.where.employee || {};
            qArgs.where.employee.tenantId = store.tenantId;
          }
        }
        return query(args);
      }
    }
  }
});
export default prisma;
