import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
    data: [],
    status: "idle",
    error: null
}

export const createData = createAsyncThunk(
    "data/createData",
    async ({ firstname, surname, id_Number, Gender, DOB, nationality, homeLanguage, otherLanguages, position, Supervisor, profileImg, password }) => {
        const response = await axios.post("http://localhost:8080/api/data", {
            firstname, 
            surname, 
            id_Number,
            Gender,
            DOB,
            nationality, 
            homeLanguage, 
            otherLanguages, 
            position, 
            Supervisor,
            profileImg,
            password
        });
        return response.data;
    }
)

const dataSlice = createSlice({
    name: "data",
    initialState,
    reducers: {
        setUser(state, action) {
            state.userId = action.payload;
            sessionStorage.setItem("userId", action.payload); // Save user ID in sessionStorage
        },
        clearUser(state) {
            state.userId = null;
            sessionStorage.removeItem("userId"); // Clear user ID from sessionStorage
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createData.pending, (state) => {
                state.status = "loading";
            })
            .addCase(createData.fulfilled, (state, action) => {
                console.log(action.payload);
                state.status = "succeeded";
                state.data.push(action.payload);
                if(action.payload.id){
                    state.userId = action.payload.id;
                    sessionStorage.setItem("userId", action.payload.id); // Save user ID in sessionStorage
                }
            })
            .addCase(createData.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    },
});

export const { setUser, clearUser } = dataSlice.actions;
export default dataSlice.reducer;
