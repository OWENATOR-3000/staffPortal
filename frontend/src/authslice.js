import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
    user: JSON.parse(localStorage.getItem("userData")) || null, // Load user data from localStorage if available
    isAuthenticated: !!localStorage.getItem("authToken"), // Check token existence for initial auth state
    loading: true,
    error: null,
    position: localStorage.getItem("userPosition") || null, // Persist position
    userRoles: JSON.parse(localStorage.getItem("userRoles")) || [],  // Persist roles
    userPermissions: JSON.parse(localStorage.getItem("userPermissions")) || [], // Persist permissions
};

// Async thunk for logging in
export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async ({ username, password }, { rejectWithValue, dispatch }) => {
        try {
            const response = await axios.post("http://localhost:8080/api/login", {
                username,
                password,
            });

            // If login is successful, store token, user data, and permissions
            if (response.data.message === "Login successful") {
                const userId = response.data.user.id;
                localStorage.setItem("authToken", response.data.token); // Save token
                localStorage.setItem("userId", userId); // Save user ID
                localStorage.setItem("userData", JSON.stringify(response.data.user)); // Save user data
                localStorage.setItem("userPosition", response.data.user.Position); // Save position
                await dispatch(fetchUserPermissions(userId)); // Fetch permissions after login
                return response.data;
            }
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || "Login failed. Please try again."
            );
        }
    }
);

// Async thunk for fetching user roles
export const fetchUserRoles = createAsyncThunk(
    "auth/fetchUserRoles",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axios.get(`http://localhost:8080/roles/${id}`);
            localStorage.setItem("userRoles", JSON.stringify(response.data)); // Persist roles
            return response.data;
        } catch (err) {
            return rejectWithValue("Failed to fetch user roles");
        }
    }
);

// Async thunk for fetching user permissions
export const fetchUserPermissions = createAsyncThunk(
    "auth/fetchUserPermissions",
    async (id, { rejectWithValue }) => {
        try {
            const response = await axios.get(`http://localhost:8080/staff_permissions/${id}`);
            localStorage.setItem("userPermissions", JSON.stringify(response.data)); // Persist permissions
            return response.data;
        } catch (err) {
            return rejectWithValue("Failed to fetch user permissions");
        }
    }
);

// Async thunk to fetch user data on app load if token exists
export const fetchUserDataOnLoad = createAsyncThunk(
    "auth/fetchUserDataOnLoad",
    async (_, { rejectWithValue }) => {
        const token = localStorage.getItem("authToken");
        if (!token) return rejectWithValue("No auth token found");

        try {
            // Retrieve the user ID from localStorage
            const userId = localStorage.getItem("userId");
            if (!userId) throw new Error("User ID not found");

            // Fetch user data based on the user ID
            const response = await axios.get(`http://localhost:8080/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            localStorage.setItem("userData", JSON.stringify(response.data)); // Persist user data
            localStorage.setItem("userPosition", response.data.Position); // Persist position

            return response.data;
        } catch (err) {
            return rejectWithValue("Failed to fetch user data");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            // Clear localStorage and reset state on logout
            localStorage.removeItem("authToken");
            localStorage.removeItem("userId");
            localStorage.removeItem("userData");
            localStorage.removeItem("userPosition");
            localStorage.removeItem("userRoles");
            localStorage.removeItem("userPermissions");

            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
            state.position = null;
            state.userRoles = [];
            state.userPermissions = [];
        },
        setUserRoles: (state, action) => {
            state.userRoles = action.payload; // Set fetched roles
        },
        setUserPermissions: (state, action) => {
            state.userPermissions = action.payload; // Set fetched permissions
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                if (action.payload.message === "Login successful") {
                    state.isAuthenticated = true;
                    state.user = action.payload.user; // Store user object
                    state.position = action.payload.user.Position;
                } else {
                    state.error = action.payload.message;
                }
                state.loading = false;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.error = action.payload || "Failed to Login";
                state.loading = false;
            })
            .addCase(fetchUserRoles.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUserRoles.fulfilled, (state, action) => {
                state.userRoles = action.payload; // Set roles from fetched data
                state.loading = false;
            })
            .addCase(fetchUserRoles.rejected, (state, action) => {
                state.error = action.payload || "Failed to fetch user roles";
                state.loading = false;
            })
            .addCase(fetchUserPermissions.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUserPermissions.fulfilled, (state, action) => {
                state.userPermissions = action.payload.map(p => p.permission_id); // Assuming permission objects have 'permission_id'
                state.loading = false;
            })
            .addCase(fetchUserPermissions.rejected, (state, action) => {
                state.error = action.payload || "Failed to fetch user permissions";
                state.loading = false;
            })
            .addCase(fetchUserDataOnLoad.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUserDataOnLoad.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
                state.position = action.payload.Position;
                state.loading = false;
            })
            .addCase(fetchUserDataOnLoad.rejected, (state) => {
                state.isAuthenticated = false;
                state.loading = false;
            });
    },
});

export const { logout, setUserRoles, setUserPermissions } = authSlice.actions;
export default authSlice.reducer;
