import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProjectList } from "@/components/ProjectList";
import { ProjectCardGrid } from "@/components/ProjectCardGrid";
import { FileUp, Link2, FilePlus } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="min-h-screen w-full max-w-7xl px-6 py-12 mx-auto">
        <div className="mb-12 text-center">
          <h1 className="heading-font mb-4 text-5xl font-bold tracking-[-0.025em] text-foreground md:text-6xl">
            <span className="pink-highlight">New work done?</span>
            <br />
            Let&apos;s update everything.
          </h1>
          <p className="text-lg text-muted-foreground">
            Keep your portfolio fresh with the latest updates.
          </p>
        </div>
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          <Button size="lg" onClick={() => navigate("/dashboard/create")}>
            <FileUp className="mr-2 h-4 w-4" /> Upload Resume
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/dashboard/sync")}>
            <Link2 className="mr-2 h-4 w-4" /> Sync Profiles
          </Button>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-3xl font-bold text-foreground">Your Resumes</h2>
            <p className="mt-1 text-muted-foreground">
              Continue working on your saved resumes or create a new one
            </p>
            <div className="mt-4">
              <ProjectList />
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Your Projects</h2>
                <p className="mt-1 text-muted-foreground">
                  Continue working on your resumes
                </p>
              </div>
              <Button onClick={() => navigate("/dashboard/create")} className="gap-2">
                <FilePlus className="h-4 w-4" /> New Project
              </Button>
            </div>
            <div className="mt-6">
              <ProjectCardGrid />
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
