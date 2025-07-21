
export type UserRole = "Admin" | "Pharmacist" | "Technician";

export interface User {
    name: string;
    email: string;
    role: UserRole;
    assignedStore?: string;
}

export type RolePermissions = {
    [key in UserRole]: string[];
};

export interface AppRoute {
    path: string;
    name: string;
    inSidebar: boolean;
}

export const allAppRoutes: AppRoute[] = [
    { path: "/", name: "Dashboard", inSidebar: false }, // Special case, handled in page.tsx
    { path: "/patients", name: "Patients", inSidebar: true },
    { path: "/sales", name: "Sales", inSidebar: true },
    // { path: "/inventory", name: "Inventory", inSidebar: true }, // This is a tab on dashboard
    { path: "/inventory/add", name: "Add Medicine", inSidebar: true },
    { path: "/inventory/transfer", name: "Stock Transfer", inSidebar: true },
    { path: "/diseases", name: "Diseases", inSidebar: true },
    // { path: "/reports", name: "Reports", inSidebar: true }, // This is a tab on dashboard
    { path: "/admin", name: "Admin", inSidebar: true },
];

    