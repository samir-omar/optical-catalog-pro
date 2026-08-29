import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/sales")({
  component: () => <Navigate to="/items" replace />,
});
