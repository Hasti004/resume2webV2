import { useParams } from "react-router-dom";

export default function PortfolioView() {
  const { siteId } = useParams<{ siteId: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Portfolio — {siteId}</h1>
      <p className="text-muted-foreground">Portfolio view placeholder.</p>
    </div>
  );
}
