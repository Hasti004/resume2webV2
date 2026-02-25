import { useParams } from "react-router-dom";

export default function PublicPortfolio() {
  const { username } = useParams<{ username: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Public portfolio — @{username}</h1>
      <p className="text-muted-foreground">Public portfolio placeholder.</p>
    </div>
  );
}
