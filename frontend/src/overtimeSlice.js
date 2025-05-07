import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
    overtimeData: [],
    status: "idle",
    error: null
};

// Using fetch instead of axios
export const createOvertimeRequest = createAsyncThunk(
    "overtime/createOvertimeRequest",
    async ({ employeeName, position, date, start_time, end_time, duration, reason }) => {
        const response = await fetch("http://localhost:8080/api/overtime", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                employeeName,
                position,
                date,
                start_time,
                end_time,
                duration,
                reason,
            }),
        });

        // Handle the response
        if (!response.ok) {
            throw new Error('Network response was not ok' + response.statusText);
        }
        
        const data = await response.json();
        return data; // Return the data to be handled in the fulfilled case
    }
);

const overtimeSlice = createSlice({
    name: "overtime",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createOvertimeRequest.pending, (state) => {
                state.status = "loading";
            })
            .addCase(createOvertimeRequest.fulfilled, (state, action) => {
                state.status = "succeeded"; // Corrected from "succeed" to "succeeded"
                state.overtimeData.push(action.payload);
            })
            .addCase(createOvertimeRequest.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    }
});

export default overtimeSlice.reducer;
