import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
    leaveData: [],
    status: "idle",
    error: null
};

export const createLeaveRequest = createAsyncThunk(
    "leave/createLeaveRequest",
    async ({employeeName,position,date,supervisorName,startDate,endDate,totalDays,reason,resumingWorkDay,emergencyName,emergencyAddress,emergencyPhone}) => {
        const response = await axios.post("http://localhost:8080/api/leave", {
            employeeName,
            position,
            date,
            supervisorName,
            startDate,
            endDate,
            totalDays,
            reason,
            resumingWorkDay,
            emergencyName,
            emergencyAddress,
            emergencyPhone
        });
        return response.data;
    }
);

const leaveSlice = createSlice({
    name: "leave",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createLeaveRequest.pending, (state) => {
                state.status = "loading";
            })
            .addCase(createLeaveRequest.fulfilled, (state, action) => {
                state.status = "succeed";
                state.leaveData.push(action.payload);
            })
            .addCase(createLeaveRequest.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
            });
    }
});

export default leaveSlice.reducer;