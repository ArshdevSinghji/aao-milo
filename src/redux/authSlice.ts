import { createSlice } from "@reduxjs/toolkit";

interface AuthState {
  isAuth?: boolean;
}

const initialState: AuthState = {
  isAuth: false,
};

export const authSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.isAuth = action.payload.isAuth;
    },
  },
});

export const { setAuth } = authSlice.actions;
export default authSlice.reducer;
