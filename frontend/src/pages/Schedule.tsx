import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, ChevronRight, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, Button } from "../components/ui";
import { Workspace } from "../components/layout/Workspace";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const POPULAR_ROLES = [
  "AI Engineer",
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Product Manager",
  "Data Scientist",
  "Data Analyst",
  "UX/UI Designer",
  "DevOps Engineer",
  "Marketing Manager",
  "Sales Executive"
];

export function Schedule() {
  const [role, setRole] = useState("");
  const [showRoles, setShowRoles] = useState(false);
  const [focus, setFocus] = useState("technical");
  const [level, setLevel] = useState("mid");
  const [length, setLength] = useState("45");
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileRoles, setProfileRoles] = useState<string[]>([]);

  useEffect(() => {
    import("../lib/api").then(({ api }) => {
      api.get("/auth/profile").then((res) => {
        if (res.data?.data?.targetRole) {
          setProfileRoles([res.data.data.targetRole]);
          // If role input is empty, prefill with their primary target role
          setRole((prev) => prev ? prev : res.data.data.targetRole);
        }
      }).catch(() => {});
    });
  }, []);

  const combinedRoles = Array.from(new Set([...profileRoles, ...POPULAR_ROLES]));
  const filteredRoles = combinedRoles.filter(r => r.toLowerCase().includes(role.toLowerCase()));

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) {
      toast.error("Please enter the target role.");
      return;
    }
    setLoading(true);
    try {
      const { api } = await import("../lib/api");
      let jdId = undefined;

      if (jdText.trim().length > 20) {
        const jdRes = await api.post("/jd/upload", {
          title: role,
          company: "Target Company",
          rawText: jdText,
        });
        jdId = jdRes.data.data.id;
      }

      const totalQuestions = length === "15" ? 10 : length === "30" ? 20 : length === "45" ? 30 : 40;

      const res = await api.post("/interviews", {
        role: role.trim(),
        interviewType: focus,
        experienceLevel: level,
        totalQuestions: totalQuestions,
        jdId: jdId,
      });

      setSaved(true);
      window.location.href = `/app/lobby?id=${res.data.data.id}`;
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || "Failed to schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Workspace title="Schedule interview">
      <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Build a targeted practice session
            </p>
            <h2 className="font-serif text-3xl leading-tight tracking-tight text-slate-950 md:text-4xl dark:text-white">
              What are you preparing for?
            </h2>
          </div>
          <Card className="p-6 md:p-8">
            <form onSubmit={handleSchedule} className="grid gap-6">
              <div className="w-full space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                  Target role
                </label>
                <div className="relative">
                  <input
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setShowRoles(true);
                    }}
                    onFocus={() => setShowRoles(true)}
                    onBlur={() => setShowRoles(false)}
                    required
                    placeholder="e.g. AI Engineer"
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/10"
                  />
                  {showRoles && filteredRoles.length > 0 && (
                    <div className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-zinc-900">
                      {filteredRoles.map(r => (
                        <button
                          key={r}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input onBlur from firing first
                            setRole(r);
                            setShowRoles(false);
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                  Interview focus
                </label>
                <Select value={focus} onValueChange={setFocus}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                    <SelectValue placeholder="Select focus" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="behavioral">Behavioural</SelectItem>
                    <SelectItem value="mixed">Mixed (Product Sense)</SelectItem>
                    <SelectItem value="hr">HR & Leadership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="w-full space-y-2">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white">
                    Experience level
                  </label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="fresher">Entry level</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid-level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full space-y-2">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white">
                    Session length
                  </label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="w-full space-y-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                  Job description context
                </label>
                <textarea
                  placeholder="Paste the role description to tailor your questions... (min 20 chars)"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  className="min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/10"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading ? (
                    "Preparing session..."
                  ) : saved ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 size={18} /> Session scheduled
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CalendarPlus size={18} /> Schedule session
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="grid gap-4 lg:sticky lg:top-24">
          <Card className="p-6">
            <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
              <Sparkles size={18} className="text-blue-600 dark:text-blue-400" /> Session summary
            </h3>
            <div className="grid gap-4 text-sm">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Target role
                </p>
                <p className="font-medium text-slate-950 dark:text-white">{role || "Not specified"}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Experience level
                </p>
                <p className="font-medium capitalize text-slate-950 dark:text-white">{level} level</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Interview focus
                </p>
                <p className="font-medium capitalize text-slate-950 dark:text-white">{focus} interview</p>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-slate-200/60 pt-4 dark:border-white/[0.06]">
                <p className="text-slate-500 dark:text-slate-400">Duration</p>
                <p className="font-semibold text-blue-600 dark:text-blue-400">{length} mins</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-500 dark:text-slate-400">Questions</p>
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {length === "15" ? 10 : length === "30" ? 20 : length === "45" ? 30 : 40} generated
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-dashed p-6">
            <h3 className="mb-2 text-base font-semibold text-slate-950 dark:text-white">Pro tip</h3>
            <p className="mb-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Adding a job description gives your interviewer the context to ask questions that actually matter for
              this role.
            </p>
            <Link
              to="/app/profile"
              className="flex items-center gap-1 text-sm font-semibold text-blue-600 no-underline dark:text-blue-400"
            >
              Update your profile <ChevronRight size={14} />
            </Link>
          </Card>
        </div>
      </div>
    </Workspace>
  );
}
