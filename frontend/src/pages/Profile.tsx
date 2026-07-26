import { useEffect, useState } from "react";
import { Trophy, Zap, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Card } from "../components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Workspace } from "../components/layout/Workspace";
import { api } from "../lib/api";
import { PageHeader } from "../components/app/PageHeader";

export function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    targetRole: "",
    experienceLevel: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    setLoading(true);
    api.get("/auth/profile")
      .then(res => {
        setProfile(res.data.data);
        setFormData({
          fullName: res.data.data.fullName || "",
          targetRole: res.data.data.targetRole || "",
          experienceLevel: res.data.data.experienceLevel || "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        fullName: formData.fullName,
      };
      if (formData.targetRole) payload.targetRole = formData.targetRole;
      if (formData.experienceLevel) payload.experienceLevel = formData.experienceLevel;
      const res = await api.patch(`/users/${profile.id}`, payload);
      setProfile(res.data.data);
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (e) {
      console.error("Failed to update profile", e);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploadingAvatar(true);
    try {
      const res = await api.post("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(res.data.data);
      toast.success("Avatar updated successfully");
    } catch (err) {
      console.error("Avatar upload failed", err);
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <Workspace title="Profile">
        <div className="p-8 text-center text-slate-400">Loading profile...</div>
      </Workspace>
    );
  }

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  return (
    <Workspace title="Profile">
      <PageHeader title="Profile." description="Keep your target role and account details ready for tailored practice sessions." />

      <Card className="relative flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
        <div className="relative">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="size-[72px] rounded-full object-cover shadow-sm" />
          ) : (
            <span className="grid size-[72px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold text-white shadow-sm">
              {initials}
            </span>
          )}
          <label className="absolute -bottom-1 -right-1 grid size-7 cursor-pointer place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-zinc-800 dark:text-slate-400 dark:hover:bg-zinc-700">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            <Zap size={13} className={uploadingAvatar ? "animate-pulse" : ""} />
          </label>
        </div>
        <div className="flex-1">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-950 dark:text-white">
            {profile?.fullName || 'User'}
            {profile?.role === 'admin' && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">Admin</span>
            )}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{profile?.email || 'No email'}</p>
          <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            Open to opportunities
          </span>
        </div>
        <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit profile</Button>
      </Card>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Edit profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close edit profile dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Full name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Target role</label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={e => setFormData({ ...formData, targetRole: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-400"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Experience level</label>
                <Select value={formData.experienceLevel} onValueChange={v => setFormData({ ...formData, experienceLevel: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="fresher">Fresher</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </Card>
        </div>
      )}

      <div className="profile-grid mt-5">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500">Target role</h3>
          {profile?.targetRole ? (
            <>
              <h2 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">{profile.targetRole}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Focusing on {profile.targetRole.toLowerCase()} interviews.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">No Target Role Set</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Edit your profile to set your target role.</p>
            </>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500">Achievements</h3>
          <div className="achievement">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <Trophy size={18} className="text-amber-500" />
            </div>
            <div>
              <b className="text-sm text-slate-950 dark:text-white">On a roll</b>
              <p className="text-xs text-slate-500 dark:text-slate-400">Completed 5 interviews this month</p>
            </div>
          </div>
          <div className="achievement">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <Zap size={18} className="text-blue-500" />
            </div>
            <div>
              <b className="text-sm text-slate-950 dark:text-white">Fast learner</b>
              <p className="text-xs text-slate-500 dark:text-slate-400">Improved your score by 15 points</p>
            </div>
          </div>
        </Card>
      </div>
    </Workspace>
  );
}
