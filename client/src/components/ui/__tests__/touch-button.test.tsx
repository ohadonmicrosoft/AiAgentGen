import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { TouchButton } from "../touch-button";

// Mock the required hooks
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: jest.fn().mockReturnValue(false), // Default to non-mobile
}));

jest.mock("@/hooks/use-haptic", () => ({
  useHaptic: jest.fn().mockReturnValue({
    triggerLightFeedback: jest.fn(),
    triggerMediumFeedback: jest.fn(),
    triggerHeavyFeedback: jest.fn(),
    triggerSuccessFeedback: jest.fn(),
    triggerWarningFeedback: jest.fn(),
    triggerErrorFeedback: jest.fn(),
  }),
}));

jest.mock("@/hooks/animations/useReducedMotion", () => ({
  useReducedMotion: jest.fn().mockReturnValue(false), // Default to animations enabled
}));

jest.mock("@/hooks/use-fluid-spacing", () => ({
  useFluidSpacing: jest.fn().mockReturnValue({
    getSpacing: jest.fn().mockReturnValue("0.5rem"),
  }),
}));

// Mock framer-motion to avoid animation-related issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<"div">) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.ComponentProps<"div">) => (
    <>{children}</>
  ),
}));

describe("TouchButton Component", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with children correctly", () => {
    render(<TouchButton>Click Me</TouchButton>);
    expect(screen.getByRole("button")).toHaveTextContent("Click Me");
  });

  it("renders with specified variant and size", () => {
    const { rerender } = render(
      <TouchButton variant="destructive" size="sm">
        Click Me
      </TouchButton>,
    );

    // Check that classes are applied
    const button = screen.getByRole("button");
    expect(button).toHaveClass("destructive");
    expect(button).toHaveClass("sm");

    rerender(
      <TouchButton variant="outline" size="lg">
        Click Me
      </TouchButton>,
    );
    expect(button).toHaveClass("outline");
    expect(button).toHaveClass("lg");
  });

  it("handles click events correctly", () => {
    const handleClick = jest.fn();
    render(<TouchButton onClick={handleClick}>Click Me</TouchButton>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is set", () => {
    render(<TouchButton disabled>Click Me</TouchButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies ripple effect when showRipple is true", () => {
    render(<TouchButton showRipple>Click Me</TouchButton>);

    // Trigger a click to create ripple
    fireEvent.mouseDown(screen.getByRole("button"), {
      clientX: 50,
      clientY: 50,
    });

    // Check for the presence of ripple container
    expect(screen.getByTestId("motion-div")).toBeInTheDocument();
  });

  it("handles touch events correctly", () => {
    const handleClick = jest.fn();
    render(<TouchButton onClick={handleClick}>Touch Me</TouchButton>);

    // Simulate touch events
    fireEvent.touchStart(screen.getByRole("button"));
    fireEvent.touchEnd(screen.getByRole("button"));

    // The click handler should not be called until an actual click
    expect(handleClick).not.toHaveBeenCalled();

    // Then simulate a click
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom className correctly", () => {
    render(<TouchButton className="custom-class">Click Me</TouchButton>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });
});
