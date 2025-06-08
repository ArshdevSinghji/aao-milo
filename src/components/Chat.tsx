import { Avatar, Box, Stack, Typography } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../redux/hook";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

interface Message {
  id: string;
  text: string;
  senderId: string;
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
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setMessages(messages);
    });

    return () => unsub();
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
    setDoc(onlineRef, {
      isOnline: true,
      isTyping: false,
    });

    const chatRef = doc(db, "chats", chatId);

    if (!current) {
      console.error("Current user ID is not set.");
      return;
    }
    const sender = await getDoc(doc(db, "users", current));

    if (!user.userID) {
      confirm("User ID is not set.");
      return;
    }
    const receiver = await getDoc(doc(db, "users", user.userID));

    const senderData = sender.data();
    const receiverData = receiver.data();

    if (!senderData || !receiverData) {
      console.error("Sender or receiver data not found.");
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
      timestamp: serverTimestamp(),
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
          {isOnline ? (
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
          {message.map((msg) => {
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
          <Box flexGrow={1}>
            <input
              type="text"
              placeholder="Type a message"
              onChange={(e) => {
                setText(e.target.value);
                if (!current) return;
                const onlineRef = doc(db, "isOnline", current);
                setDoc(onlineRef, {
                  isOnline: true,
                  isTyping: true,
                });
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
          <Typography onClick={handleSend} sx={{ cursor: "pointer" }}>
            Send Message
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default Chat;
