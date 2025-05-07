// src/utils/sessionStorage.js
export const loadState = () => {
    try {
        const serializedState = sessionStorage.getItem("reduxState");
        if (serializedState === null) return undefined; // No saved state in sessionStorage
        return JSON.parse(serializedState);
    } catch (e) {
        console.warn("Failed to load state from sessionStorage", e);
        return undefined;
    }
};

export const saveState = (state) => {
    try {
        const serializedState = JSON.stringify(state);
        sessionStorage.setItem("reduxState", serializedState);
    } catch (e) {
        console.warn("Failed to save state to sessionStorage", e);
    }
};

export const clearState = () => {
    try {
        sessionStorage.clear();
    } catch (e) {
        console.warn("Failed to clear sessionStorage", e);
    }
};
