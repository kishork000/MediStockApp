
"use client";

import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, BookOpen } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DocumentationPage() {
    const contentRef = useRef<HTMLDivElement>(null);

    const handleDownloadPdf = () => {
        const input = contentRef.current;
        if (!input) return;

        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth;
            const height = width / ratio;

            let position = 0;
            let heightLeft = height;

            pdf.addImage(imgData, 'PNG', 0, position, width, height);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - height;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, width, height);
                heightLeft -= pdfHeight;
            }
            
            pdf.save('MediStock_Documentation.pdf');
        });
    };
    
    const CodeBlock = ({ children }: { children: React.ReactNode }) => (
        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
            <code>{children}</code>
        </pre>
    );

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <h1 className="text-xl font-semibold flex items-center gap-2"><BookOpen /> Documentation</h1>
                <Button onClick={handleDownloadPdf} size="sm" className="ml-auto">
                    <Download className="mr-2" /> Download as PDF
                </Button>
            </header>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div ref={contentRef} className="p-4 bg-background">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Structure Overview</CardTitle>
                            <CardDescription>
                                This application is built with Next.js using the App Router. It's designed to be modular and scalable, separating concerns like UI, business logic, data services, and AI functionality.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CodeBlock>
{`/
├── src/
│   ├── app/                # Application routes (pages)
│   ├── components/         # Reusable UI components (ShadCN, custom)
│   ├── contexts/           # React Context for global state (e.g., Auth)
│   ├── services/           # Backend logic (Firebase Firestore interactions)
│   ├── lib/                # Utility functions, types, and configs
│   ├── ai/                 # Genkit AI flows and configuration
│   │   ├── flows/          # Individual AI flows (e.g., dashboard summary)
│   │   └── genkit.ts       # Genkit initialization
│   ├── hooks/              # Custom React hooks (e.g., useToast)
│   └── public/             # Static assets (images, etc.) - currently unused
├── components.json         # ShadCN UI configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
└── tailwind.config.ts      # Tailwind CSS configuration`}
                            </CodeBlock>
                        </CardContent>
                    </Card>

                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Key Directories and Files</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg">`src/app/` - Routing and Pages</h3>
                                <p className="text-muted-foreground mt-1">This directory contains all the pages of your application, following the Next.js App Router convention.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    <li><span className="font-mono bg-muted px-1 rounded">layout.tsx</span>: The root layout of the application. It sets up the main HTML structure, includes global CSS, and wraps the application in necessary providers like `ThemeProvider` and `AuthProvider`.</li>
                                    <li><span className="font-mono bg-muted px-1 rounded">page.tsx</span>: The main dashboard page, which is the entry point after a user logs in.</li>
                                    <li><span className="font-mono bg-muted px-1 rounded">login/page.tsx</span>: The user login page.</li>
                                    <li>Subdirectories like <span className="font-mono bg-muted px-1 rounded">/admin</span>, <span className="font-mono bg-muted px-1 rounded">/inventory</span>, etc., represent routes. The `page.tsx` file inside each is the UI for that page.</li>
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold text-lg">`src/components/` - UI Components</h3>
                                <p className="text-muted-foreground mt-1">This is where all the reusable React components are stored.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    <li><span className="font-mono bg-muted px-1 rounded">ui/</span>: Holds components provided by the ShadCN UI library (e.g., Button, Card).</li>
                                    <li><span className="font-mono bg-muted px-1 rounded">dashboard/</span>, <span className="font-mono bg-muted px-1 rounded">sales/</span>: Contain custom components built specifically for a certain feature.</li>
                                    <li><span className="font-mono bg-muted px-1 rounded">theme-provider.tsx</span> & <span className="font-mono bg-muted px-1 rounded">theme-toggle.tsx</span>: Components that manage the light/dark mode theme.</li>
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold text-lg">`src/contexts/` - Global State Management</h3>
                                <p className="text-muted-foreground mt-1">This directory holds React Context providers for managing global application state.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    <li><span className="font-mono bg-muted px-1 rounded">AuthContext.tsx</span>: A critical file that manages user authentication, roles, and permissions.</li>
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold text-lg">`src/services/` - Backend Logic</h3>
                                <p className="text-muted-foreground mt-1">This is the "backend" of your frontend application. All communication with Firebase Firestore is handled here.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    <li>Each file corresponds to a specific data model (e.g., `inventory-service.ts`, `sales-service.ts`).</li>
                                    <li>Contains functions for CRUD (Create, Read, Update, Delete) operations.</li>
                                    <li><span className="font-mono bg-muted px-1 rounded">firebase-config.ts</span>: Contains the Firebase project configuration.</li>
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold text-lg">`src/lib/` - Utilities and Definitions</h3>
                                <p className="text-muted-foreground mt-1">A general-purpose directory for shared code and configurations.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    <li><span className="font-mono bg-muted px-1 rounded">types.ts</span>: Defines shared TypeScript types and interfaces.</li>
                                    <li><span className="font-mono bg-muted px-1 rounded">utils.ts</span>: Contains utility functions like `cn` for Tailwind CSS classes.</li>
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold text-lg">`src/ai/` - Artificial Intelligence</h3>
                                <p className="text-muted-foreground mt-1">This directory contains all code related to Generative AI features, powered by Genkit.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    <li><span className="font-mono bg-muted px-1 rounded">genkit.ts</span>: Initializes and configures the main Genkit `ai` instance.</li>
                                    <li><span className="font-mono bg-muted px-1 rounded">flows/</span>: Contains individual Genkit "flows," which are server-side functions for AI tasks.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
