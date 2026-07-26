import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Mic,
  CheckCircle2,
  Camera,
  Square,
  AlertCircle,
  Flag,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Clock3,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Logo } from "../components/layout";
import { cn } from "../lib/utils";

type TestState = "lobby" | "generating" | "in-progress" | "finishing" | "failed";

export function Test() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [state, setState] = useState<TestState>("lobby");

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [marked, setMarked] = useState<Record<number, boolean>>({});

  const [timeLeft, setTimeLeft] = useState(1800);
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const [interviewDetails, setInterviewDetails] = useState<{ role: string, type: string } | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setAnswers(prev => {
              const currentText = prev[currentQ] || "";
              return { ...prev, [currentQ]: currentText ? currentText + " " + finalTranscript : finalTranscript };
            });
          }
        };
      }
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [currentQ]);

  useEffect(() => {
    if (!id) {
      window.location.href = "/app";
      return;
    }
  }, [id]);

  useEffect(() => {
    if (state === "in-progress") {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state]);

  const startTest = async () => {
    try {
      setState("generating");
      let currentSessionId = sessionId;
      let totalQ = 5;

      if (id) {
        const res = await api.post(`/interviews/${id}/start`);
        const data = res.data.data;
        currentSessionId = data.sessionId;
        setSessionId(currentSessionId);
        
        totalQ = data.totalQuestions || 5;
        const first = data.firstQuestion;
        
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        } else {
          const qs = new Array(totalQ).fill(null).map((_, i) => ({ id: `dummy-${i}` }));
          if (first) qs[0] = first;
          setQuestions(qs);
        }
        
        if (data.interview) {
          setInterviewDetails({ role: data.interview.role, type: data.interview.interviewType });
        }
      }
      
      setState("in-progress");
      
      // Calculate minutes based on total questions (e.g., 10q = 15m, 20q = 30m, 30q = 45m, 40q = 60m)
      const minutes = totalQ === 10 ? 15 : totalQ === 20 ? 30 : totalQ === 30 ? 45 : totalQ === 40 ? 60 : 30;
      setTimeLeft(minutes * 60);
    } catch (err: any) {
      setState("failed");
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.error?.message || "Failed to start session. Ensure you have questions ready.";
      toast.error(errMsg);
    }
  };

  const finishTest = async (force: boolean = false) => {
    if (!force) {
      const answeredCount = Object.keys(answers).filter(k => answers[parseInt(k)]?.trim().length > 0).length;
      if (answeredCount < questions.length) {
        setShowEndDialog(true);
        return;
      }
    }
    setState("finishing");
    if (answers[currentQ] && answers[currentQ].trim().length > 0) {
      await saveCurrentAnswer(answers[currentQ]);
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    try {
      if (id && sessionId) {
        const res = await api.post(`/sessions/${sessionId}/finish`);
        window.location.href = `/app/reports?id=${res.data.data.reportId}`;
      } else {
        window.location.href = `/app/history`;
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to finalize session.");
      window.location.href = `/app/history`;
    }
  };

  const toggleRecording = async () => {
    if (!recording) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setRecording(true);
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
      } catch (e: any) {
        console.error(e);
        toast.error("Camera/microphone access required.");
      }
    } else {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      setStream(null);
      setRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const saveCurrentAnswer = async (text: string) => {
    if (questions[currentQ] && !questions[currentQ].id.toString().startsWith('dummy') && sessionId) {
      try {
        await api.post(`/sessions/${sessionId}/answer`, { 
          questionId: questions[currentQ].id,
          transcript: text
        });
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const goToNext = async () => {
    await saveCurrentAnswer(answers[currentQ] || "");
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const goToPrev = async () => {
    await saveCurrentAnswer(answers[currentQ] || "");
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    }
  };

  const jumpTo = async (index: number) => {
    await saveCurrentAnswer(answers[currentQ] || "");
    setCurrentQ(index);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (state === "lobby") {
    return (
      <div className="mesh-gradient flex min-h-screen flex-col items-center justify-center p-6 text-slate-950 dark:text-white">
        <div className="absolute left-6 top-6">
          <Logo disableLink />
        </div>
        
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200/60 bg-white/80 p-8 text-center shadow-xl shadow-black/[0.04] backdrop-blur-xl dark:border-white/[0.08] dark:bg-zinc-900/80 dark:shadow-black/30">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Camera size={28} />
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">Ready to begin?</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Your camera and microphone will be checked. Make sure you are in a quiet environment.
          </p>

          <div className="my-8 space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-left text-sm dark:border-white/[0.04] dark:bg-white/[0.02]">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span>Network connection stable</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span>Browser supported</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <AlertCircle size={18} className="text-amber-500" />
              <span>Camera permissions required</span>
            </div>
          </div>

          <button
            onClick={startTest}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
          >
            Start Interview
          </button>
          
          <Link to="/app" className="mt-4 inline-block text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            Cancel and return
          </Link>
        </div>
      </div>
    );
  }

  if (state === "generating") {
    return (
      <div className="mesh-gradient flex min-h-screen flex-col items-center justify-center p-6 text-center text-slate-950 dark:text-white">
        <Loader2 size={40} className="mb-6 animate-spin text-blue-600 dark:text-blue-400" />
        <h2 className="font-serif text-3xl font-bold tracking-tight">Generating Your Questions...</h2>
        <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400">
          Our AI is dynamically crafting highly tailored questions based on your selected role, experience level, and focus. This usually takes 10-30 seconds.
        </p>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="mesh-gradient flex min-h-screen flex-col items-center justify-center p-6 text-center text-slate-950 dark:text-white">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <AlertCircle size={28} />
        </div>
        <h2 className="font-serif text-3xl font-bold tracking-tight">Failed to Start</h2>
        <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400">
          We encountered an issue preparing your interview session. Please try again or return to the dashboard.
        </p>
        <Link to="/app" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-slate-200">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (state === "finishing") {
    return (
      <div className="mesh-gradient flex min-h-screen flex-col items-center justify-center p-6 text-center text-slate-950 dark:text-white">
        <Loader2 size={40} className="mb-6 animate-spin text-blue-600 dark:text-blue-400" />
        <h2 className="font-serif text-3xl font-bold tracking-tight">Evaluating Your Answers...</h2>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Our AI is evaluating your interview performance. You will be redirected to your report shortly.
        </p>
      </div>
    );
  }

  const currentQuestionData = questions[currentQ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950 dark:bg-zinc-950 dark:text-white">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-[80px] flex-col border-r border-slate-200/60 bg-white md:w-[280px] dark:border-white/[0.06] dark:bg-zinc-950">
        <div className="flex h-[72px] items-center justify-center border-b border-slate-200/60 md:justify-start md:px-6 dark:border-white/[0.06]">
          <Logo disableLink />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <p className="hidden px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:block dark:text-slate-500">
            Questions
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[idx] && answers[idx].trim().length > 0;
              const isMarked = !!marked[idx];
              const isCurrent = idx === currentQ;

              let bgClass = "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400";
              let borderClass = "border-transparent";

              if (isMarked && isAnswered) {
                bgClass = "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
              } else if (isMarked) {
                bgClass = "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30";
              } else if (isAnswered) {
                bgClass = "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
              } else if (idx < currentQ && !isAnswered) {
                bgClass = "bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30";
              } else if (idx === currentQ) {
                bgClass = "bg-white border-slate-200 text-slate-900 shadow-sm dark:bg-zinc-900 dark:border-white/10 dark:text-white";
                borderClass = "border";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => jumpTo(idx)}
                  className={cn(
                    "flex size-10 items-center justify-center mx-auto md:mx-0 rounded-full text-sm font-semibold transition-all hover:scale-105",
                    bgClass,
                    borderClass,
                    isCurrent && "ring-2 ring-blue-500 ring-offset-2 dark:ring-blue-400 dark:ring-offset-zinc-950 shadow-md scale-105"
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden border-t border-slate-200/60 p-4 text-[11px] font-medium text-slate-500 md:block dark:border-white/[0.06] dark:text-slate-400">
          <div className="mb-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5"><div className="size-2.5 shrink-0 rounded-full bg-blue-500" /> Answered</div>
            <div className="flex items-center gap-1.5"><div className="size-2.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" /> Unanswered</div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5"><div className="size-2.5 shrink-0 rounded-full bg-amber-500" /> Marked for review</div>
            <div className="flex items-center gap-1.5"><div className="size-2.5 shrink-0 rounded-full border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10" /> Not submitted</div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex min-w-0 flex-1 flex-col pl-[80px] md:pl-[280px]">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-xl md:px-8 dark:border-white/[0.06] dark:bg-zinc-950/80">
          <div className="flex items-center gap-4">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 shadow-sm dark:bg-blue-500/10 dark:text-blue-400">
              {interviewDetails?.type ? `${interviewDetails.type.toUpperCase()}` : 'GENERAL'}
            </span>
            <span className="hidden md:inline text-sm font-semibold text-slate-500 dark:text-slate-400">
              {interviewDetails?.role || 'Interview Session'}
            </span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={toggleRecording}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold transition-colors",
                recording
                  ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-400 dark:hover:bg-white/10"
              )}
            >
              {recording ? (
                <><Square size={16} fill="currentColor" className="animate-pulse" /> Recording...</>
              ) : (
                <><Mic size={16} /> Record</>
              )}
            </button>
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-bold dark:bg-white/[0.06]">
              <Clock3 size={16} className={timeLeft < 300 ? "animate-pulse text-red-500" : "text-slate-500 dark:text-slate-400"} />
              <span className={timeLeft < 300 ? "text-red-500" : "text-slate-700 dark:text-slate-200"}>{formatTime(timeLeft)}</span>
            </div>
            <button onClick={() => finishTest(false)} className="inline-flex min-h-9 items-center rounded-xl bg-red-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-600">
              End Interview
            </button>
          </div>
        </header>

        {/* Content Split */}
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Left: Question */}
          <div className="flex-1 overflow-y-auto border-r border-slate-200/60 p-6 md:p-10 dark:border-white/[0.06]">
            <div className="exam-q-meta mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Question {currentQ + 1} of {questions.length}</h2>
              <div className="flex gap-2">
                <span className={cn(
                  "badge border px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm",
                  currentQuestionData?.difficulty === 'easy' ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400" :
                  currentQuestionData?.difficulty === 'hard' ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400" :
                  "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                )}>
                  {currentQuestionData?.difficulty || 'Medium'}
                </span>
                <button
                  onClick={() => setMarked({ ...marked, [currentQ]: !marked[currentQ] })}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold transition-colors dark:border-white/[0.06]",
                    marked[currentQ] 
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" 
                      : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/[0.03]"
                  )}
                >
                  <Flag size={14} fill={marked[currentQ] ? "currentColor" : "none"} />
                  {marked[currentQ] ? "Marked" : "Mark for review"}
                </button>
              </div>
            </div>
            
            <div className="prose prose-lg dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
              <p className="font-serif text-3xl leading-snug tracking-tight">
                {currentQuestionData?.questionText || "Loading question..."}
              </p>
            </div>
          </div>

          {/* Right: Answer Input */}
          <div className="flex w-full flex-col bg-slate-50 lg:w-[480px] dark:bg-zinc-950/50">
            <div className="flex items-center gap-2 border-b border-slate-200/60 px-6 py-4 text-sm font-semibold text-blue-600 dark:border-white/[0.06] dark:text-blue-400">
              <Mic size={16} /> Record or type your answer
            </div>
            
            <textarea
              className="flex-1 resize-none bg-transparent p-6 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-600"
              placeholder="Start speaking to transcribe, or type your answer here..."
              value={answers[currentQ] || ""}
              onChange={(e) => setAnswers({ ...answers, [currentQ]: e.target.value })}
            />
            
            
          </div>
        </div>

        {/* Bottom Bar Nav */}
        <footer className="sticky bottom-0 z-10 flex h-[80px] items-center justify-between border-t border-slate-200/60 bg-white/80 px-6 backdrop-blur-xl dark:border-white/[0.06] dark:bg-zinc-950/80">
          <button
            onClick={goToPrev}
            disabled={currentQ === 0}
            className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-white/[0.06]"
          >
            <ArrowLeft size={16} /> Previous
          </button>
          
          <button
            onClick={goToNext}
            disabled={currentQ === questions.length - 1}
            className="flex min-h-11 items-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Save & Next <ArrowRight size={16} />
          </button>
        </footer>
      </main>

      {/* Floating Camera Preview */}
      {recording && stream && (
        <div className="floating-camera absolute bottom-[92px] left-8 size-32 overflow-hidden rounded-full border-4 border-blue-500 shadow-2xl dark:border-blue-400">
          <div className="absolute right-[50%] top-2 size-2.5 -translate-x-[-50%] rounded-full border-2 border-white bg-red-500 shadow-sm z-10 animate-pulse" />
          <video
            ref={videoRef}
            autoPlay
            muted
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* End Session Confirmation Dialog */}
      {showEndDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm dark:bg-zinc-950/80">
          <div className="w-full max-w-md scale-100 rounded-2xl bg-white p-6 opacity-100 shadow-2xl transition-all dark:bg-zinc-900">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
              <AlertCircle className="text-red-600 dark:text-red-500" size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">End Interview?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to end the interview? You have unanswered questions. Unanswered questions will not be scored.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEndDialog(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowEndDialog(false);
                  finishTest(true);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
