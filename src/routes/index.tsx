import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({
      to: "/members",
      search: { q: "", status: "all", sort: "recent", page: 1 },
    });
  },
});
