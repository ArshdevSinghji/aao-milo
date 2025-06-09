import { createSlice } from "@reduxjs/toolkit";

interface ChatState {
  chatId?: string;
  userID?: string;
  photoURL?: string;
  displayName?: string;
  email?: string;
  lastMessage?: string;
}

const initialState: ChatState = {
  chatId: undefined,
  userID: undefined,
  lastMessage: undefined,
  photoURL: undefined,
  displayName: undefined,
  email: undefined,
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChatId: (state, action) => {
      state.chatId = action.payload.chatId;
    },
    setUserId: (state, action) => {
      state.email = action.payload.email;
      state.photoURL = action.payload.photoURL;
      state.displayName = action.payload.displayName;
      state.userID = action.payload.userID;
    },
  },
});

export const { setChatId, setUserId } = chatSlice.actions;
export default chatSlice.reducer;
