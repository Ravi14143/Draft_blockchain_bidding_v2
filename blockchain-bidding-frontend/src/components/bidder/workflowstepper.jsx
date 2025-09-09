// WorkflowStepper.jsx
import {
  FileText,
  Lock,
  Upload,
  Clock,
  Search,
  Award,
  Briefcase,
  CheckCircle2,
} from "lucide-react"

const stepIcons = [
  FileText,      // Draft Created
  Lock,          // Blockchain Recorded
  Upload,        // Published
  Clock,         // Bidding Active
  Search,        // Evaluation
  Award,         // Contract Awarded
  Briefcase,     // Project Execution
  CheckCircle2,  // Completed
]

export default function WorkflowStepper({ steps, currentStep }) {
  return (
    <div className="relative flex items-center w-full">
      {/* Connector Line (background) */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 -translate-y-1/2 z-0" />
      <div
        className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 z-0 transition-all duration-500"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      />

      {/* Steps */}
      {steps.map((step, index) => {
        const Icon = stepIcons[index] || FileText
        const isCompleted = index < currentStep
        const isActive = index === currentStep

        return (
          <div
            key={index}
            className="relative z-10 flex flex-col items-center flex-1 text-center"
          >
            {/* Step Circle */}
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full shadow-md transition-colors duration-300 ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isActive
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>

            {/* Step Label */}
            <span
              className={`mt-3 text-sm font-medium ${
                isCompleted
                  ? "text-green-600"
                  : isActive
                  ? "text-blue-600"
                  : "text-gray-500"
              }`}
            >
              {step}
            </span>
          </div>
        )
      })}
    </div>
  )
}
