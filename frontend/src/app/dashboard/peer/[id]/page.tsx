"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { peerApi, type PeerClass } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageContainer, SectionHeader } from "@/components/ui/Page";
import { AcademicCapIcon, CalendarIcon, ClockIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

export default function ClassDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [classItem, setClassItem] = useState<PeerClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await peerApi.get(id as string);
        setClassItem(data);
      } catch {
        toast.error("Failed to load class details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleJoin = async () => {
    if (!user || !classItem) return;
    setJoining(true);
    try {
      await peerApi.join(classItem.classId, user.userId);
      toast.success("Successfully joined the class!");
      // Refresh class data
      const updated = await peerApi.get(classItem.classId);
      setClassItem(updated);
    } catch {
      toast.error("Failed to join class");
    } finally {
      setJoining(false);
    }
  };

  const isParticipant = user && classItem && classItem.participants.includes(user.userId);
  const isTutor = user && classItem && classItem.tutorId === user.userId;

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted">Loading class details...</div>
        </div>
      </PageContainer>
    );
  }

  if (!classItem) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-muted mb-2">Class not found</div>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader 
        title={classItem.title} 
        subtitle={`${classItem.department} • ${classItem.courseModule}`}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="font-medium mb-3">Description</div>
            <div className="text-sm text-text-light whitespace-pre-wrap">{classItem.description}</div>
          </Card>

          <Card>
            <div className="font-medium mb-3">Participants ({classItem.participants.length})</div>
            <div className="space-y-2">
              {classItem.participants.length === 0 ? (
                <div className="text-sm text-muted">No participants yet</div>
              ) : (
                classItem.participants.map((participantId, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
                      <AcademicCapIcon className="h-4 w-4" />
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
                <span>{new Date(classItem.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ClockIcon className="h-4 w-4 text-muted" />
                <span>{classItem.time}</span>
              </div>
              {classItem.fee && (
                <div className="flex items-center gap-2 text-sm">
                  <CurrencyDollarIcon className="h-4 w-4 text-muted" />
                  <span>Rs. {classItem.fee}</span>
                </div>
              )}
            </div>
          </Card>

          {user && !isTutor && (
            <Card>
              <div className="font-medium mb-3">Actions</div>
              {isParticipant ? (
                <div className="text-sm text-muted">You&apos;re already in this class</div>
              ) : (
                <Button 
                  onClick={handleJoin} 
                  disabled={joining}
                  className="w-full"
                >
                  {joining ? "Joining..." : "Join Class"}
                </Button>
              )}
            </Card>
          )}

          {isTutor && (
            <Card>
              <div className="font-medium mb-3">Class Management</div>
              <div className="text-sm text-muted">You&apos;re teaching this class</div>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
