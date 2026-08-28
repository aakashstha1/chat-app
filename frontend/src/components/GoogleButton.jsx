"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function GoogleButton() {
  const btnRef = useRef(null);
  const { setUser } = useAuth();
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredential = async (response) => {
    try {
      const { data } = await api.post("/auth/google", {
        credential: response.credential,
      });
      setUser(data.user);
      router.replace("/chat");
    } catch (err) {
      console.error("Google sign-in failed", err);
      alert(err?.response?.data?.message || "Google sign-in failed");
    }
  };

  const init = () => {
    if (!clientId || !window.google || !btnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
    });
  };

  useEffect(() => {
    if (window.google) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!clientId) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={init}
      />
      <div className="flex justify-center" ref={btnRef} />
    </>
  );
}
