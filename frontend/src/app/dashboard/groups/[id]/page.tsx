"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { groupsApi, type GroupStudy } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageContainer, SectionHeader } from "@/components/ui/Page";
import { UserGroupIcon, MapPinIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupStudy | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await groupsApi.get(id as string);
        setGroup(data);
      } catch (error) {
        toast.error("Failed to load group details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleJoin = async () => {
    if (!user || !group) return;
    setJoining(true);
    try {
      await groupsApi.join(group.groupId, user.userId);
      toast.success("Successfully joined the group!");
      // Refresh group data
      const updated = await groupsApi.get(group.groupId);
      setGroup(updated);
    } catch (error) {
      toast.error("Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  const isParticipant = user && group && group.participants.includes(user.userId);
  const isCreator = user && group && group.creatorId === user.userId;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted">Loading group details...</div>
        </div>
      </PageContainer>
    );
  }

  if (!group) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-muted mb-2">Group not found</div>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader 
        title={group.title} 
        subtitle={`${group.department} • ${group.courseModule}`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="font-medium mb-3">Description</div>
            <div className="text-sm text-text-light whitespace-pre-wrap">{group.description}</div>
          </Card>

          <Card>
            <div className="font-medium mb-3">Participants ({group.participants.length})</div>
            <div className="space-y-2">
              {group.participants.length === 0 ? (
                <div className="text-sm text-muted">No participants yet</div>
              ) : (
                group.participants.map((participantId, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
                      <UserGroupIcon className="h-4 w-4" />
                    </div>
                    <span>Participant {index + 1}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="font-medium mb-3">Details</div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted" />
                <span>{new Date(group.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ClockIcon className="h-4 w-4 text-muted" />
                <span>{group.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPinIcon className="h-4 w-4 text-muted" />
                <span>{group.location}</span>
              </div>
            </div>
          </Card>

          {user && !isCreator && (
            <Card>
              <div className="font-medium mb-3">Actions</div>
              {isParticipant ? (
                <div className="text-sm text-muted">You're already in this group</div>
              ) : (
                <Button 
                  onClick={handleJoin} 
                  disabled={joining}
                  className="w-full"
                >
                  {joining ? "Joining..." : "Join Group"}
                </Button>
              )}
            </Card>
          )}

          {isCreator && (
            <Card>
              <div className="font-medium mb-3">Group Management</div>
              <div className="text-sm text-muted">You created this group</div>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
