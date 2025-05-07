// src/store.js
import { configureStore } from "@reduxjs/toolkit";
import dataReducer from "./dataSlice";
import authReducer from "./dataloginslice";
import leaveReducer from "./leaveSlice";
import overtimeReducer from "./overtimeSlice";
import { saveState, loadState, clearState } from "./utils/sessionStorage"; // Import sessionStorage utilities

// Middleware to persist state to sessionStorage on each state change
const persistMiddleware = (store) => (next) => (action) => {
    const result = next(action); // Process the action first
    const state = store.getState(); // Get the updated state after action

    saveState({
        auth: state.auth,      // Save specific slices as needed
        data: state.data,
        leave: state.leave,
        overtime: state.overtime,
    });

    return result;
};

// Load initial state from sessionStorage
const preloadedState = loadState();

export const store = configureStore({
    reducer: {
        data: dataReducer,
        auth: authReducer,
        leave: leaveReducer,
        overtime: overtimeReducer,
    },
    preloadedState, // Set initial state from sessionStorage
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(persistMiddleware),
});
