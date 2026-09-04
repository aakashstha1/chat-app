"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const BIO_MAX = 250;

export default function ProfilePage() {
  const { user, updateLocalUser } = useAuth();
  const { notify } = useToast();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    // multipart/form-data because the avatar (if present) is a binary
    // file - the backend's `upload.single("avatar")` middleware expects
    // this exact field name.
    const formData = new FormData();
    if (name.trim()) formData.append("name", name.trim());
    if (bio.trim()) formData.append("bio", bio.trim());
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      const { data } = await api.patch("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateLocalUser(data.user);
      setAvatarFile(null);
      notify("Profile updated", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col overflow-y-auto px-6 py-8">
      <h1 className="mb-6 text-lg font-semibold">Your profile</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative"
            aria-label="Change avatar"
          >
            <Avatar src={avatarPreview || user?.avatar} name={user?.name} size="xl" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Camera size={20} />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarPick}
          />
          <p className="text-xs text-muted">Click the avatar to change it</p>
        </div>

        <Input label="Username" value={`@${user?.username || ""}`} disabled readOnly />
        <Input label="Email" value={user?.email || ""} disabled readOnly />

        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="flex items-center justify-between font-medium text-foreground/90">
            Bio
            <span className="text-xs font-normal text-muted">
              {bio.length}/{BIO_MAX}
            </span>
          </span>
          <textarea
            rows={3}
            maxLength={BIO_MAX}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a bit about yourself"
            className="resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-foreground outline-none placeholder:text-muted focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" loading={saving} className="w-full">
          Save changes
        </Button>
      </form>
    </div>
  );
}
