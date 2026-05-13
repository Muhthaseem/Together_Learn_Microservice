"use client";
import React, { useEffect, useState } from "react";
import { usersApi, authApi, uploadApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageContainer, SectionHeader } from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { EyeIcon, EyeSlashIcon, PencilSquareIcon, CameraIcon, FolderOpenIcon, TrashIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Cropper from "react-easy-crop";

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [indexNumber, setIndexNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [cpOpen, setCpOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | undefined>(undefined);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const captureRef = React.useRef<HTMLInputElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [scale, setScale] = useState(1);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const previewRef = React.useRef<HTMLDivElement | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [cpLoading, setCpLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await usersApi.me() as { name?: string; email?: string; department?: string; batch?: string; registrationNumber?: string; indexNumber?: string; avatarUrl?: string };
        setName(me.name || "");
        setEmail(me.email || "");
        setDepartment(me.department || "");
        setBatch(me.batch || "");
        setRegistrationNumber(me.registrationNumber || "");
        setIndexNumber(me.indexNumber || "");
        setAvatarUrl(me.avatarUrl);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    setSaving(true);
    setErrorText(null);
    try {
      const committedAvatar = (pendingAvatarUrl === undefined ? avatarUrl : pendingAvatarUrl) ?? null;
      await usersApi.updateMe({ currentPassword, name, department, batch, registrationNumber, indexNumber, avatarUrl: committedAvatar });
      toast.success("Profile updated");
      setCurrentPassword("");
      setPwOpen(false);
      // If avatar was staged, commit it
      setAvatarUrl(committedAvatar || undefined);
      setPendingAvatarUrl(undefined);
      // update auth context so navbar reflects new name/avatar
      if (user) {
        login({ ...user, name, department, batch, registrationNumber, indexNumber, avatarUrl: committedAvatar || undefined });
      }
      setEditing(false);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setErrorText(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error("Fill both password fields");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    try {
      setCpLoading(true);
      await authApi.changePassword({ oldPassword, newPassword });
      toast.success("Password changed");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setCpOpen(false);
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err?.message || "Password change failed");
    } finally {
      setCpLoading(false);
    }
  };

  if (!user) return null;
  if (loading) {
    return (
      <PageContainer>
        <div className="text-muted py-8">Loading profile…</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader title="Profile" subtitle="Manage your account" />

      <div className="grid gap-6 md:grid-cols-1 max-w-2xl mx-auto">
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-[var(--color-surface)] border border-token flex items-center justify-center">
              {(editing ? (pendingAvatarUrl !== undefined ? pendingAvatarUrl : avatarUrl) : avatarUrl) ? (
                <Image src={(editing ? (pendingAvatarUrl !== undefined ? pendingAvatarUrl : avatarUrl) : avatarUrl)!} alt="Avatar" width={96} height={96} className="h-24 w-24 object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-16 w-16 text-[var(--color-secondary)]" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" fill="currentColor" />
                  <path d="M4 20c0-4 4-7 8-7s8 3 8 7" fill="currentColor" />
                </svg>
              )}
              {editing && (
                <button type="button" aria-label="Edit avatar" className="absolute bottom-2 right-2 h-9 w-9 rounded-full border border-token bg-[var(--color-surface)] shadow flex items-center justify-center hover:bg-[var(--color-accent)]/20 z-10" onClick={() => setAvatarOpen(true)}>
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <div className="font-medium mb-3">Your Details</div>
          {!editing ? (
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-[150px_1fr] gap-4 items-baseline"><div className="text-muted">Name</div><div className="font-medium break-words">{name || '-'}</div></div>
              <div className="grid grid-cols-[150px_1fr] gap-4 items-baseline"><div className="text-muted">Email</div><div className="font-medium break-all">{email || '-'}</div></div>
              <div className="grid grid-cols-[150px_1fr] gap-4 items-baseline"><div className="text-muted">Registration No</div><div className="font-medium break-words">{registrationNumber || '-'}</div></div>
              <div className="grid grid-cols-[150px_1fr] gap-4 items-baseline"><div className="text-muted">Index No</div><div className="font-medium break-words">{indexNumber || '-'}</div></div>
              <div className="grid grid-cols-[150px_1fr] gap-4 items-baseline"><div className="text-muted">Department</div><div className="font-medium break-words">{department || '-'}</div></div>
              <div className="grid grid-cols-[150px_1fr] gap-4 items-baseline"><div className="text-muted">Batch</div><div className="font-medium break-words">{batch || '-'}</div></div>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                <Button onClick={() => setCpOpen(true)}>Change Password</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div>
                <div className="text-sm text-muted mb-1">Name</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Registration Number</div>
                <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="Registration number" />
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Index Number</div>
                <Input value={indexNumber} onChange={(e) => setIndexNumber(e.target.value)} placeholder="Index number" />
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Department</div>
                <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">Select department</option>
                  <option value="First Year">COMMON</option>
                  <option value="CO">CO</option>
                  <option value="CE">CE</option>
                  <option value="EEE">EEE</option>
                  <option value="ME">ME</option>
                </Select>
              </div>
              <div>
                <div className="text-sm text-muted mb-1">Batch</div>
                <Select value={batch} onChange={(e) => setBatch(e.target.value)}>
                  {Array.from({ length: 10 }, (_, i) => `Batch ${i + 1}`).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={() => setPwOpen(true)}>Save</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="Confirm Password">
        <div className="grid gap-3">
          <div>
            <div className="text-sm text-muted mb-1">Enter Current Password to Save</div>
            <div className="relative">
              <Input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
              <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute inset-y-0 right-2 flex items-center text-[var(--color-muted)]">
                {showCurrent ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {errorText && <div className="text-sm text-red-600 mt-1">{errorText}</div>}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={cpOpen} onClose={() => setCpOpen(false)} title="Change Password">
        <div className="grid gap-3">
          <div>
            <div className="text-sm text-muted mb-1">Current Password</div>
            <div className="relative">
              <Input type={showOld ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Current password" />
              <button type="button" onClick={() => setShowOld(s => !s)} className="absolute inset-y-0 right-2 flex items-center text-[var(--color-muted)]">
                {showOld ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted mb-1">New Password</div>
            <div className="relative">
              <Input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
              <button type="button" onClick={() => setShowNew(s => !s)} className="absolute inset-y-0 right-2 flex items-center text-[var(--color-muted)]">
                {showNew ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted mb-1">Confirm New Password</div>
            <div className="relative">
              <Input type={showConfirm ? 'text' : 'password'} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" />
              <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute inset-y-0 right-2 flex items-center text-[var(--color-muted)]">
                {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCpOpen(false)}>Cancel</Button>
            <Button onClick={onChangePassword} disabled={cpLoading}>{cpLoading ? 'Updating…' : 'Update Password'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={avatarOpen} onClose={() => setAvatarOpen(false)} title="Update Profile Picture">
        <div className="grid gap-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                  setStream(s);
                  setImgSrc(null);
                  setTimeout(() => { if (videoRef.current) (videoRef.current as any).srcObject = s; }, 0);
                } catch {
                  // fallback to file input if permission denied
                  captureRef.current?.click();
                }
              }}
            >
              <CameraIcon className="h-4 w-4 mr-1" /> Capture
            </Button>
                <Button variant="outline" onClick={() => fileRef.current?.click()}><FolderOpenIcon className="h-4 w-4 mr-1" /> Browse</Button>
            <Button variant="outline" onClick={() => { setPendingAvatarUrl(null as any); setImgSrc(null); setAvatarOpen(false); toast.success('Avatar staged for removal. Save changes to apply.'); }}><TrashIcon className="h-4 w-4 mr-1" /> Remove</Button>
            <input ref={captureRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f=e.target.files?.[0]; if (f) { const u=URL.createObjectURL(f); setImgSrc(u); } }} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f=e.target.files?.[0]; if (f) { const u=URL.createObjectURL(f); setImgSrc(u); } }} />
          </div>
          {stream && !imgSrc ? (
            <div className="mx-auto">
              <div className="h-64 w-64 rounded-md overflow-hidden bg-black flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="h-full" />
              </div>
              <div className="mt-2 flex gap-2 justify-center">
                <Button
                  onClick={() => {
                    if (!videoRef.current) return;
                    const v = videoRef.current as HTMLVideoElement;
                    const canvas = document.createElement('canvas');
                    const size = 512; canvas.width = size; canvas.height = size;
                    const ctx = canvas.getContext('2d'); if (!ctx) return;
                    // center-crop square from video
                    const vw = v.videoWidth; const vh = v.videoHeight;
                    const side = Math.min(vw, vh);
                    const sx = (vw - side) / 2; const sy = (vh - side) / 2;
                    ctx.drawImage(v, sx, sy, side, side, 0, 0, size, size);
                    canvas.toBlob((blob) => {
                      if (!blob) return;
                      const url = URL.createObjectURL(blob);
                      setImgSrc(url);
                      // stop stream
                      stream?.getTracks().forEach(t => t.stop());
                      setStream(null);
                    }, 'image/jpeg', 0.92);
                  }}
                >Take Photo</Button>
                <Button variant="outline" onClick={() => { stream?.getTracks().forEach(t => t.stop()); setStream(null); }}>Close Camera</Button>
              </div>
            </div>
          ) : imgSrc ? (
            <div className="mx-auto select-none">
              <div ref={previewRef} className="relative h-64 w-64 overflow-hidden rounded-md bg-black">
                <Cropper
                  image={imgSrc}
                  crop={crop}
                  zoom={scale}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setScale}
                  onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                  showGrid={false}
                  restrictPosition
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-sm text-muted w-24">Zoom</div>
                <input type="range" min={0.5} max={3} step={0.01} value={scale} onChange={(e)=>setScale(parseFloat(e.target.value))} className="flex-1" />
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted">Choose an image to edit.</div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { if(imgSrc) URL.revokeObjectURL(imgSrc); setImgSrc(null); setCrop({x:0,y:0}); setScale(1); setCroppedAreaPixels(null); setAvatarOpen(false); }}>Cancel</Button>
            <Button disabled={uploading} onClick={async () => {
              if (uploading) return;
              const canvas = document.createElement('canvas');
              const size = 512;
              canvas.width = size; canvas.height = size;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              const img = document.createElement('img');
              img.onload = async () => {
                ctx.clearRect(0,0,size,size);
                const area = croppedAreaPixels || { x: 0, y: 0, width: img.width, height: img.height };
                ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
                canvas.toBlob(async (blob) => {
                  if (!blob) return;
                  const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
                  try {
                    setUploading(true);
                    const up = await uploadApi.upload([file]);
                const url = up.files[0]?.url;
                if (url) setPendingAvatarUrl(url);
                toast.success('Avatar staged. Save changes to apply.');
                    setAvatarOpen(false);
                    if(imgSrc) URL.revokeObjectURL(imgSrc);
                  } catch { toast.error('Upload failed'); }
                  finally { setUploading(false); }
                }, 'image/jpeg', 0.92);
              };
              img.crossOrigin = 'anonymous';
              img.src = imgSrc!;
            }}>{uploading ? 'Uploading…' : 'Upload'}</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}


