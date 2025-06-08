import { Avatar, Box, Typography } from "@mui/material";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
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
}

const Contacts = () => {
  const currentUser = useAppSelector((state) => state.user);
  console.log("Current User:", currentUser);

  const selectedUser = useAppSelector((state) => state.chat);

  const dispatch = useAppDispatch();

  const [user, setUser] = useState<IUser[]>([]);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(
    null
  );

  //infinte scroll
  const fetchData = async () => {
    console.log("fetchData called...");
    const userQuery = lastVisible
      ? query(
          collection(db, "users"),
          orderBy("displayName"),
          startAfter(lastVisible),
          limit(10)
        )
      : query(collection(db, "users"), orderBy("email"), limit(10));

    const snapshot = await getDocs(userQuery);
    const users: IUser[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as IUser;
      if (data.uid !== currentUser.uid) {
        users.push(data);
      }
    });

    setAllUsers((prevUsers) => [...prevUsers, ...users]);
    setUser((prevUsers) => [...prevUsers, ...users]);

    setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);

    console.log("finished");
  };
  useEffect(() => {
    fetchData();
  }, []);
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
      fetchData();
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
              <Typography variant="body1">
                {item.displayName !== "Anonymous" || undefined
                  ? item.displayName
                  : item.email?.split("@")[0]}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Contacts;
