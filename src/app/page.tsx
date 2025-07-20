import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-bold text-center tracking-tight">
              Welcome to Your New Application!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-xl text-muted-foreground text-center">
              This is the starting point. I'm ready to help you build something amazing.
            </p>
            <p className="text-md text-muted-foreground text-center mt-4">
              What feature should we build first?
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
