"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { differenceInMinutes } from "date-fns";

export type NotificationType = "success" | "info" | "error";

interface CustomNotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  lastRefreshTime?: Date;
}

const UPDATE_INTERVAL_MINUTES = 5;

export function CustomNotification({
  type,
  message,
  isVisible,
  onClose,
  duration = 3000,
  lastRefreshTime,
}: CustomNotificationProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timeout = setTimeout(() => {
        setIsClosing(true);
        setTimeout(onClose, 500); // Allow time for exit animation
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;
  
  // Calculate time until next update
  const calculateTimeUntilNextUpdate = () => {
    if (!lastRefreshTime) return null;
    
    const now = new Date();
    const minutesSinceLastUpdate = differenceInMinutes(now, lastRefreshTime);
    const minutesRemaining = UPDATE_INTERVAL_MINUTES - minutesSinceLastUpdate;
    
    if (minutesRemaining <= 0) return "disponível agora";
    return `em ${minutesRemaining} minuto${minutesRemaining !== 1 ? 's' : ''}`;
  };

  return (
    <div
      className={cn(
        "fixed bottom-8 right-8 z-[9999]",
        "flex flex-col p-4",
        "transition-all duration-500 transform",
        "animate-in fade-in-0 slide-in-from-right-5",
        isClosing && "animate-out fade-out-0 slide-out-to-right-5",
        "min-w-[320px] max-w-[80%] overflow-hidden"
      )}
    >
      <div className="relative">
        {/* Border gradient container */}
        <div 
          className="absolute inset-0 rounded-lg p-[2px] overflow-hidden"
          style={{
            background: "linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa, #93c5fd, #60a5fa, #3b82f6, #2563eb)",
            backgroundSize: "300% 100%",
            animation: "gradientFlow 2.5s ease infinite",
            boxShadow: "0 0 15px rgba(59, 130, 246, 0.3)",
          }}
        >
          {/* Empty div for gradient border effect */}
        </div>

        {/* Actual content with white background */}
        <div className="bg-white rounded-lg p-4 relative shadow-sm">
          <div className="flex items-center gap-3">
            {type === "success" && (
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
            )}
            {type === "info" && (
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
            )}
            {type === "error" && (
              <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            )}

            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{message}</p>
              {lastRefreshTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Próxima atualização {calculateTimeUntilNextUpdate()}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setIsClosing(true);
                setTimeout(onClose, 500);
              }}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 ml-2"
            >
              <XCircle className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes glowPulse {
          0% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.2); }
          50% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
          100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.2); }
        }
      `}</style>
    </div>
  );
}
