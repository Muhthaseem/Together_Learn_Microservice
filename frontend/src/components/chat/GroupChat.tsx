"use client";
import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { groupsApi, filesApi, apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon } from "@heroicons/react/24/outline";

type ChatMessage = {
  messageId: string;
  userId: string;
  text: string;
  attachmentUrl: string | null;
  createdAt: string;
};

type WsStatus = "connecting" | "live" | "offline";

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/api$/, "");

export function GroupChat({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const clientRef = useRef<Client | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    groupsApi.messages.list(groupId).then(({ items }) => setMessages(items));
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("tl_token") : null;
    if (!token || !user) {
      setWsStatus("offline");
      return;
    }

    setWsStatus("connecting");
    const sockUrl = `${WS_BASE}/ws/chat?token=${encodeURIComponent(token)}`;

    const client = new Client({
      webSocketFactory: () => new SockJS(sockUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        setWsStatus("live");
        client.subscribe(`/topic/group/${groupId}`, (frame) => {
          const msg = JSON.parse(frame.body) as {
            messageId: string;
            authorId: string;
            content: string;
            attachmentUrl?: string;
            createdAt: string;
          };
          setMessages((prev) => [
            ...prev,
            {
              messageId: msg.messageId,
              userId: msg.authorId,
              text: msg.content,
              attachmentUrl: msg.attachmentUrl ?? null,
              createdAt: msg.createdAt,
            },
          ]);
        });
      },
      onDisconnect: () => setWsStatus("offline"),
      onStompError: () => setWsStatus("offline"),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [groupId, user]);

  useEffect(() => {
    const unknownIds = [...new Set(messages.map((m) => m.userId))].filter(
      (id) => id && id !== user?.userId && !userNames[id]
    );
    if (!unknownIds.length) return;
    unknownIds.forEach(async (id) => {
      try {
        const u = await apiGet<{ userId: string; name: string }>(`/users/${id}`);
        if (u?.name) setUserNames((prev) => ({ ...prev, [id]: u.name }));
      } catch {}
    });
  }, [messages]);

  const connected = wsStatus === "live";

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !pendingFile) || !clientRef.current?.connected) return;

    let attachmentUrl: string | undefined;
    if (pendingFile) {
      setUploading(true);
      try {
        const result = await filesApi.upload(pendingFile, "chat");
        attachmentUrl = result.url;
      } catch {
        // upload failed — send without attachment
      } finally {
        setUploading(false);
        setPendingFile(null);
      }
    }

    clientRef.current.publish({
      destination: `/app/chat/${groupId}`,
      body: JSON.stringify({ content: text || "📎", attachmentUrl }),
    });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPendingFile(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-[480px]">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium">Group Chat</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            wsStatus === "live"
              ? "bg-green-500/20 text-green-600"
              : wsStatus === "connecting"
              ? "bg-yellow-500/20 text-yellow-600"
              : "bg-red-500/20 text-red-500"
          }`}
        >
          {wsStatus === "live" ? "Live" : wsStatus === "connecting" ? "Connecting..." : "Offline"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {messages.length === 0 && (
          <div className="text-sm text-muted text-center py-8">No messages yet. Say hello!</div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.userId === user?.userId;
          return (
            <div key={msg.messageId} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  isOwn
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "bg-surface-2 text-text"
                }`}
              >
                {!isOwn && (
                  <div className="text-xs font-medium opacity-70 mb-1">
                    {userNames[msg.userId] ?? msg.userId.slice(0, 8)}
                  </div>
                )}
                {msg.text && msg.text !== "📎" && <div>{msg.text}</div>}
                {msg.attachmentUrl && (
                  <a
                    href={msg.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs underline mt-1 opacity-80"
                  >
                    <PaperClipIcon className="h-3 w-3" />
                    Attachment
                  </a>
                )}
                <div className="text-xs opacity-60 mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {pendingFile && (
        <div className="flex items-center gap-2 text-xs text-muted mb-2 px-1">
          <PaperClipIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">{pendingFile.name}</span>
          <button onClick={() => setPendingFile(null)}>
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!connected}
          className="h-10 w-10 rounded border border-token flex items-center justify-center hover:bg-surface-2 disabled:opacity-50 shrink-0"
          title="Attach file"
        >
          <PaperClipIcon className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            wsStatus === "live"
              ? "Type a message..."
              : wsStatus === "connecting"
              ? "Connecting to chat..."
              : "Chat offline — reconnecting..."
          }
          disabled={!connected || uploading}
          className="flex-1 h-10 rounded border border-token bg-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
        />
        <Button
          onClick={sendMessage}
          disabled={!connected || uploading || (!input.trim() && !pendingFile)}
          size="sm"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
