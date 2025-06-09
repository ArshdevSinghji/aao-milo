import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../config/firebase";
import { collection, addDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { Toaster, toast } from "sonner";
import GoogleIcon from "@mui/icons-material/Google";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../redux/hook";
import { setUser } from "../redux/userSlice";
import { setAuth } from "../redux/authSlice";

interface IFormState {
  email: string;
  password: string;
}

const Login = () => {
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    try {
      const response = await signInWithPopup(auth, provider);
      toast.success("User logged in succesfully!");

      const userRef = doc(db, "users", response.user.uid);
      const onlineRef = doc(db, "isOnline", response.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: response.user.uid,
          email: response.user.email,
          displayName: response.user.displayName,
          photoURL: response.user.photoURL,
        });
      }
      // setting up online status
      await setDoc(onlineRef, {
        isOnline: true,
        isTyping: false,
      });

      dispatch(setAuth({ isAuth: true }));

      dispatch(
        setUser({
          email: response.user.email,
          photoURL: response.user.photoURL,
          displayName: response.user.displayName,
          uid: response.user.uid,
        })
      );

      await new Promise(() =>
        setTimeout(() => {
          navigate("/home");
        }, 2000)
      );
    } catch (err) {
      toast.error("Error logging in...");
    }
  };

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<IFormState>();

  const onSubmit = async (data: IFormState) => {
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);

      await addDoc(collection(db, "users"), {
        uid: auth.currentUser?.uid,
        email: data.email,
        displayName: auth.currentUser?.displayName || data.email.split("@")[0],
        photoURL: auth.currentUser?.photoURL || "",
      });

      toast.success("User created successfully!");
    } catch (err) {
      toast.error("Error logging in...");
    }
  };

  return (
    <>
      <Toaster position="top-right" duration={2000} theme="dark" />
      <Grid
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          {/* input form */}
          <Box component={"form"} onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2} alignItems={"center"}>
              <Typography component={"h1"} variant="subtitle1" m={1}>
                put in your credentials
              </Typography>

              <TextField
                size="small"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
                label="email Id"
                variant="outlined"
                error={!!errors.email}
                helperText={errors?.email?.message}
                required
              />

              <TextField
                size="small"
                {...register("password", { required: "Password is required" })}
                label="password"
                variant="outlined"
                type="password"
                error={!!errors.password}
                helperText={errors?.password?.message}
                required
              />

              <Button
                disabled={isSubmitting}
                variant="contained"
                type="submit"
                sx={{ bgcolor: "#000", m: 2 }}
                fullWidth
              >
                Sign in
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ m: 2 }}>or</Divider>

          {/* Sign in with google */}
          <Box>
            <Button
              startIcon={<GoogleIcon />}
              onClick={handleLogin}
              variant="outlined"
              fullWidth
            >
              Login With google
            </Button>
          </Box>
        </Paper>
      </Grid>
    </>
  );
};

export default Login;
