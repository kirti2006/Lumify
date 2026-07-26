import { Link } from "react-router-dom";
import { Logo } from "../components/layout";

export function NotFound() {
  return (
    <main className="not-found">
      <Logo />
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link className="button" to="/">
        Back to home
      </Link>
    </main>
  );
}
