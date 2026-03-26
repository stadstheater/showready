import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <h1 className="text-6xl font-bold font-serif text-foreground tracking-tight">404</h1>
        <p className="mt-3 text-lg text-muted-foreground">Pagina niet gevonden</p>
        <a
          href="/"
          className="inline-block mt-6 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Terug naar Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
