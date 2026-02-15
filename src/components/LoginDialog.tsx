"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, AuthResponse } from "@/context/AuthContext";

const API_BASE = "http://localhost:8080/auth";
const MAX_ATTEMPTS = 3;
const OTP_EXPIRY_MINUTES = 10;

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "email" | "otp";

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [otpSentTime, setOtpSentTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_MINUTES * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { login } = useAuth();

  useEffect(() => {
    if (step === "otp" && otpSentTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - otpSentTime) / 1000);
        const remaining = OTP_EXPIRY_MINUTES * 60 - elapsed;
        if (remaining <= 0) {
          setError("OTP has expired. Please request a new one.");
          setOtp("");
          if (timerRef.current) clearInterval(timerRef.current);
        }
        setTimeLeft(remaining);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, otpSentTime]);

  useEffect(() => {
    if (!open) {
      setStep("email");
      setEmail("");
      setOtp("");
      setError("");
      setSuccess("");
      setAttempts(0);
      setOtpSentTime(null);
      setTimeLeft(OTP_EXPIRY_MINUTES * 60);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendOtp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setError("");
    setSuccess("");
    setIsLoading(true);
    fetch(`${API_BASE}/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(data => { throw new Error(data.message || "Failed to send OTP"); });
      }
      setSuccess("OTP sent to your email successfully!");
      setStep("otp");
      setOtpSentTime(Date.now());
      setAttempts(0);
      setIsLoading(false);
    })
    .catch(err => {
      setError(err.message || "Failed to send OTP");
      setIsLoading(false);
    });
  };

  const handleVerifyOtp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("=== VERIFY CLICKED ===", { email, otp, attempts });
    
    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      setError("Maximum attempts exceeded. Please request a new OTP.");
      return;
    }
    setError("");
    setIsLoading(true);
    
    console.log("=== SENDING FETCH TO /verify-otp ===");
    
    fetch(`${API_BASE}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    })
    .then(res => {
      console.log("Verify response status:", res.status, "ok:", res.ok);
      
      return res.json().then(data => {
        console.log("Verify response data:", data);
        
        // Check if response indicates success - adjust based on your API
        // Some APIs return { success: true/false } or { valid: true/false }
        if (!res.ok || data.success === false || data.valid === false || data.error) {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          const remaining = MAX_ATTEMPTS - newAttempts;
          if (remaining > 0) {
            setError(`${data.message || data.error || "Invalid OTP"}. ${remaining} attempt(s) remaining.`);
          } else {
            setError("Maximum attempts exceeded. Please request a new OTP.");
          }
          setIsLoading(false);
          return;
        }
        
        // Success - login
        console.log("[LoginDialog] Backend response data:", data);
        
        const authResponse: AuthResponse = {
          token: data.token || data.jwt || data.accessToken || data.data?.token || "",
          user: data.user || data.userDto || data.profile || data.data?.user || {
            user_id: data.userId || data.id || data.user_id || "",
            society_id: data.societyId || data.society_id || "",
            full_name: data.name || data.fullName || data.full_name || email.split("@")[0],
            email: data.email || email,
            phone: data.phone || "",
            user_type: (data.userType || data.user_type || data.role || "ADMIN") as any,
            is_active: data.isActive ?? data.is_active ?? true,
          },
        };
        
        console.log("[LoginDialog] Final Auth Object to be stored:", authResponse);
        login(authResponse);
        onOpenChange(false);
      });
    })
    .catch(err => {
      console.log("Catch error:", err);
      setError(err instanceof Error ? err.message : "Verification failed");
      setIsLoading(false);
    });
  };

  const handleResendOtp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setOtp("");
    setStep("email");
    setError("");
    setSuccess("");
    setAttempts(0);
    setOtpSentTime(null);
  };

  const handleCloseDialog = (isOpen: boolean) => {
    if (!isOpen && !isLoading) {
      onOpenChange(false);
    }
  };

  const handleInteractOutside = (event: Event) => {
    event.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={(e) => { e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle>Login to LancorC Admin</DialogTitle>
          <DialogDescription>
            {step === "email"
              ? "Enter your email to receive an OTP"
              : `Enter the 6-digit OTP sent to ${email}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === "email" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={handleSendOtp}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {success && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  {success}
                </div>
              )}
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  disabled={isLoading}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-slate-500 text-center">
                  OTP expires in {formatTime(timeLeft)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Resend OTP
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    console.log("=== BUTTON CLICKED ===", { otp, otpLength: otp.length, isLoading, attempts });
                    handleVerifyOtp(e as any);
                  }}
                  disabled={isLoading || otp.length !== 6 || attempts >= MAX_ATTEMPTS}
                  className="flex-1"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify
                </Button>
              </div>
              {attempts > 0 && (
                <p className="text-xs text-slate-500 text-center">
                  Attempt {attempts} of {MAX_ATTEMPTS}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
