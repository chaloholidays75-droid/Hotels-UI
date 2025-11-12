// /src/Multi/MultiRoot.jsx
import React from "react";
import { MultiProvider } from "./MultiContext";
import MultiWorkflowManagement from "./MultiWorkflowManagement";

export default function MultiRoot() {
  return (
    <MultiProvider>
      <MultiWorkflowManagement />
    </MultiProvider>
  );
}
