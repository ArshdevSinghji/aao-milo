import { Avatar, Box, Stack, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../redux/hook";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { getTimeCategory } from "../utils/getTimeCategory";
import EmojiPicker from "emoji-picker-react";

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId?: string;
  timestamp: Date;
}

interface IOnline {
  isOnline: boolean;
  isTyping: boolean;
}

const Chat = () => {
  const user = useAppSelector((state) => state.chat); //user selected for chat
  const current = useAppSelector((state) => state.user.uid); //current user ID
  const chatId = useAppSelector((state) => state.chat.chatId); //chatID
  const chatEnd = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const [message, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");
  const [isOnline, setIsOnline] = useState<IOnline>();
  const [open, setOpen] = useState<boolean>(false);

  //fetching chat messages
  useEffect(() => {
    if (!chatId) {
      console.error("Chat ID is not set.");
      return;
    }
    const messageRef = collection(db, "chats", chatId, "messages");
    const unsub = onSnapshot(messageRef, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Message;
        messages.push({
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          timestamp:
            data.timestamp &&
            typeof (data.timestamp as any).toDate === "function"
              ? (data.timestamp as any).toDate()
              : data.timestamp,
        });
      });
      messages.sort((a, b) => {
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return -1;
        if (!b.timestamp) return 1;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });
      setMessages(messages);
    });

    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const messageRef = collection(db, "chats", chatId, "messages");
    const unreadQuery = query(messageRef, where("isRead", "==", false));
    const unsub = onSnapshot(unreadQuery, (snapshot) => {
      snapshot.forEach(async (doc) => {
        const data = doc.data() as Message;
        if (data.receiverId === current) {
          await updateDoc(doc.ref, { isRead: true });
        }
      });
    });
    return () => {
      unsub();
    };
  }, [chatId]);

  // Fetch online status
  useEffect(() => {
    if (!user.userID) return;
    const onlineRef = doc(db, "isOnline", user.userID);
    const unsub = onSnapshot(onlineRef, (doc) => {
      const data = doc.data() as IOnline;
      if (data) {
        setIsOnline(data);
      } else {
        setIsOnline(undefined);
      }
    });
    return () => unsub();
  }, [user.userID]);

  const handleSend = async () => {
    if (!text.trim()) {
      return; // Prevent sending empty messages
    }
    if (!chatId) {
      console.error("Chat ID is not set.");
      return; // Prevent sending if chatId is not set
    }

    if (!user.userID) return;
    const onlineRef = doc(db, "isOnline", user.userID);
    setDoc(
      onlineRef,
      {
        isOnline: true,
        isTyping: false,
      },
      { merge: true }
    );

    const chatRef = doc(db, "chats", chatId);

    if (!current) {
      console.error("Current user ID is not set.");
      return;
    }

    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) {
      await setDoc(chatRef, {
        users: [current, user.userID],
        lastMessage: text,
        timestamp: serverTimestamp(),
      });
    } else {
      await updateDoc(chatRef, {
        lastMessage: text,
        timestamp: serverTimestamp(),
      });
    }

    const messageRef = collection(db, "chats", chatId, "messages");
    await addDoc(messageRef, {
      text: text,
      senderId: current,
      receiverId: user.userID,
      timestamp: serverTimestamp(),
      isRead: false,
    });

    setText("");
  };

  useEffect(() => {
    if (chatEnd.current) {
      chatEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (chatEnd.current) {
      chatEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [chatId]);

  if (!user?.userID || !current) {
    return (
      <Box flex={4} display={"flex"} flexDirection={"column"} padding={2}>
        <Typography variant="h6">Select a user to chat with</Typography>
      </Box>
    );
  }

  const groupedMessages: { [category: string]: Message[] } = {};
  message.forEach((msg) => {
    const date = msg.timestamp ? new Date(msg.timestamp) : null;
    const category = date ? getTimeCategory(date) : "Unknown";
    if (!groupedMessages[category]) groupedMessages[category] = [];
    groupedMessages[category].push(msg);
  });

  const handleEmoji = (emoji: { emoji: string }) => {
    setText((prev) => prev + emoji.emoji);
  };

  return (
    <Box flex={4} display={"flex"} flexDirection={"column"}>
      {/* top */}
      <Stack
        direction={"row"}
        alignItems={"center"}
        spacing={2}
        padding={2}
        borderBottom={"1px solid #ccc"}
        paddingBottom={2}
        sx={{
          position: "sticky",
          top: 0,
          backgroundColor: "#fff",
          zIndex: 1,
        }}
      >
        <Avatar src={user.photoURL} />
        <Box>
          <Typography variant="body1">{user.displayName}</Typography>
          {isOnline?.isOnline ? (
            <Typography variant="caption" color="green">
              {isOnline?.isTyping ? "Typing..." : "Online"}
            </Typography>
          ) : (
            <Typography variant="caption" color="gray">
              Offline
            </Typography>
          )}
        </Box>
      </Stack>
      {/* center */}
      <Box flex={1} overflow={"auto"}>
        <Stack spacing={2} padding={2}>
          {Object.entries(groupedMessages).map(([category, msgs]) => (
            <Box key={category}>
              <Typography
                variant="caption"
                color="primary"
                sx={{ textAlign: "center", display: "block", mb: 1, mt: 2 }}
              >
                {category}
              </Typography>
              {msgs.map((msg) => {
                const isCurrentUser = msg.senderId === current;
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      display: "flex",
                      flexDirection: isCurrentUser ? "row-reverse" : "row",
                      alignItems: "flex-end",
                    }}
                  >
                    {!isCurrentUser && (
                      <Avatar
                        src={user.photoURL}
                        sx={{
                          width: 32,
                          height: 32,
                          marginRight: 1,
                          marginLeft: 0.5,
                        }}
                      />
                    )}
                    <Box
                      sx={{
                        backgroundColor: isCurrentUser ? "#e0f7fa" : "#f5f5f5",
                        color: "#222",
                        padding: "10px 16px",
                        borderRadius: "16px",
                        borderTopLeftRadius: isCurrentUser ? "16px" : "4px",
                        borderTopRightRadius: isCurrentUser ? "4px" : "16px",
                        maxWidth: "70%",
                        boxShadow: 1,
                        mt: 1,
                        marginLeft: isCurrentUser ? "auto" : 0,
                        marginRight: isCurrentUser ? 0 : "auto",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ wordBreak: "break-word" }}
                      >
                        {msg.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ display: "block", textAlign: "right", mt: 0.5 }}
                      >
                        {msg.timestamp && msg.timestamp instanceof Date
                          ? msg.timestamp.toLocaleTimeString()
                          : ""}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Stack>
        <Box ref={chatEnd} />
      </Box>
      {/* bottom */}
      <Box mt={"auto"}>
        <Stack
          direction={"row"}
          alignItems={"center"}
          spacing={2}
          padding={2}
          borderTop={"1px solid #ccc"}
        >
          <AttachFileIcon />
          <Box flexGrow={1} position={"relative"}>
            <input
              type="text"
              placeholder="Type a message"
              onChange={(e) => {
                setText(e.target.value);
                if (!current) return;
                const onlineRef = doc(db, "isOnline", current);
                setDoc(
                  onlineRef,
                  {
                    isOnline: true,
                    isTyping: true,
                  },
                  { merge: true }
                );
                if (typingTimeout.current) clearTimeout(typingTimeout.current);
                typingTimeout.current = setTimeout(() => {
                  setDoc(onlineRef, {
                    isOnline: true,
                    isTyping: false,
                  });
                }, 1500);
              }}
              value={text}
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                outline: "none",
              }}
            />
          </Box>
          <Box position={"absolute"} bottom={"8%"} right={"1%"}>
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </Box>
          <EmojiEmotionsIcon
            onClick={() => setOpen((prev) => !prev)}
            sx={{ cursor: "pointer" }}
          />
          <Typography onClick={handleSend} sx={{ cursor: "pointer" }}>
            Send Message
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default Chat;
