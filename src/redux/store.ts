import { configureStore } from "@reduxjs/toolkit";
import userReducers from "./userSlice";
import chatReducers from "./chatSlice";
export const store = configureStore({
  reducer: {
    user: userReducers,
    chat: chatReducers,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
