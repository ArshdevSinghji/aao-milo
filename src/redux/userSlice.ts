import { createSlice } from "@reduxjs/toolkit";

interface UserState {
  email?: string;
  photoURL?: string;
  displayName?: string;
  uid?: string;
}

const initialState: UserState = {
  email: undefined,
  photoURL: undefined,
  displayName: undefined,
  uid: undefined,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { email, photoURL, displayName } = action.payload;
      state.email = email;
      state.photoURL = photoURL;
      state.displayName = displayName;
      state.uid = action.payload.uid;
    },
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
