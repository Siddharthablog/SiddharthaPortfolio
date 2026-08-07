import { Analytics } from "@vercel/analytics/react";
import { createRoot } from "react-dom/client";
import { Route, Router } from "wouter";
import App from "./App";
import AIProjectsPage from "./pages/ai-projects";
import DocOpsPage from "./pages/docops";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <>
    <Router>
      <Route path="/" component={App} />
      <Route path="/ai-projects" component={AIProjectsPage} />
      <Route path="/docops" component={DocOpsPage} />
    </Router>
    <Analytics />
  </>
);

// Made with Bob
