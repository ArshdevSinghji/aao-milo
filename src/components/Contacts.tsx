import { Avatar, Box, Typography } from "@mui/material";
import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { use, useEffect, useRef, useState } from "react";
import { db } from "../config/firebase";
import SearchIcon from "@mui/icons-material/Search";
import { useAppDispatch, useAppSelector } from "../redux/hook";
import { setChatId, setUserId } from "../redux/chatSlice";
import {
  Search,
  SearchIconWrapper,
  StyledInputBase,
} from "../utils/inputBaseAPI";
interface IUser {
  uid?: string;
  email?: string;
  photoURL?: string;
  displayName?: string;
  lastMessage?: string;
}

const Contacts = () => {
  const currentUser = useAppSelector((state) => state.user); //loggedin user
  const selectedUser = useAppSelector((state) => state.chat); //selected user for chat
  const chatID = useAppSelector((state) => state.chat.chatId); //chat ID for the selected user

  const dispatch = useAppDispatch();

  const [user, setUser] = useState<IUser[]>([]);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null); //for infinite scroll

  //infinte scroll
  // const fetchData = async () => {
  //   console.log("fetchData called...");
  //   const userQuery = lastVisible
  //     ? query(
  //         collection(db, "users"),
  //         orderBy("email"),
  //         startAfter(lastVisible),
  //         limit(6)
  //       )
  //     : query(collection(db, "users"), orderBy("email"), limit(6));
  //   return onSnapshot(userQuery, (snapshot) => {
  //     const users: IUser[] = [];
  //     snapshot.forEach((doc) => {
  //       const data = doc.data() as IUser;
  //       if (data.uid !== currentUser.uid) {
  //         users.push(data);
  //       }
  //     });

  //     setAllUsers((prevUsers) => [...prevUsers, ...users]);
  //     setUser((prevUsers) => [...prevUsers, ...users]);

  //     setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);

  //     console.log("finished");
  //   });
  // };
  // useEffect(() => {
  //   let unsubscribe: (() => void) | undefined;
  //   fetchData().then((unsub) => {
  //     unsubscribe = unsub;
  //   });
  //   return () => {
  //     if (unsubscribe) unsubscribe();
  //   };
  // }, []);

  //without infinite scroll
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const users: IUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as IUser;
        if (data.uid !== currentUser.uid) {
          users.push(data);
        }
      });
      setAllUsers(users);
      setUser(users);
    });
    return () => unsub();
  }, []);

  //count unread messages
  const [unreadCount, setUnreadCount] = useState<number>(0);
  useEffect(() => {
    if (!chatID || !currentUser?.uid) {
      console.error("Chat ID or current user is not set.");
      return;
    }
    const messageRef = collection(db, "chats", chatID, "messages");
    const unreadMessagesQuery = query(messageRef, where("isRead", "==", false));
    const unsub = onSnapshot(unreadMessagesQuery, (snapshot) => {
      const unreadCount = snapshot.docs.length;
      setUnreadCount(unreadCount);
    });
    return () => unsub();
  }, [chatID]);

  useEffect(() => {
    const setCount = async () => {
      try {
        if (!chatID) {
          console.error("Chat ID is not set.");
          return;
        }
        const chatRef = doc(db, "chats", chatID);
        await setDoc(chatRef, { unreadCount: unreadCount }, { merge: true });
      } catch (error) {
        console.error("Error setting unread count:", error);
      }
    };
    setCount();
  }, [unreadCount]);

  const [unreadCounts, setUnreadCounts] = useState<{ [uid: string]: number }>(
    {}
  );
  //fecthing unread messages count
  useEffect(() => {
    if (!currentUser?.uid) return;
    // Listen to all unread messages where current user is the receiver
    const q = query(
      collectionGroup(db, "messages"),
      where("isRead", "==", false),
      where("receiverId", "==", currentUser.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const counts: { [uid: string]: number } = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Count by senderId
        if (data.senderId) {
          counts[data.senderId] = (counts[data.senderId] || 0) + 1;
        }
      });
      setUnreadCounts(counts);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const containerRef = useRef<HTMLDivElement>(null); //when bottom of the scroll container is reached, fetch more data
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    if (
      container.scrollTop + container.offsetHeight >=
      container.scrollHeight
    ) {
      console.log("Reached bottom of the scroll container");
      if (!lastVisible) return;
      // fetchData();
    }
  };

  const handelClick = (clickedUser: IUser) => {
    console.log("User clicked:", clickedUser); // Set the selected user
    dispatch(
      setUserId({
        uid: clickedUser.uid,
        userID: clickedUser.uid,
        photoURL: clickedUser.photoURL,
        displayName: clickedUser.displayName,
        email: clickedUser.email,
      })
    );
  };

  useEffect(() => {
    if (selectedUser && currentUser?.uid && selectedUser?.userID) {
      const chatId =
        currentUser.uid > selectedUser.userID
          ? currentUser.uid + selectedUser.userID
          : selectedUser.userID + currentUser.uid;
      dispatch(
        setChatId({
          chatId: chatId,
        })
      );
    }
  }, [selectedUser, currentUser?.uid, dispatch]);

  //fetching last message
  const [lastMessage, setLastMessage] = useState<string>("");
  const [senderId, setSenderId] = useState<string>("");
  const [recieverId, setReceiverId] = useState<string>("");
  useEffect(() => {
    if (!chatID) {
      console.error("Chat ID is not set.");
      return;
    }
    const chatRef = doc(db, "chats", chatID);
    const unsub = onSnapshot(chatRef, (doc) => {
      setLastMessage(doc.data()?.lastMessage || "");
      setSenderId(doc.data()?.users[0] || "");
      setReceiverId(doc.data()?.users[1] || "");
    });
    return () => unsub();
  }, [chatID]);

  useEffect(() => {
    if (!senderId || !recieverId || !lastMessage) return;
    const senderRef = doc(db, "users", senderId);
    const receiverRef = doc(db, "users", recieverId);

    setDoc(senderRef, { lastMessage }, { merge: true });
    setDoc(receiverRef, { lastMessage }, { merge: true });
  }, [senderId, recieverId, lastMessage]);

  return (
    <Box
      flex={1}
      sx={{
        p: "16px 0 16px 16px",
        width: "300px",
        borderRight: "1px solid #ccc",
      }}
    >
      <Typography variant="h4" component={"h1"}>
        Messages
      </Typography>

      {/* Searching */}
      <Box mr={2} mt={2} mb={2}>
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            onChange={(e) => {
              const value = e.target.value.toLowerCase();
              setUser(
                allUsers.filter(
                  (item) =>
                    item.displayName?.toLowerCase().includes(value) ||
                    item.email?.toLowerCase().includes(value)
                )
              );
            }}
            placeholder="Search"
            inputProps={{ "aria-label": "search" }}
          />
        </Search>
      </Box>

      <Typography
        variant="subtitle1"
        component={"h2"}
        sx={{ marginTop: "20px" }}
      >
        Sort By
      </Typography>

      {/* Users */}
      <Box
        id="scrollContainer"
        ref={containerRef}
        maxHeight={"40%"}
        overflow={"auto"}
        onScroll={handleScroll}
      >
        {user.map((item, index) => {
          return (
            <Box
              key={index}
              onClick={() => handelClick(item)}
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "10px",
                borderBottom: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              <Avatar
                src={item.photoURL || ""}
                alt={item.displayName || "User Avatar"}
                sx={{ marginRight: "10px" }}
              />
              <Box>
                <Typography variant="body1">
                  {item.displayName !== "Anonymous" || undefined
                    ? item.displayName
                    : item.email?.split("@")[0]}
                </Typography>
                <Typography variant="caption">{item?.lastMessage}</Typography>
              </Box>
              <Box>
                {unreadCounts[item.uid ?? ""] > 0 ? (
                  <Typography variant="subtitle2">
                    {unreadCounts[item.uid ?? ""]}
                  </Typography>
                ) : (
                  <Typography variant="subtitle2"></Typography>
                )}
              </Box>{" "}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Contacts;
