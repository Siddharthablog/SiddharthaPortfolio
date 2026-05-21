import { createRoot } from "react-dom/client";
import { Route, Router } from "wouter";
import App from "./App";
import AIProjectsPage from "./pages/ai-projects";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Router>
    <Route path="/" component={App} />
    <Route path="/ai-projects" component={AIProjectsPage} />
  </Router>
);

// Made with Bob
