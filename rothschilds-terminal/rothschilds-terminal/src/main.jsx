import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import NexusTrade from "./NexusTrade";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <NexusTrade />
  </StrictMode>
);
