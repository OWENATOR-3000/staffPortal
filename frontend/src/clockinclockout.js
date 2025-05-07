import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
    clockLog: [],
    status: 'idle',
    error: null
};

export const logClockAction = createAsyncThunk(
    'clock/logClockAction',
    async ({ action, time, date, userId }) => {
        const response = await axios.post('http://localhost:8080/api/clock', {
            action,
            time,
            date,
            userId,
        });
        return response.data;
    }
);

const clockSlice = createSlice({
    name: 'clock',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(logClockAction.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(logClockAction.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.clockLog.push(action.payload);  // Add new clock action to the log
            })
            .addCase(logClockAction.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export default clockSlice.reducer;