import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
    printingData: [],
    status: "idle",
    error: null
};

// Thunk to handle the printing request
export const createPrintingRequest = createAsyncThunk(
    "printing/createPrintingRequest",
    async ({  employee_id, name, type, email, date}) => {
        try {
            const response = await axios.post("http://localhost:8080/api/printing", {
                employee_id, 
                name, 
                type, 
                email,
                date
            });
            return response.data;
        } catch (error) {
            throw Error("Failed to create printing request");
        }
    }
);

const printingSlice = createSlice({
    name: "printing",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createPrintingRequest.pending, (state) => {
                state.status = "loading";
            })
            .addCase(createPrintingRequest.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.printingData.push(action.payload);
            })
            .addCase(createPrintingRequest.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    }
});

export default printingSlice.reducer;
