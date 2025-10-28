"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarInset } from "@/components/ui/sidebar";
import { LayoutWithOnboarding } from "@/components/layout-with-onboarding";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { usePreference } from "@/app/contexts/PreferenceContext";
import { useSession } from "@/lib/auth-client";
import {
  Users,
  Crown,
  Shield,
  User,
  Mail,
  Calendar,
  RefreshCw,
  UserPlus,
  MoreVertical,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Member {
  user_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  role: string;
  joined_at: string;
  active: boolean;
}

interface MembersResponse {
  members: Member[];
  total_count: number;
}

export default function MembersPage() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { preference } = usePreference();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [memberToChangeRole, setMemberToChangeRole] = useState<Member | null>(
    null
  );
  const [newRole, setNewRole] = useState<string>("");

  const {
    data: membersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["organization", "members", preference?.organization_id],
    queryFn: async (): Promise<MembersResponse> => {
      const response = await authenticatedFetch("/api/organization/members");
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
    enabled: !!preference?.organization_id,
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await authenticatedFetch(
        `/api/organization/members/${userId}/role`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "members"] });
      toast.success("Member role updated successfully");
      setMemberToChangeRole(null);
      setNewRole("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await authenticatedFetch(
        `/api/organization/members/${userId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", "members"] });
      toast.success("Member removed successfully");
      setMemberToRemove(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "ADMIN":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ADMIN":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const isCurrentUserOwner = () => {
    if (!session?.user?.id || !membersData?.members) return false;
    const currentUserMember = membersData.members.find(
      (member) => member.user.id === session.user.id
    );
    return currentUserMember?.role === "OWNER";
  };

  return (
    <LayoutWithOnboarding>
      <SidebarInset>
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Users className="h-8 w-8" />
                Organization Members
              </h1>
              <p className="text-muted-foreground">
                Manage members who have access to your GitHub runner dashboard
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing || isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    membersData?.total_count || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active organization members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Owners</CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    membersData?.members.filter((m) => m.role === "OWNER")
                      .length || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Organization owners
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    membersData?.members.filter((m) => m.role === "ADMIN")
                      .length || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Organization administrators
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                All members who have access to this organization&apos;s runner
                dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Failed to load members
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : membersData?.members.length ? (
                <div className="space-y-4">
                  {membersData.members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={member.user.image}
                            alt={member.user.name}
                          />
                          <AvatarFallback>
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.user.name}</p>
                            <Badge
                              variant={getRoleBadgeVariant(member.role)}
                              className="text-xs"
                            >
                              <span className="mr-1">
                                {getRoleIcon(member.role)}
                              </span>
                              {member.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.user.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Joined {formatJoinDate(member.joined_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isCurrentUserOwner() && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setMemberToChangeRole(member);
                                setNewRole(member.role);
                              }}
                            >
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setMemberToRemove(member)}
                            >
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No members found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Members will appear here once they join the organization
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {memberToChangeRole && (
          <AlertDialog
            open={!!memberToChangeRole}
            onOpenChange={() => {
              setMemberToChangeRole(null);
              setNewRole("");
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change Member Role</AlertDialogTitle>
                <AlertDialogDescription>
                  Change the role for {memberToChangeRole.user.name} (
                  {memberToChangeRole.user.email})
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (newRole && memberToChangeRole) {
                      changeRoleMutation.mutate({
                        userId: memberToChangeRole.user_id,
                        role: newRole,
                      });
                    }
                  }}
                  disabled={
                    !newRole ||
                    newRole === memberToChangeRole.role ||
                    changeRoleMutation.isPending
                  }
                >
                  {changeRoleMutation.isPending ? "Updating..." : "Update Role"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {memberToRemove && (
          <AlertDialog
            open={!!memberToRemove}
            onOpenChange={() => setMemberToRemove(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove {memberToRemove.user.name}{" "}
                  from this organization? This will revoke their access to the
                  runner dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (memberToRemove) {
                      removeMemberMutation.mutate(memberToRemove.user_id);
                    }
                  }}
                  disabled={removeMemberMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {removeMemberMutation.isPending
                    ? "Removing..."
                    : "Remove Member"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </SidebarInset>
    </LayoutWithOnboarding>
  );
}
