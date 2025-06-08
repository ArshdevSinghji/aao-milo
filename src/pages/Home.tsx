import { Stack } from "@mui/material";
import Chat from "../components/Chat";
import Contacts from "../components/Contacts";
import SideBar from "../components/SideBar";

const Home = () => {
  return (
    <Stack direction={"row"} height={"100vh"}>
      <SideBar />
      <Contacts />
      <Chat />
    </Stack>
  );
};

export default Home;
