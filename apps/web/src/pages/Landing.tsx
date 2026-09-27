import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, BadgeEuro, Clock3, MapPin } from "lucide-react";
import { APP_NAME } from "@/lib/data";
import { homeFor, useAuth, type Role } from "@/context/AuthContext";
import { Button, buttonBase } from "@/components/Primitives";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Landing() {
  const navigate = useNavigate();
  const { status, user, demoLogin } = useAuth();
  const signedIn = status === "signed-in" && user;

  async function goDemo(role: Role) {
    try {
      const account = await demoLogin(role);
      navigate(homeFor(account.role));
    } catch {
      toast.error("Couldn't start the demo session. Is the API running?");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="text-xl font-extrabold tracking-tight text-primary">{APP_NAME}</span>
        {signedIn ? (
          <Link to={homeFor(user.role)} className={cn(buttonBase, "h-9 bg-primary px-4 text-sm text-primary-foreground shadow-soft hover:bg-primary/90")}>
            Go to app <ArrowRight className="size-4" />
          </Link>
        ) : status === "signed-out" ? (
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <Link to="/signup" className={cn(buttonBase, "h-9 bg-primary px-4 text-sm text-primary-foreground shadow-soft hover:bg-primary/90")}>
              Sign up
            </Link>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16">
        <section className="pt-6 md:pt-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-1.5 text-xs font-bold text-mint-foreground">
            <MapPin className="size-3.5" /> Now live in Utrecht
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Find work that
            <br />
            actually fits your life.
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">
            Local part-time jobs matched to your availability, location and preferences. Clear pay.
            Clear hours. No endless searching.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <button
              onClick={() => navigate("/signup?role=WORKER")}
              className="group rounded-3xl bg-accent p-6 text-left shadow-lift transition-transform hover:-translate-y-0.5"
            >
              <span className="text-2xl">🙋</span>
              <h2 className="mt-3 text-xl font-extrabold text-accent-foreground">I want to work</h2>
              <p className="mt-1 text-sm text-accent-foreground/85">
                Tell us when and where. Get a short list of jobs that fit.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent-foreground">
                Start in 60 seconds <ArrowRight className="size-4" />
              </span>
            </button>

            <button
              onClick={() => navigate("/signup?role=BUSINESS")}
              className="group rounded-3xl bg-primary p-6 text-left shadow-lift transition-transform hover:-translate-y-0.5"
            >
              <span className="text-2xl">🏪</span>
              <h2 className="mt-3 text-xl font-extrabold text-primary-foreground">I'm hiring</h2>
              <p className="mt-1 text-sm text-primary-foreground/80">
                Post a shift and see local people who are actually free then.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary-foreground">
                Post a shift <ArrowRight className="size-4" />
              </span>
            </button>
          </div>

          {!signedIn ? (
            <div className="mt-5 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <span className="mr-1">Just looking? Try the demo</span>
              <Button variant="ghost" size="sm" onClick={() => goDemo("WORKER")}>
                As a worker
              </Button>
              <Button variant="ghost" size="sm" onClick={() => goDemo("BUSINESS")}>
                As a business
              </Button>
            </div>
          ) : null}
        </section>

        <section className="mt-14 grid gap-3 sm:grid-cols-3">
          {[
            { icon: BadgeEuro, title: "Pay upfront", text: "Every job shows the hourly rate. Always." },
            { icon: Clock3, title: "Exact hours", text: "The real days and times, before you apply." },
            { icon: MapPin, title: "Close to home", text: "Distance from you, in kilometres." },
          ].map((f) => (
            <div key={f.title} className="rounded-3xl bg-card p-5 shadow-soft">
              <f.icon className="size-5 text-accent" />
              <h3 className="mt-3 font-bold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        {APP_NAME} · a working name · Utrecht pilot
      </footer>
    </div>
  );
}
