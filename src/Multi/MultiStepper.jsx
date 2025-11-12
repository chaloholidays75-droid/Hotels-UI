import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { MultiContext } from "./MultiContext";
import Step1_Requisition from "./steps/Step1_Requisition";
import Step2_Quotation from "./steps/Step2_Quotation";
import Step3_RequestToBook from "./steps/Step3_RequestToBook";
import Step4_ClientConfirmation from "./steps/Step4_ClientConfirmation";
import Step5_Invoice from "./steps/Step5_Invoice";
import StepNavigation from "./components/StepNavigation";
import StepHeader from "./components/StepHeader";

/*
  MultiStepper.jsx
  ---------------------------------------------
  Master controller for rendering and navigating through 5 workflow steps.

  ✅ Automation (5):
  1) Auto-loads last active step on mount (session resume).
  2) Smooth fade-slide transitions between steps (no reload).
  3) Auto-scrolls to active step on change for focus.
  4) Saves currentStep persistently to localStorage (resume continuity).
  5) Animated completion badge when final step is done.
*/

export default function MultiStepper() {
  const { currentStep,STEP_IDS, stepStatus , actions} = useContext(MultiContext);
  const { setCurrentStep } = actions;
  const [transitioning, setTransitioning] = useState(false);
  const containerRef = useRef(null);

  // (1) Resume last step from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("multi.currentStep");
    if (saved && STEP_IDS.includes(saved)) setCurrentStep(saved);
  }, [setCurrentStep, STEP_IDS]);

  // (4) Persist step to localStorage
  useEffect(() => {
    localStorage.setItem("multi.currentStep", currentStep);
  }, [currentStep]);

  // (3) Auto scroll to top when step changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep]);

  // (2) Animate transitions
  useEffect(() => {
    setTransitioning(true);
    const t = setTimeout(() => setTransitioning(false), 300);
    return () => clearTimeout(t);
  }, [currentStep]);

  // Step component resolver
  const StepComponent = useMemo(() => {
    switch (currentStep) {
      case "requisition":
        return Step1_Requisition;
      case "quotation":
        return Step2_Quotation;
      case "requestToBook":
        return Step3_RequestToBook;
      case "clientConfirmation":
        return Step4_ClientConfirmation;
      case "invoice":
        return Step5_Invoice;
      default:
        return () => <div>Invalid Step</div>;
    }
  }, [currentStep]);

  // (5) Completion detection
  const allComplete = useMemo(
    () => STEP_IDS.every((sid) => stepStatus[sid]?.complete),
    [STEP_IDS, stepStatus]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6 transition-all duration-300"
    >
      <StepHeader />
      <StepNavigation />

      <div
        className={`transition-all duration-300 ${
          transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        <StepComponent />
      </div>

      {allComplete && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 text-emerald-600"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium text-sm">All Steps Completed 🎉</span>
          </div>
        </div>
      )}
    </div>
  );
}
