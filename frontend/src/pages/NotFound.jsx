import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-muted-foreground">404</h1>
          <p className="text-2xl font-semibold">Page Not Found</p>
          <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
          >
            Go Back
          </Button>
          <Button 
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
