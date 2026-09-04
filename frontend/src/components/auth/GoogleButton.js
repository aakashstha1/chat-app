"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Loads Google's GSI script on demand and renders its own button into
// a div we control, then forwards the returned credential to our backend.
export default function GoogleButton() {
  const containerRef = useRef(null);
  const { googleLogin } = useAuth();
  const { notify } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!CLIENT_ID) return;

    const handleCredential = async (response) => {
      try {
        await googleLogin(response.credential);
        router.replace("/chat");
      } catch (err) {
        notify(err.message, "error");
      }
    };

    const renderButton = () => {
      if (!window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "filled_black",
        size: "large",
        width: 320,
        shape: "pill",
      });
    };

    if (window.google) {
      renderButton();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = renderButton;
      document.body.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callback identity intentionally not tracked
  }, []);

  if (!CLIENT_ID) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}
