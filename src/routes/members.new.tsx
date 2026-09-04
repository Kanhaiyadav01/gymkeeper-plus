import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shared/AppShell";
import { MemberForm, type MemberFormValues } from "@/features/members/components/MemberForm";
import { membersApi } from "@/features/members/api";
import { ApiClientError } from "@/lib/api/mock-store";

export const Route = createFileRoute("/members/new")({
  head: () => ({
    meta: [
      { title: "Add member — Fitking's Academy" },
      {
        name: "description",
        content:
          "Add a new gym member with their diary serial number, name, phone and joining date.",
      },
      { property: "og:title", content: "Add member — Fitking's Academy" },
      {
        property: "og:description",
        content: "Add a new gym member with serial number, name, phone and joining date.",
      },
    ],
  }),
  component: NewMemberPage,
});

function NewMemberPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: MemberFormValues) => membersApi.create(values),
    onSuccess: async (member) => {
      await queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success(`${member.name} added`, {
        description: `Member number ${member.memberNumber}.`,
      });
      void navigate({ to: "/members/$memberId", params: { memberId: member.id } });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiClientError ? error.message : "Couldn't save this member.",
      );
    },
  });

  const fieldError =
    mutation.error instanceof ApiClientError &&
    mutation.error.code === "MEMBER_NUMBER_ALREADY_EXISTS"
      ? { memberNumber: mutation.error.message }
      : undefined;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl">
        <header className="pt-6 pb-5">
          <Link
            to="/members"
            search={{ q: "", status: "all", sort: "recent", page: 1 }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Members
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Add member</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the serial number from your diary. You can record a membership next.
          </p>
        </header>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <MemberForm
            mode="create"
            submitting={mutation.isPending}
            fieldError={fieldError}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={() =>
              void navigate({
                to: "/members",
                search: { q: "", status: "all", sort: "recent", page: 1 },
              })
            }
            stickyActions
          />
        </div>
      </div>
    </AppShell>
  );
}
