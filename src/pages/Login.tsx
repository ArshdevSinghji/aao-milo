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
import { auth } from "../config/firebase";
import { Toaster, toast } from "sonner";
import GoogleIcon from "@mui/icons-material/Google";
import { useNavigate } from "react-router-dom";

interface IFormState {
  email: string;
  password: string;
}

const Login = () => {
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      toast.success("User logged in succesfully!");
    } catch (err) {
      toast.error("Error logging in...");
    }
  };

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<IFormState>();

  const onSubmit = async (data: IFormState) => {
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      toast.success("User logged in succesfully!");
      reset();
      await new Promise(() =>
        setTimeout(() => {
          navigate("/home");
        }, 2000)
      );
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
