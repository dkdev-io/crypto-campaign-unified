import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthRoute } from '../../utils/authRouting';

const SessionMonitor = () => {
  const { checkSession, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const intervalRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownRef = useRef(null);

  // Check session every 30 seconds
  useEffect(() => {
    if (!user) return;

    const checkSessionStatus = async () => {
      const { valid, expired, refreshed } = await checkSession();

      if (expired) {
        // Session expired, sign out and redirect to appropriate auth page
        await signOut();
        const authRoute = getAuthRoute(location.pathname, {
          message: 'Your session has expired. Please sign in again.',
        });
        navigate(authRoute.pathname, { state: authRoute.state });
        return;
      }

      if (refreshed) {
        console.log('Session refreshed automatically');
      }
    };

    // Initial check
    checkSessionStatus();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(checkSessionStatus, 30000); // 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, checkSession, signOut, navigate]);

  // Monitor user activity
  useEffect(() => {
    if (!user) return;

    let inactivityTimer = null;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    const WARNING_TIME = 14 * 60 * 1000; // Show warning at 14 minutes

    const resetTimer = () => {
      // Clear existing timers
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);

      // Hide warning if showing
      setShowWarning(false);
      setCountdown(60);

      // Set warning timer
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setCountdown(60);

        // Start countdown
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              // Time's up, sign out
              handleInactivitySignOut();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, WARNING_TIME);

      // Set inactivity timer
      inactivityTimer = setTimeout(() => {
        handleInactivitySignOut();
      }, INACTIVITY_TIMEOUT);
    };

    const handleInactivitySignOut = async () => {
      await signOut();
      const authRoute = getAuthRoute(location.pathname, {
        message: 'You have been signed out due to inactivity.',
      });
      navigate(authRoute.pathname, { state: authRoute.state });
    };

    // Events to monitor for activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true);
    });

    // Start timer
    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, true);
      });
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [user, signOut, navigate]);

  const handleStaySignedIn = () => {
    // Reset all timers - this will be triggered by the click event
    setShowWarning(false);
    setCountdown(60);
  };

  if (!user || !showWarning) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h3 style={{ marginBottom: '1rem', color: '#1a1a1a' }}>⏰ Session Timeout Warning</h3>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          You will be signed out in <strong>{countdown}</strong> seconds due to inactivity.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleStaySignedIn}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Stay Signed In
          </button>
          <button
            onClick={() => signOut()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              color: '#666',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionMonitor;
