import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Card } from "../components/ui";
import { Workspace } from "../components/layout/Workspace";
import { PageHeader } from "../components/app/PageHeader";
import { logout, getToken } from "../lib/auth";

const SegmentedToggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <div className="flex shrink-0 items-center rounded-lg bg-slate-100 p-1 dark:bg-white/5">
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); if (!checked) onChange(); }}
      className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
        checked 
          ? 'bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-400' 
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
      }`}
    >
      On
    </button>
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); if (checked) onChange(); }}
      className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
        !checked 
          ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white' 
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
      }`}
    >
      Off
    </button>
  </div>
);

export function Settings() {
  const nav = useNavigate();
  const [prefs, setPrefs] = useState({
    notifications: true,
    weeklyReport: false,
    camera: true,
    microphone: true,
  });

  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const togglePref = (key: keyof typeof prefs, name: string) => {
    const newValue = !prefs[key];
    setPrefs({ ...prefs, [key]: newValue });
    toast.success(`${name} ${newValue ? 'enabled' : 'disabled'} successfully.`);
  };

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  const handleDelete = async () => {
    if (deleteInput.toLowerCase() !== "delete") {
      toast.error("Please type 'delete' to confirm.");
      return;
    }
    
    setIsDeleting(true);
    try {
      const { api } = await import('../lib/api');
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      
      // Decode JWT to get user ID
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      const userId = payload.userId;
      
      await api.delete(`/users/${userId}`);
      toast.success("Account deleted successfully");
      logout();
      nav("/");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Workspace title="Settings">
      <PageHeader title="Settings." description="Manage your preferences and account security." />

      <div className="grid gap-4 md:grid-cols-3">
        {/* Hardware Permissions */}
        <Card className="col-span-1 flex flex-col p-0 md:col-span-2">
          <div className="border-b border-slate-200/60 p-5 dark:border-white/[0.06]">
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Hardware permissions</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage access to your devices during practice sessions.</p>
          </div>
          <div className="flex-1 p-2">
            <div className="flex items-center justify-between gap-4 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
              <div>
                <b className="text-sm text-slate-900 dark:text-white">Camera access</b>
                <p className="text-xs text-slate-500 dark:text-slate-400">Required for video analysis (optional)</p>
              </div>
              <SegmentedToggle checked={prefs.camera} onChange={() => togglePref("camera", "Camera")} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
              <div>
                <b className="text-sm text-slate-900 dark:text-white">Microphone access</b>
                <p className="text-xs text-slate-500 dark:text-slate-400">Required for voice input and transcriptions</p>
              </div>
              <SegmentedToggle checked={prefs.microphone} onChange={() => togglePref("microphone", "Microphone")} />
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="col-span-1 flex flex-col p-0">
          <div className="border-b border-slate-200/60 p-5 dark:border-white/[0.06]">
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Notifications</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Control communications.</p>
          </div>
          <div className="flex-1 p-2">
            <div className="flex items-center justify-between gap-4 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
              <div>
                <b className="text-sm text-slate-900 dark:text-white">Email updates</b>
                <p className="text-xs text-slate-500 dark:text-slate-400">Session reports</p>
              </div>
              <SegmentedToggle checked={prefs.notifications} onChange={() => togglePref("notifications", "Email notifications")} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
              <div>
                <b className="text-sm text-slate-900 dark:text-white">Weekly summary</b>
                <p className="text-xs text-slate-500 dark:text-slate-400">Progress digest</p>
              </div>
              <SegmentedToggle checked={prefs.weeklyReport} onChange={() => togglePref("weeklyReport", "Weekly summary")} />
            </div>
          </div>
        </Card>

        {/* Account Management */}
        <Card className="col-span-1 border-red-200/40 p-0 md:col-span-3 dark:border-red-500/10">
          <div className="border-b border-slate-200/60 p-5 dark:border-white/[0.06]">
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Account management</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your active session or permanently delete your data.</p>
          </div>
          
          <div className="flex flex-col gap-4 border-t border-red-100/50 bg-red-50/30 p-5 md:flex-row md:items-center md:justify-between dark:border-red-500/10 dark:bg-red-500/[0.02]">
            <div>
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-500">Danger zone</h4>
              <p className="mt-1 text-xs leading-relaxed text-red-500/80">
                Once you delete your account, there is no going back. All practice data will be permanently wiped.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Button variant="secondary" onClick={() => setShowSignoutConfirm(true)}>
                <LogOut size={16} className="text-slate-500" /> Sign out
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={16} /> Delete account
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Sign Out Modal */}
      {showSignoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sign Out</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowSignoutConfirm(false)}>Cancel</Button>
              <Button onClick={handleLogout} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-slate-800 dark:hover:bg-slate-200">Sign Out</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-red-500/20 dark:border-red-500/20 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-500 mb-2">
              <Trash2 size={24} />
              <h3 className="text-lg font-bold">Delete Account</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This action <b>cannot</b> be undone. This will permanently delete your account, practice history, and all associated data.
            </p>
            <label className="block mb-6">
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Type <b>delete</b> to confirm:
              </span>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:focus:border-red-500"
                placeholder="delete"
              />
            </label>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleteInput.toLowerCase() !== "delete" || isDeleting}>
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Workspace>
  );
}
