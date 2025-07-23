
export type UserRole = string;

export interface User {
    id: string;
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
    parent?: string; // Used to build hierarchy
    children?: AppRoute[]; // Used for UI rendering
    tabs?: { id: string, name: string }[];
}

export const allAppRoutes: AppRoute[] = [
    { path: "/", name: "Dashboard", inSidebar: true },
    { path: "/patients", name: "Patients", inSidebar: true },
    
    // Sales
    { path: "/sales", name: "Sales", inSidebar: true, parent: "Sales", tabs: [
        { id: "new-sale", name: "New Sale" },
        { id: "return-invoice", name: "Return by Invoice" },
        { id: "return-blind", name: "Blind Return" },
    ]},
    { path: "/sales/reports", name: "Sales Reports", inSidebar: true, parent: "Sales" },
    { path: "/reports/profit-loss", name: "Profit & Loss Report", inSidebar: true, parent: "Sales" },
    { path: "/reports", name: "Universal Report", inSidebar: true, parent: "Sales" },
    
    // Inventory
    { path: "/inventory", name: "Stock Management", inSidebar: false }, // Parent group
    { path: "/inventory/stores", name: "Store Stock", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/master", name: "Medicine Master", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/manufacturer", name: "Manufacturer Master", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/add", name: "Add Stock", inSidebar: true, parent: "/inventory", tabs: [
        { id: "bulk-add", name: "Add Manually" },
        { id: "csv-import", name: "Import from CSV" },
    ] },
    { path: "/inventory/returns", name: "Return to Manufacturer", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/transfer", name: "Stock Transfer", inSidebar: true, parent: "/inventory", tabs: [
        { id: "transfer", name: "Transfer to Store" },
        { id: "return", name: "Return to Warehouse" },
    ] },
    { path: "/inventory/adjustment", name: "Stock Adjustment", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/damaged", name: "Damaged Stock", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/reports", name: "Inventory Reports", inSidebar: true, parent: "/inventory", tabs: [
        { id: "levels", name: "Stock Levels Report" },
        { id: "transfers", name: "Transfers Report" },
        { id: "purchase", name: "Purchase History Report" },
    ] },
    { path: "/inventory/valuation", name: "Valuation Report", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/ledger", name: "Stock Ledger", inSidebar: true, parent: "/inventory" },
    
    // Other
    { path: "/diseases", name: "Diseases", inSidebar: true },
    { path: "/documentation", name: "Documentation", inSidebar: true },
    { path: "/admin", name: "Admin", inSidebar: true, tabs: [
        { id: "users", name: "User Management" },
        { id: "roles", name: "Role Management" },
        { id: "permissions", name: "Permissions" },
        { id: "stores", name: "Store Management" },
        { id: "units", name: "Unit Types" },
        { id: "packaging", name: "Packaging Types" },
        { id: "add-user", name: "Add User" },
        { id: "settings", name: "Company Settings" },
    ]},
];

/**
 * Builds a tree structure from the flat list of routes.
 */
export function buildRoutesTree(routes: AppRoute[]): AppRoute[] {
    const routeMap = new Map<string, AppRoute>();
    const tree: AppRoute[] = [];

    // Create a virtual Sales parent if it doesn't exist.
    if (!routeMap.has("Sales")) {
        const salesParent: AppRoute = { path: "Sales", name: "Sales", inSidebar: false, children: [] };
        routeMap.set("Sales", salesParent);
    }

    // First pass: create a map of all routes and prepare children arrays
    routes.forEach(route => {
        const routeWithChildren: AppRoute = { ...route, children: [] };
        if (route.tabs) {
            routeWithChildren.children = route.tabs.map(tab => ({
                path: `${route.path}#${tab.id}`,
                name: tab.name,
                inSidebar: false,
                parent: route.path,
            }));
        }
        routeMap.set(route.path, routeWithChildren);
    });

    // Second pass: build the tree
    routeMap.forEach(route => {
        if (route.parent && routeMap.has(route.parent)) {
            const parent = routeMap.get(route.parent)!;
            // The check for `parent.children` is important
            if(parent.children) {
                 // Avoid duplicating children that might have been added by the tabs logic
                if(!parent.children.some(child => child.path === route.path)) {
                    parent.children.push(route);
                }
            } else {
                 parent.children = [route];
            }
        }
    });

    // Return only the top-level routes (those without a parent in the original list, or our virtual ones)
    return routes.filter(route => !route.parent || (routeMap.has(route.parent!) && !routeMap.get(route.parent!)!.parent));
}
